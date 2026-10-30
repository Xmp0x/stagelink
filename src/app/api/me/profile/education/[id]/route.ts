import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";
import { calculateProfileCompleteness } from "@/lib/student/completeness";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(["STUDENT"], req);
    const educationId = params.id;

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
      include: { education: true, skills: true, languages: true },
    });

    if (!profile) {
      return apiError("Student profile not found.", "NOT_FOUND", 404);
    }

    const target = profile.education.find((e) => e.id === educationId);
    if (!target) {
      return apiError("Education record not found or does not belong to you.", "NOT_FOUND", 404);
    }

    await prisma.studentEducation.delete({
      where: { id: educationId },
    });

    const completeness = calculateProfileCompleteness({
      firstName: profile.firstName,
      lastName: profile.lastName,
      city: profile.city,
      institution: profile.institution,
      degree: profile.degree,
      academicYear: profile.academicYear,
      bio: profile.bio,
      availableFrom: profile.availableFrom,
      availableTo: profile.availableTo,
      preferredDurationWeeks: profile.preferredDurationWeeks,
      educationCount: Math.max(0, profile.education.length - 1),
      skillsCount: profile.skills.length,
      languagesCount: profile.languages.length,
    });

    await prisma.studentProfile.update({
      where: { id: profile.id },
      data: { profileCompleteness: completeness.score },
    });

    return apiSuccess({ message: "Education record deleted.", completeness });
  } catch (err) {
    return handleApiError(err);
  }
}
