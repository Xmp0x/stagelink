import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireUser(req);
    const notificationId = params.id;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return apiError("Notification not found.", "NOT_FOUND", 404);
    }

    if (notification.recipientId !== session.userId) {
      return apiError("Notification does not belong to you.", "FORBIDDEN", 403);
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return apiSuccess({ notification: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
