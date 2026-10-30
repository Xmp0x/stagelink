import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";
import { canStudentWithdraw, type ApplicationStatus } from "@/lib/applications/stateMachine";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(["STUDENT"], req);
    const applicationId = params.id;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        student: true,
        internship: {
          include: {
            company: {
              include: { memberships: { select: { userId: true } } },
            },
          },
        },
      },
    });

    if (!application) {
      return apiError("Application not found.", "NOT_FOUND", 404);
    }

    if (application.student.userId !== session.userId) {
      return apiError("Application does not belong to you.", "FORBIDDEN", 403);
    }

    if (!canStudentWithdraw(application.status as ApplicationStatus)) {
      return apiError(
        `Cannot withdraw application currently in ${application.status} state.`,
        "INVALID_STATE",
        400
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.application.update({
        where: { id: applicationId },
        data: { status: "WITHDRAWN" },
      });

      await tx.applicationEvent.create({
        data: {
          applicationId,
          fromStatus: application.status,
          toStatus: "WITHDRAWN",
          note: "Application withdrawn by candidate.",
          actorUserId: session.userId,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: session.userId,
          action: "APPLICATION_WITHDRAWN",
          targetType: "Application",
          targetId: applicationId,
        },
      });

      // Notify company recruiters
      for (const m of application.internship.company.memberships) {
        await tx.notification.create({
          data: {
            recipientId: m.userId,
            title: `Application Withdrawn: ${application.internship.title}`,
            message: `${application.student.firstName} ${application.student.lastName} has withdrawn their application.`,
            type: "APPLICATION_STATUS",
            data: JSON.stringify({ applicationId }),
          },
        });
      }

      return res;
    });

    return apiSuccess({
      message: "Application successfully withdrawn.",
      application: updated,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
