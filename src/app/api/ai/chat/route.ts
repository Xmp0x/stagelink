import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/api";
import { runAgentConversation } from "@/lib/ai/agent";
import { type AiMessage } from "@/lib/ai/provider";

export const dynamic = "force-dynamic";

const chatRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty.").max(2000, "Message exceeds 2,000 characters limit."),
  conversationId: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["STUDENT"], req);

    const body = await req.json();
    const { message, conversationId } = chatRequestSchema.parse(body);

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!studentProfile) {
      throw new ApiError(404, "Student profile not found. Please complete profile setup.");
    }

    let conversation;

    if (conversationId) {
      conversation = await prisma.chatConversation.findFirst({
        where: {
          id: conversationId,
          studentId: studentProfile.id,
        },
      });

      if (!conversation) {
        throw new ApiError(404, "Conversation thread not found or unauthorized.");
      }
    } else {
      // Create new conversation
      const title = message.length > 40 ? `${message.slice(0, 37)}...` : message;
      conversation = await prisma.chatConversation.create({
        data: {
          studentId: studentProfile.id,
          title,
        },
      });
    }

    // Load recent message history (last 10 turns for context)
    const recentDbMessages = await prisma.chatMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    // Record user message
    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message,
      },
    });

    const aiHistory: AiMessage[] = recentDbMessages.map((m) => ({
      role: m.role as "user" | "assistant" | "system" | "tool",
      content: m.content,
    }));

    aiHistory.push({ role: "user", content: message });

    // Run agent execution loop
    const result = await runAgentConversation(aiHistory, {
      studentUserId: session.userId,
      studentProfileId: studentProfile.id,
    });

    // Record assistant reply
    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: result.content,
        toolCalls: result.toolCallsExecuted.length > 0 ? JSON.stringify(result.toolCallsExecuted) : null,
      },
    });

    // Update conversation updatedAt
    await prisma.chatConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return apiSuccess({
      conversationId: conversation.id,
      title: conversation.title,
      reply: result.content,
      toolCalls: result.toolCallsExecuted,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
