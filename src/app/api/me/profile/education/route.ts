import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";
import { calculateProfileCompleteness } from "@/lib/student/completeness";

export const dynamic = "force-dynamic";

const educationSchema = z.object({
  school: z.string().min(2, "School name is required."),
  degree: z.string().min(2, "Degree name is required."),
  fieldOfStudy: z.string().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  isCurrent: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["STUDENT"], req);
    const body = await req.json();
    const data = educationSchema.parse(body);

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
      include: { education: true, skills: true, languages: true },
    });

    if (!profile) {
      return apiError("Student profile not found.", "NOT_FOUND", 404);
    }

    const education = await prisma.studentEducation.create({
      data: {
        studentId: profile.id,
        school: data.school,
        degree: data.degree,
        fieldOfStudy: data.fieldOfStudy,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isCurrent: data.isCurrent,
      },
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
      educationCount: profile.education.length + 1,
      skillsCount: profile.skills.length,
      languagesCount: profile.languages.length,
    });

    await prisma.studentProfile.update({
      where: { id: profile.id },
      data: { profileCompleteness: completeness.score },
    });

    return apiSuccess({ education, completeness }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
