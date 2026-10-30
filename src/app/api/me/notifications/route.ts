import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await requireUser(req);

    const notifications = await prisma.notification.findMany({
      where: { recipientId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { recipientId: session.userId, read: false },
    });

    return apiSuccess({ notifications, unreadCount });
  } catch (err) {
    return handleApiError(err);
  }
}
