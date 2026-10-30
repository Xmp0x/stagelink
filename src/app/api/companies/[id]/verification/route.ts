import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCompanyMembership } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

const verificationSubmissionSchema = z.object({
  registrationNumber: z.string().min(3, "RC or ICE registration number is required (min 3 chars)."),
  documentStorageKey: z.string().optional().nullable(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id;
    const { session } = await requireCompanyMembership(companyId, req);

    const body = await req.json();
    const data = verificationSubmissionSchema.parse(body);

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return apiError("Company not found.", "NOT_FOUND", 404);
    }

    if (company.status === "VERIFIED") {
      return apiError("Company is already verified.", "CONFLICT", 409);
    }

    const verification = await prisma.companyVerification.create({
      data: {
        companyId,
        registrationNumber: data.registrationNumber,
        documentStorageKey: data.documentStorageKey,
        status: "PENDING",
      },
    });

    await prisma.company.update({
      where: { id: companyId },
      data: { status: "PENDING_VERIFICATION" },
    });

    // Record audit event
    await prisma.auditEvent.create({
      data: {
        actorUserId: session.userId,
        action: "COMPANY_VERIFICATION_REQUESTED",
        targetType: "Company",
        targetId: companyId,
        metadata: JSON.stringify({
          registrationNumber: data.registrationNumber,
          verificationId: verification.id,
        }),
      },
    });

    return apiSuccess(
      {
        message: "Verification request submitted successfully for platform review.",
        verification,
      },
      201
    );
  } catch (err) {
    return handleApiError(err);
  }
}
