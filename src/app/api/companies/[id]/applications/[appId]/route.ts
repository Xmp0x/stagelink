import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCompanyMembership } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";
import { isValidStatusTransition, type ApplicationStatus } from "@/lib/applications/stateMachine";

export const dynamic = "force-dynamic";

const transitionStatusSchema = z.object({
  status: z.enum(["UNDER_REVIEW", "SHORTLISTED", "INTERVIEW", "ACCEPTED", "REJECTED"]),
  note: z.string().max(1000).optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; appId: string } }
) {
  try {
    const { id: companyId, appId } = params;
    const { session } = await requireCompanyMembership(companyId, req);

    const body = await req.json();
    const data = transitionStatusSchema.parse(body);

    const application = await prisma.application.findUnique({
      where: { id: appId },
      include: {
        internship: { include: { company: true } },
        student: { select: { id: true, userId: true, firstName: true, lastName: true } },
      },
    });

    if (!application) {
      return apiError("Application not found.", "NOT_FOUND", 404);
    }

    if (application.internship.companyId !== companyId) {
      return apiError(
        "Application does not belong to your organization's listings.",
        "FORBIDDEN",
        403
      );
    }

    // Validate state machine transition
    const currentStatus = application.status as ApplicationStatus;
    if (!isValidStatusTransition(currentStatus, data.status)) {
      return apiError(
        `Invalid status transition from ${currentStatus} to ${data.status}.`,
        "INVALID_STATE_TRANSITION",
        400
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.application.update({
        where: { id: appId },
        data: { status: data.status },
      });

      // Append event to audit timeline
      await tx.applicationEvent.create({
        data: {
          applicationId: appId,
          fromStatus: currentStatus,
          toStatus: data.status,
          note: data.note || `Status transitioned to ${data.status.replace("_", " ")}.`,
          actorUserId: session.userId,
        },
      });

      // Audit event
      await tx.auditEvent.create({
        data: {
          actorUserId: session.userId,
          action: "APPLICATION_STATUS_UPDATED",
          targetType: "Application",
          targetId: appId,
          metadata: JSON.stringify({
            from: currentStatus,
            to: data.status,
            note: data.note,
          }),
        },
      });

      // Notify candidate once
      const statusLabels: Record<string, string> = {
        UNDER_REVIEW: "is currently under review",
        SHORTLISTED: "has been shortlisted",
        INTERVIEW: "has advanced to the interview stage",
        ACCEPTED: "has been accepted! 🎉",
        REJECTED: "was not selected at this time",
      };

      await tx.notification.create({
        data: {
          recipientId: application.student.userId,
          title: `Application Update: ${application.internship.title}`,
          message: `Your application to ${application.internship.company.legalName} ${
            statusLabels[data.status] || "was updated"
          }.${data.note ? ` Note: ${data.note}` : ""}`,
          type: "APPLICATION_STATUS",
          data: JSON.stringify({
            applicationId: appId,
            internshipId: application.internshipId,
            status: data.status,
          }),
        },
      });

      return res;
    });

    return apiSuccess({
      message: `Candidate status updated to ${data.status.replace("_", " ")}.`,
      application: updated,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
