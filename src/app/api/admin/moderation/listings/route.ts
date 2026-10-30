import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN"], req);

    const listings = await prisma.internship.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "desc" },
      include: {
        company: {
          select: {
            id: true,
            legalName: true,
            city: true,
            sector: true,
            status: true,
            website: true,
          },
        },
        skills: { include: { skill: true } },
      },
    });

    return apiSuccess({ listings });
  } catch (err) {
    return handleApiError(err);
  }
}
