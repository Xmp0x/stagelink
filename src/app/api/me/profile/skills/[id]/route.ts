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
    const studentSkillId = params.id;

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
      include: { skills: true, education: true, languages: true },
    });

    if (!profile) {
      return apiError("Student profile not found.", "NOT_FOUND", 404);
    }

    const target = profile.skills.find((s) => s.id === studentSkillId);
    if (!target) {
      return apiError("Skill record not found or does not belong to you.", "NOT_FOUND", 404);
    }

    await prisma.studentSkill.delete({
      where: { id: studentSkillId },
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
      educationCount: profile.education.length,
      skillsCount: Math.max(0, profile.skills.length - 1),
      languagesCount: profile.languages.length,
    });

    await prisma.studentProfile.update({
      where: { id: profile.id },
      data: { profileCompleteness: completeness.score },
    });

    return apiSuccess({ message: "Skill removed.", completeness });
  } catch (err) {
    return handleApiError(err);
  }
}
