import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

const decisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().optional().nullable(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(["ADMIN"], req);
    const listingId = params.id;

    const body = await req.json();
    const data = decisionSchema.parse(body);

    if (data.decision === "REJECTED" && (!data.reason || data.reason.trim().length < 5)) {
      return apiError("A clear rejection reason (min 5 characters) is required.", "VALIDATION_FAILED", 400);
    }

    const listing = await prisma.internship.findUnique({
      where: { id: listingId },
      include: {
        company: {
          include: { memberships: { select: { userId: true } } },
        },
      },
    });

    if (!listing) {
      return apiError("Listing not found.", "NOT_FOUND", 404);
    }

    const newStatus = data.decision === "APPROVED" ? "PUBLISHED" : "REJECTED";

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.internship.update({
        where: { id: listingId },
        data: {
          status: newStatus,
          publishedAt: data.decision === "APPROVED" ? new Date() : null,
          rejectionReason: data.decision === "REJECTED" ? data.reason : null,
        },
      });

      // Audit event
      await tx.auditEvent.create({
        data: {
          actorUserId: session.userId,
          action: data.decision === "APPROVED" ? "LISTING_APPROVED" : "LISTING_REJECTED",
          targetType: "Internship",
          targetId: listingId,
          metadata: JSON.stringify({
            decision: data.decision,
            reason: data.reason,
            title: listing.title,
            companyId: listing.companyId,
          }),
        },
      });

      // Notify company members
      for (const m of listing.company.memberships) {
        await tx.notification.create({
          data: {
            recipientId: m.userId,
            title:
              data.decision === "APPROVED"
                ? `Internship Published: ${listing.title}`
                : `Listing Moderation Update: ${listing.title}`,
            message:
              data.decision === "APPROVED"
                ? `Your internship offer "${listing.title}" is now published and visible to Moroccan candidates.`
                : `Your offer "${listing.title}" was not approved: ${data.reason}`,
            type: "LISTING_MODERATION",
            data: JSON.stringify({ listingId, status: newStatus }),
          },
        });
      }

      return res;
    });

    return apiSuccess({
      message: `Listing ${data.decision.toLowerCase()} successfully.`,
      listing: updated,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
