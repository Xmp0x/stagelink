import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyMembership } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id;
    await requireCompanyMembership(companyId, req);

    const applications = await prisma.application.findMany({
      where: {
        internship: { companyId },
      },
      orderBy: { submittedAt: "desc" },
      include: {
        internship: {
          select: {
            id: true,
            title: true,
            city: true,
            deadlineDate: true,
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            city: true,
            institution: true,
            degree: true,
            profileCompleteness: true,
            skills: { include: { skill: true } },
          },
        },
        cvDocument: {
          select: {
            id: true,
            filename: true,
            fileSizeBytes: true,
          },
        },
        events: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return apiSuccess({ applications });
  } catch (err) {
    return handleApiError(err);
  }
}
