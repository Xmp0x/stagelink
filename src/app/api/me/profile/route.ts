import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/utils/api";
import { calculateProfileCompleteness } from "@/lib/student/completeness";

export const dynamic = "force-dynamic";

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  city: z.string().min(2).optional(),
  institution: z.string().optional().nullable(),
  degree: z.string().optional().nullable(),
  academicYear: z.string().optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  availableFrom: z.string().datetime().optional().nullable(),
  availableTo: z.string().datetime().optional().nullable(),
  preferredModality: z.enum(["REMOTE", "ONSITE", "HYBRID"]).optional(),
  preferredDurationWeeks: z.number().int().min(2).max(52).optional().nullable(),
  discoverabilityConsent: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(["STUDENT"], req);

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
      include: {
        education: { orderBy: { startDate: "desc" } },
        skills: {
          include: { skill: true },
        },
        languages: true,
        projects: { orderBy: { startDate: "desc" } },
        cvDocuments: {
          where: { activeVersion: true },
          select: {
            id: true,
            filename: true,
            fileSizeBytes: true,
            processingStatus: true,
            createdAt: true,
          },
        },
      },
    });

    if (!profile) {
      return apiError("Student profile not found.", "NOT_FOUND", 404);
    }

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
      skillsCount: profile.skills.length,
      languagesCount: profile.languages.length,
    });

    return apiSuccess({ profile, completeness });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireRole(["STUDENT"], req);
    const body = await req.json();
    const data = updateProfileSchema.parse(body);

    const currentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
      include: {
        education: true,
        skills: true,
        languages: true,
      },
    });

    if (!currentProfile) {
      return apiError("Student profile not found.", "NOT_FOUND", 404);
    }

    // Merge for completeness recalculation
    const updatedAvailableFrom =
      data.availableFrom !== undefined
        ? data.availableFrom ? new Date(data.availableFrom) : null
        : currentProfile.availableFrom;

    const updatedAvailableTo =
      data.availableTo !== undefined
        ? data.availableTo ? new Date(data.availableTo) : null
        : currentProfile.availableTo;

    const completeness = calculateProfileCompleteness({
      firstName: data.firstName ?? currentProfile.firstName,
      lastName: data.lastName ?? currentProfile.lastName,
      city: data.city ?? currentProfile.city,
      institution: data.institution !== undefined ? data.institution : currentProfile.institution,
      degree: data.degree !== undefined ? data.degree : currentProfile.degree,
      academicYear: data.academicYear !== undefined ? data.academicYear : currentProfile.academicYear,
      bio: data.bio !== undefined ? data.bio : currentProfile.bio,
      availableFrom: updatedAvailableFrom,
      availableTo: updatedAvailableTo,
      preferredDurationWeeks:
        data.preferredDurationWeeks !== undefined
          ? data.preferredDurationWeeks
          : currentProfile.preferredDurationWeeks,
      educationCount: currentProfile.education.length,
      skillsCount: currentProfile.skills.length,
      languagesCount: currentProfile.languages.length,
    });

    const updated = await prisma.studentProfile.update({
      where: { userId: session.userId },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.city && { city: data.city }),
        ...(data.institution !== undefined && { institution: data.institution }),
        ...(data.degree !== undefined && { degree: data.degree }),
        ...(data.academicYear !== undefined && { academicYear: data.academicYear }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.availableFrom !== undefined && { availableFrom: updatedAvailableFrom }),
        ...(data.availableTo !== undefined && { availableTo: updatedAvailableTo }),
        ...(data.preferredModality && { preferredModality: data.preferredModality }),
        ...(data.preferredDurationWeeks !== undefined && { preferredDurationWeeks: data.preferredDurationWeeks }),
        ...(data.discoverabilityConsent !== undefined && { discoverabilityConsent: data.discoverabilityConsent }),
        profileCompleteness: completeness.score,
      },
    });

    // Record audit event if privacy / consent changed
    if (data.discoverabilityConsent !== undefined && data.discoverabilityConsent !== currentProfile.discoverabilityConsent) {
      await prisma.auditEvent.create({
        data: {
          actorUserId: session.userId,
          action: "DISCOVERABILITY_CONSENT_UPDATED",
          targetType: "StudentProfile",
          targetId: currentProfile.id,
          metadata: JSON.stringify({ consent: data.discoverabilityConsent }),
        },
      });
    }

    return apiSuccess({ profile: updated, completeness });
  } catch (err) {
    return handleApiError(err);
  }
}
