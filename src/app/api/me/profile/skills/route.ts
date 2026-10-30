import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";
import { calculateProfileCompleteness } from "@/lib/student/completeness";

export const dynamic = "force-dynamic";

const skillSchema = z.object({
  name: z.string().min(1, "Skill name is required.").max(50),
  proficiency: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]).default("INTERMEDIATE"),
  yearsExperience: z.number().min(0).max(20).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["STUDENT"], req);
    const body = await req.json();
    const data = skillSchema.parse(body);

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
      include: { skills: true, education: true, languages: true },
    });

    if (!profile) {
      return apiError("Student profile not found.", "NOT_FOUND", 404);
    }

    // Normalize canonical skill name
    const normalizedName = data.name.trim();

    // Find or create in canonical Skill catalog
    const skill = await prisma.skill.upsert({
      where: { name: normalizedName },
      update: {},
      create: { name: normalizedName },
    });

    // Link to StudentSkill
    const studentSkill = await prisma.studentSkill.upsert({
      where: {
        studentId_skillId: {
          studentId: profile.id,
          skillId: skill.id,
        },
      },
      update: {
        proficiency: data.proficiency,
        yearsExperience: data.yearsExperience,
      },
      create: {
        studentId: profile.id,
        skillId: skill.id,
        proficiency: data.proficiency,
        yearsExperience: data.yearsExperience,
      },
      include: { skill: true },
    });

    // Update profile completeness
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
      skillsCount: profile.skills.some((s) => s.skillId === skill.id)
        ? profile.skills.length
        : profile.skills.length + 1,
      languagesCount: profile.languages.length,
    });

    await prisma.studentProfile.update({
      where: { id: profile.id },
      data: { profileCompleteness: completeness.score },
    });

    return apiSuccess({ studentSkill, completeness }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
