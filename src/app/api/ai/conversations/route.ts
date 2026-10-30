import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(["STUDENT"], req);

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!studentProfile) {
      throw new ApiError(404, "Student profile not found.");
    }

    const conversations = await prisma.chatConversation.findMany({
      where: { studentId: studentProfile.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return apiSuccess({
      conversations: conversations.map((c) => ({
        id: c.id,
        title: c.title,
        messageCount: c._count.messages,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
