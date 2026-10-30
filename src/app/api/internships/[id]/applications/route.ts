import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

const submitApplicationSchema = z.object({
  coverNote: z.string().max(3000).optional().nullable(),
  cvDocumentId: z.string().optional().nullable(),
  explicitConfirmation: z.literal(true, {
    errorMap: () => ({ message: "Explicit student confirmation is required before submitting an application." }),
  }),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(["STUDENT"], req);
    const internshipId = params.id;

    const body = await req.json();
    const data = submitApplicationSchema.parse(body);

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
      include: {
        cvDocuments: { where: { activeVersion: true }, take: 1 },
      },
    });

    if (!profile) {
      return apiError("Student profile not found.", "NOT_FOUND", 404);
    }

    // Verify internship exists and is active
    const internship = await prisma.internship.findUnique({
      where: { id: internshipId },
      include: {
        company: {
          include: { memberships: { select: { userId: true } } },
        },
      },
    });

    if (!internship) {
      return apiError("Internship opportunity not found.", "NOT_FOUND", 404);
    }

    if (
      internship.status !== "PUBLISHED" ||
      internship.company.status !== "VERIFIED" ||
      internship.deadlineDate.getTime() < Date.now()
    ) {
      return apiError("This internship is no longer accepting applications.", "FORBIDDEN", 403);
    }

    // Duplicate check: hard constraint
    const existing = await prisma.application.findUnique({
      where: {
        studentId_internshipId: {
          studentId: profile.id,
          internshipId,
        },
      },
    });

    if (existing) {
      return apiError(
        "You have already submitted an application for this internship position.",
        "CONFLICT",
        409
      );
    }

    // Resolve CV document (either specified or latest active)
    let selectedCvId = data.cvDocumentId;
    if (!selectedCvId && profile.cvDocuments.length > 0) {
      selectedCvId = profile.cvDocuments[0].id;
    }

    const application = await prisma.$transaction(async (tx) => {
      const created = await tx.application.create({
        data: {
          studentId: profile.id,
          internshipId,
          cvDocumentId: selectedCvId || null,
          coverNote: data.coverNote || null,
          status: "SUBMITTED",
        },
      });

      // Create initial timeline event
      await tx.applicationEvent.create({
        data: {
          applicationId: created.id,
          fromStatus: null,
          toStatus: "SUBMITTED",
          note: "Application submitted by candidate with explicit confirmation.",
          actorUserId: session.userId,
        },
      });

      // Audit event
      await tx.auditEvent.create({
        data: {
          actorUserId: session.userId,
          action: "APPLICATION_SUBMITTED",
          targetType: "Application",
          targetId: created.id,
          metadata: JSON.stringify({
            internshipId,
            companyId: internship.companyId,
            hasCV: Boolean(selectedCvId),
          }),
        },
      });

      // Notify company recruiters
      for (const m of internship.company.memberships) {
        await tx.notification.create({
          data: {
            recipientId: m.userId,
            title: `New Candidate Application: ${internship.title}`,
            message: `${profile.firstName} ${profile.lastName} applied for ${internship.title}.`,
            type: "APPLICATION_STATUS",
            data: JSON.stringify({
              applicationId: created.id,
              internshipId,
              studentId: profile.id,
            }),
          },
        });
      }

      return created;
    });

    return apiSuccess(
      {
        message: "Application submitted successfully!",
        application,
      },
      201
    );
  } catch (err) {
    return handleApiError(err);
  }
}
