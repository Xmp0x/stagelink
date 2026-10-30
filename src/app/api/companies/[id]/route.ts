import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, requireCompanyMembership } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

const updateCompanySchema = z.object({
  legalName: z.string().min(2).optional(),
  tradeName: z.string().optional().nullable(),
  sector: z.string().min(2).optional(),
  description: z.string().max(3000).optional().nullable(),
  website: z.string().url("Please provide a valid website URL.").optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  city: z.string().min(2).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id;
    const session = await getSession(req);

    const isInternalMember =
      session?.companyId === companyId || session?.role === "ADMIN";

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        verifications: isInternalMember ? { orderBy: { createdAt: "desc" }, take: 1 } : false,
        _count: {
          select: {
            internships: { where: { status: "PUBLISHED" } },
          },
        },
      },
    });

    if (!company) {
      return apiError("Company not found.", "NOT_FOUND", 404);
    }

    // Only verified companies are publicly visible unless viewed by internal member or admin
    if (company.status !== "VERIFIED" && !isInternalMember) {
      return apiError("Company is pending verification or not publicly visible.", "NOT_FOUND", 404);
    }

    return apiSuccess({ company });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id;
    await requireCompanyMembership(companyId, req);

    const body = await req.json();
    const data = updateCompanySchema.parse(body);

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: {
        ...(data.legalName && { legalName: data.legalName }),
        ...(data.tradeName !== undefined && { tradeName: data.tradeName }),
        ...(data.sector && { sector: data.sector }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.website !== undefined && { website: data.website || null }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city && { city: data.city }),
      },
    });

    return apiSuccess({ company: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
