import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

const updateUserSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminSession = await requireRole(["ADMIN"], req);
    const { id: targetUserId } = params;

    // Prevent admin from deactivating self
    if (adminSession.userId === targetUserId) {
      throw new ApiError(400, "Administrators cannot deactivate their own account.");
    }

    const body = await req.json();
    const { isActive, reason } = updateUserSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new ApiError(404, "User account not found.");
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: targetUserId },
        data: { isActive },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: adminSession.userId,
          action: isActive ? "USER_ACCOUNT_REACTIVATED" : "USER_ACCOUNT_SUSPENDED",
          targetType: "User",
          targetId: targetUserId,
          metadata: JSON.stringify({
            previousState: user.isActive,
            newState: isActive,
            reason: reason || "Administrative action",
          }),
        },
      });

      return u;
    });

    return apiSuccess({
      id: updatedUser.id,
      email: updatedUser.email,
      isActive: updatedUser.isActive,
      message: isActive ? "Account has been reactivated." : "Account has been suspended.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
