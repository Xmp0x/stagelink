import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return apiError("No active session.", "UNAUTHORIZED", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
        createdAt: true,
        studentProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            city: true,
            institution: true,
            degree: true,
            profileCompleteness: true,
            discoverabilityConsent: true,
          },
        },
        companyMemberships: {
          select: {
            role: true,
            company: {
              select: {
                id: true,
                legalName: true,
                tradeName: true,
                sector: true,
                city: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return apiError("User not found or account is deactivated.", "UNAUTHORIZED", 401);
    }

    return apiSuccess({ user });
  } catch (err) {
    return handleApiError(err);
  }
}
