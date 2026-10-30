import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listingId = params.id;
    const session = await getSession(req);

    const listing = await prisma.internship.findUnique({
      where: { id: listingId },
      include: {
        company: {
          select: {
            id: true,
            legalName: true,
            tradeName: true,
            sector: true,
            description: true,
            city: true,
            website: true,
            logoUrl: true,
            status: true,
          },
        },
        skills: {
          include: { skill: true },
        },
      },
    });

    if (!listing) {
      return apiError("Internship opportunity not found.", "NOT_FOUND", 404);
    }

    const isCompanyMember = session?.companyId === listing.companyId;
    const isAdmin = session?.role === "ADMIN";

    // Visibility Guard: Unapproved/Draft/Expired listings are only visible to company owners/admins
    if (!isCompanyMember && !isAdmin) {
      const isPublished = listing.status === "PUBLISHED";
      const isCompanyVerified = listing.company.status === "VERIFIED";
      const isNotExpired = listing.deadlineDate.getTime() >= Date.now();

      if (!isPublished || !isCompanyVerified || !isNotExpired) {
        return apiError("This internship offer is no longer active or visible.", "NOT_FOUND", 404);
      }
    }

    // Check if current user saved or applied
    let isSaved = false;
    let hasApplied = false;

    if (session?.studentProfileId) {
      const [saved, application] = await Promise.all([
        prisma.savedInternship.findUnique({
          where: {
            studentId_internshipId: {
              studentId: session.studentProfileId,
              internshipId: listing.id,
            },
          },
        }),
        prisma.application.findUnique({
          where: {
            studentId_internshipId: {
              studentId: session.studentProfileId,
              internshipId: listing.id,
            },
          },
          select: { id: true, status: true, submittedAt: true },
        }),
      ]);

      isSaved = Boolean(saved);
      hasApplied = Boolean(application);
    }

    return apiSuccess({
      listing,
      meta: {
        isSaved,
        hasApplied,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
