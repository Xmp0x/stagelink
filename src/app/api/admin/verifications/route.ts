import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN"], req);

    const verifications = await prisma.companyVerification.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        company: {
          select: {
            id: true,
            legalName: true,
            tradeName: true,
            sector: true,
            city: true,
            website: true,
            status: true,
            createdAt: true,
            memberships: {
              select: {
                user: { select: { email: true } },
                role: true,
              },
            },
          },
        },
      },
    });

    return apiSuccess({ verifications });
  } catch (err) {
    return handleApiError(err);
  }
}
