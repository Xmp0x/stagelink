import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCompanyMembership } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

const createListingSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  department: z.string().optional().nullable(),
  sector: z.string().min(2, "Sector is required."),
  city: z.string().min(2, "City is required."),
  modality: z.enum(["REMOTE", "ONSITE", "HYBRID"]).default("ONSITE"),
  durationWeeks: z.number().int().min(2).max(52).default(8),
  startMonth: z.string().optional().nullable(),
  deadlineDate: z.string().datetime("Valid ISO deadline date is required."),
  openPositions: z.number().int().min(1).default(1),
  description: z.string().min(30, "Description must be at least 30 characters."),
  requirements: z.string().optional().nullable(),
  isPaid: z.boolean().default(false),
  stipendAmount: z.number().min(0).optional().nullable(),
  status: z.enum(["DRAFT", "PENDING_REVIEW"]).default("PENDING_REVIEW"),
  skills: z
    .array(
      z.object({
        name: z.string().min(1),
        isRequired: z.boolean().default(true),
      })
    )
    .default([]),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id;
    await requireCompanyMembership(companyId, req);

    const listings = await prisma.internship.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: {
        skills: { include: { skill: true } },
        _count: {
          select: {
            applications: true,
            savedByStudents: true,
          },
        },
      },
    });

    return apiSuccess({ listings });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id;
    const { session } = await requireCompanyMembership(companyId, req);

    // Verify company status
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, status: true, legalName: true },
    });

    if (!company) {
      return apiError("Company not found.", "NOT_FOUND", 404);
    }

    if (company.status !== "VERIFIED") {
      return apiError(
        "Your organization must be verified by platform administrators before creating internship listings.",
        "FORBIDDEN",
        403
      );
    }

    const body = await req.json();
    const data = createListingSchema.parse(body);

    const deadline = new Date(data.deadlineDate);
    if (deadline.getTime() <= Date.now()) {
      return apiError("Deadline date must be in the future.", "VALIDATION_FAILED", 400);
    }

    const listing = await prisma.$transaction(async (tx) => {
      const created = await tx.internship.create({
        data: {
          companyId,
          title: data.title,
          department: data.department,
          sector: data.sector,
          city: data.city,
          modality: data.modality,
          durationWeeks: data.durationWeeks,
          startMonth: data.startMonth,
          deadlineDate: deadline,
          openPositions: data.openPositions,
          description: data.description,
          requirements: data.requirements,
          isPaid: data.isPaid,
          stipendAmount: data.isPaid ? data.stipendAmount : null,
          status: data.status,
        },
      });

      // Link skills
      for (const item of data.skills) {
        const canonicalName = item.name.trim();
        if (!canonicalName) continue;

        const skill = await tx.skill.upsert({
          where: { name: canonicalName },
          update: {},
          create: { name: canonicalName },
        });

        await tx.internshipSkill.create({
          data: {
            internshipId: created.id,
            skillId: skill.id,
            isRequired: item.isRequired,
          },
        });
      }

      // Record audit event
      await tx.auditEvent.create({
        data: {
          actorUserId: session.userId,
          action: "INTERNSHIP_LISTING_CREATED",
          targetType: "Internship",
          targetId: created.id,
          metadata: JSON.stringify({
            title: data.title,
            status: data.status,
            city: data.city,
          }),
        },
      });

      return created;
    });

    const fullListing = await prisma.internship.findUnique({
      where: { id: listing.id },
      include: {
        skills: { include: { skill: true } },
      },
    });

    return apiSuccess({ listing: fullListing }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
