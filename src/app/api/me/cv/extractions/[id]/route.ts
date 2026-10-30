import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(["STUDENT"], req);
    const extractionId = params.id;

    const extraction = await prisma.cVExtraction.findUnique({
      where: { id: extractionId },
      include: {
        cvDocument: {
          select: {
            id: true,
            filename: true,
            fileSizeBytes: true,
            createdAt: true,
          },
        },
        student: {
          include: {
            skills: { include: { skill: true } },
            education: true,
            languages: true,
          },
        },
      },
    });

    if (!extraction) {
      return apiError("Extraction not found.", "NOT_FOUND", 404);
    }

    if (extraction.student.userId !== session.userId) {
      return apiError("Extraction does not belong to you.", "FORBIDDEN", 403);
    }

    const parsedSkills: string[] = extraction.extractedSkills
      ? JSON.parse(extraction.extractedSkills)
      : [];
    const parsedEducation: Array<{ school: string; degree: string }> = extraction.extractedEducation
      ? JSON.parse(extraction.extractedEducation)
      : [];

    return apiSuccess({
      extraction: {
        id: extraction.id,
        status: extraction.status,
        confidence: extraction.confidenceScore,
        createdAt: extraction.createdAt,
        document: extraction.cvDocument,
        suggestedSkills: parsedSkills,
        suggestedEducation: parsedEducation,
      },
      currentProfile: {
        skills: extraction.student.skills.map((s) => s.skill.name),
        education: extraction.student.education.map((e) => ({
          school: e.school,
          degree: e.degree,
        })),
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
