import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

const decisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  reviewerNotes: z.string().min(3, "Reviewer notes are required (min 3 chars)."),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(["ADMIN"], req);
    const verificationId = params.id;

    const body = await req.json();
    const data = decisionSchema.parse(body);

    const verification = await prisma.companyVerification.findUnique({
      where: { id: verificationId },
      include: {
        company: {
          include: {
            memberships: { select: { userId: true } },
          },
        },
      },
    });

    if (!verification) {
      return apiError("Verification record not found.", "NOT_FOUND", 404);
    }

    const newCompanyStatus = data.decision === "APPROVED" ? "VERIFIED" : "REJECTED";

    const result = await prisma.$transaction(async (tx) => {
      const updatedVerification = await tx.companyVerification.update({
        where: { id: verificationId },
        data: {
          status: data.decision,
          reviewerNotes: data.reviewerNotes,
          reviewedAt: new Date(),
          reviewedByUserId: session.userId,
        },
      });

      const updatedCompany = await tx.company.update({
        where: { id: verification.companyId },
        data: { status: newCompanyStatus },
      });

      // Audit event
      await tx.auditEvent.create({
        data: {
          actorUserId: session.userId,
          action: data.decision === "APPROVED" ? "COMPANY_VERIFIED" : "COMPANY_REJECTED",
          targetType: "Company",
          targetId: verification.companyId,
          metadata: JSON.stringify({
            verificationId,
            decision: data.decision,
            reviewerNotes: data.reviewerNotes,
          }),
        },
      });

      // Notify company members
      for (const m of verification.company.memberships) {
        await tx.notification.create({
          data: {
            recipientId: m.userId,
            title:
              data.decision === "APPROVED"
                ? "Organization Verified!"
                : "Organization Verification Update",
            message:
              data.decision === "APPROVED"
                ? `Congratulations! ${verification.company.legalName} has been verified. You can now publish internship listings.`
                : `Your verification was not approved: ${data.reviewerNotes}`,
            type: "VERIFICATION_UPDATE",
            data: JSON.stringify({
              companyId: verification.companyId,
              status: newCompanyStatus,
            }),
          },
        });
      }

      return { updatedVerification, updatedCompany };
    });

    return apiSuccess({
      message: `Company verification ${data.decision.toLowerCase()} successfully.`,
      company: result.updatedCompany,
      verification: result.updatedVerification,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
