import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";
import { calculateProfileCompleteness } from "@/lib/student/completeness";

export const dynamic = "force-dynamic";

const applySchema = z.object({
  approvedSkills: z.array(z.string()).default([]),
  approvedEducation: z
    .array(
      z.object({
        school: z.string().min(2),
        degree: z.string().min(2),
      })
    )
    .default([]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(["STUDENT"], req);
    const extractionId = params.id;

    const body = await req.json();
    const data = applySchema.parse(body);

    const extraction = await prisma.cVExtraction.findUnique({
      where: { id: extractionId },
      include: {
        student: {
          include: { education: true, skills: true, languages: true },
        },
      },
    });

    if (!extraction) {
      return apiError("Extraction not found.", "NOT_FOUND", 404);
    }

    if (extraction.student.userId !== session.userId) {
      return apiError("Extraction does not belong to you.", "FORBIDDEN", 403);
    }

    const studentProfileId = extraction.studentId;

    // Apply approved skills and education in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Process Approved Skills
      for (const skillName of data.approvedSkills) {
        const canonical = skillName.trim();
        if (!canonical) continue;

        const skill = await tx.skill.upsert({
          where: { name: canonical },
          update: {},
          create: { name: canonical },
        });

        await tx.studentSkill.upsert({
          where: {
            studentId_skillId: {
              studentId: studentProfileId,
              skillId: skill.id,
            },
          },
          update: {},
          create: {
            studentId: studentProfileId,
            skillId: skill.id,
            proficiency: "INTERMEDIATE",
          },
        });
      }

      // 2. Process Approved Education
      for (const edu of data.approvedEducation) {
        await tx.studentEducation.create({
          data: {
            studentId: studentProfileId,
            school: edu.school.trim(),
            degree: edu.degree.trim(),
          },
        });
      }

      // 3. Mark extraction as APPROVED
      await tx.cVExtraction.update({
        where: { id: extractionId },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
        },
      });

      // 4. Audit event
      await tx.auditEvent.create({
        data: {
          actorUserId: session.userId,
          action: "CV_EXTRACTION_APPROVED_DIFF",
          targetType: "CVExtraction",
          targetId: extractionId,
          metadata: JSON.stringify({
            skillsAdded: data.approvedSkills.length,
            educationAdded: data.approvedEducation.length,
          }),
        },
      });
    });

    // Reload profile for completeness recalculation
    const refreshed = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      include: { education: true, skills: true, languages: true },
    });

    if (refreshed) {
      const completeness = calculateProfileCompleteness({
        firstName: refreshed.firstName,
        lastName: refreshed.lastName,
        city: refreshed.city,
        institution: refreshed.institution,
        degree: refreshed.degree,
        academicYear: refreshed.academicYear,
        bio: refreshed.bio,
        availableFrom: refreshed.availableFrom,
        availableTo: refreshed.availableTo,
        preferredDurationWeeks: refreshed.preferredDurationWeeks,
        educationCount: refreshed.education.length,
        skillsCount: refreshed.skills.length,
        languagesCount: refreshed.languages.length,
      });

      await prisma.studentProfile.update({
        where: { id: refreshed.id },
        data: { profileCompleteness: completeness.score },
      });
    }

    return apiSuccess({
      message: "Approved changes synced to your profile successfully.",
      appliedSkillsCount: data.approvedSkills.length,
      appliedEducationCount: data.approvedEducation.length,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
