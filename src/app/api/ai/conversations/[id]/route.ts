import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(["STUDENT"], req);
    const { id } = params;

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!studentProfile) {
      throw new ApiError(404, "Student profile not found.");
    }

    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id,
        studentId: studentProfile.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      throw new ApiError(404, "Conversation thread not found.");
    }

    return apiSuccess({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        messages: conversation.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          toolCalls: m.toolCalls ? JSON.parse(m.toolCalls) : null,
          createdAt: m.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(["STUDENT"], req);
    const { id } = params;

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!studentProfile) {
      throw new ApiError(404, "Student profile not found.");
    }

    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id,
        studentId: studentProfile.id,
      },
    });

    if (!conversation) {
      throw new ApiError(404, "Conversation thread not found.");
    }

    await prisma.chatConversation.delete({
      where: { id: conversation.id },
    });

    return apiSuccess({ deleted: true, id: conversation.id });
  } catch (error) {
    return handleApiError(error);
  }
}
