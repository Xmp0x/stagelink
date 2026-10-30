import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(["STUDENT"], req);

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });

    if (!profile) {
      return apiError("Student profile not found.", "NOT_FOUND", 404);
    }

    const saved = await prisma.savedInternship.findMany({
      where: { studentId: profile.id },
      orderBy: { createdAt: "desc" },
      include: {
        internship: {
          include: {
            company: {
              select: {
                id: true,
                legalName: true,
                city: true,
                sector: true,
                status: true,
              },
            },
            skills: { include: { skill: true } },
          },
        },
      },
    });

    return apiSuccess({ saved: saved.map((s) => s.internship) });
  } catch (err) {
    return handleApiError(err);
  }
}
