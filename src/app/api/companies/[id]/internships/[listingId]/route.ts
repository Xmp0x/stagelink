import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCompanyMembership } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

const updateListingSchema = z.object({
  title: z.string().min(3).optional(),
  department: z.string().optional().nullable(),
  sector: z.string().min(2).optional(),
  city: z.string().min(2).optional(),
  modality: z.enum(["REMOTE", "ONSITE", "HYBRID"]).optional(),
  durationWeeks: z.number().int().min(2).max(52).optional(),
  startMonth: z.string().optional().nullable(),
  deadlineDate: z.string().datetime().optional(),
  openPositions: z.number().int().min(1).optional(),
  description: z.string().min(30).optional(),
  requirements: z.string().optional().nullable(),
  isPaid: z.boolean().optional(),
  stipendAmount: z.number().min(0).optional().nullable(),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "PAUSED", "CLOSED"]).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; listingId: string } }
) {
  try {
    const { id: companyId, listingId } = params;
    await requireCompanyMembership(companyId, req);

    const listing = await prisma.internship.findFirst({
      where: { id: listingId, companyId },
      include: {
        skills: { include: { skill: true } },
        _count: {
          select: { applications: true, savedByStudents: true },
        },
      },
    });

    if (!listing) {
      return apiError("Listing not found or does not belong to this company.", "NOT_FOUND", 404);
    }

    return apiSuccess({ listing });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; listingId: string } }
) {
  try {
    const { id: companyId, listingId } = params;
    const { session } = await requireCompanyMembership(companyId, req);

    const existing = await prisma.internship.findFirst({
      where: { id: listingId, companyId },
      include: { company: true },
    });

    if (!existing) {
      return apiError("Listing not found or does not belong to this company.", "NOT_FOUND", 404);
    }

    const body = await req.json();
    const data = updateListingSchema.parse(body);

    // If changing to PENDING_REVIEW, verify company is verified
    if (data.status === "PENDING_REVIEW" && existing.company.status !== "VERIFIED") {
      return apiError(
        "Company must be verified before submitting listings for moderation.",
        "FORBIDDEN",
        403
      );
    }

    const updated = await prisma.internship.update({
      where: { id: listingId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.department !== undefined && { department: data.department }),
        ...(data.sector && { sector: data.sector }),
        ...(data.city && { city: data.city }),
        ...(data.modality && { modality: data.modality }),
        ...(data.durationWeeks !== undefined && { durationWeeks: data.durationWeeks }),
        ...(data.startMonth !== undefined && { startMonth: data.startMonth }),
        ...(data.deadlineDate && { deadlineDate: new Date(data.deadlineDate) }),
        ...(data.openPositions !== undefined && { openPositions: data.openPositions }),
        ...(data.description && { description: data.description }),
        ...(data.requirements !== undefined && { requirements: data.requirements }),
        ...(data.isPaid !== undefined && { isPaid: data.isPaid }),
        ...(data.stipendAmount !== undefined && { stipendAmount: data.stipendAmount }),
        ...(data.status && { status: data.status }),
      },
      include: {
        skills: { include: { skill: true } },
      },
    });

    // Record audit event
    await prisma.auditEvent.create({
      data: {
        actorUserId: session.userId,
        action: "INTERNSHIP_LISTING_UPDATED",
        targetType: "Internship",
        targetId: listingId,
        metadata: JSON.stringify({ changes: Object.keys(data), newStatus: updated.status }),
      },
    });

    return apiSuccess({ listing: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
