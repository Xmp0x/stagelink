import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { listingId: string } }
) {
  try {
    const session = await requireRole(["STUDENT"], req);
    const listingId = params.listingId;

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });

    if (!profile) {
      return apiError("Student profile not found.", "NOT_FOUND", 404);
    }

    const internship = await prisma.internship.findUnique({
      where: { id: listingId },
    });

    if (!internship) {
      return apiError("Internship opportunity not found.", "NOT_FOUND", 404);
    }

    const saved = await prisma.savedInternship.upsert({
      where: {
        studentId_internshipId: {
          studentId: profile.id,
          internshipId: listingId,
        },
      },
      update: {},
      create: {
        studentId: profile.id,
        internshipId: listingId,
      },
    });

    return apiSuccess({ message: "Internship saved successfully.", saved }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { listingId: string } }
) {
  try {
    const session = await requireRole(["STUDENT"], req);
    const listingId = params.listingId;

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });

    if (!profile) {
      return apiError("Student profile not found.", "NOT_FOUND", 404);
    }

    await prisma.savedInternship.deleteMany({
      where: {
        studentId: profile.id,
        internshipId: listingId,
      },
    });

    return apiSuccess({ message: "Bookmark removed." });
  } catch (err) {
    return handleApiError(err);
  }
}
