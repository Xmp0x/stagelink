import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/api";
import {
  evaluateMatch,
  type StudentMatchProfile,
  type InternshipMatchListing,
} from "@/lib/matching/engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(["STUDENT"], req);

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
      include: {
        user: { select: { id: true, email: true } },
        skills: {
          include: { skill: true },
        },
        education: true,
        languages: true,
      },
    });

    if (!studentProfile) {
      throw new ApiError(404, "Student profile not found. Please complete profile setup.");
    }

    // Format student profile for matching engine
    const studentMatchData: StudentMatchProfile = {
      id: studentProfile.id,
      name: `${studentProfile.firstName} ${studentProfile.lastName}`.trim(),
      city: studentProfile.city,
      fieldPreference: studentProfile.education[0]?.fieldOfStudy || studentProfile.degree || null,
      discoverabilityConsent: studentProfile.discoverabilityConsent,
      skills: studentProfile.skills.map((s) => ({
        name: s.skill.name,
        proficiency: s.proficiency,
      })),
      education: studentProfile.education.map((e) => ({
        school: e.school,
        degree: e.degree,
        fieldOfStudy: e.fieldOfStudy,
      })),
      languages: studentProfile.languages.map((l) => ({
        language: l.language,
        proficiency: l.proficiency,
      })),
    };

    // Query active published internships under verified employers
    const now = new Date();
    const activeListings = await prisma.internship.findMany({
      where: {
        status: "PUBLISHED",
        deadlineDate: { gte: now },
        company: {
          status: "VERIFIED",
        },
      },
      include: {
        company: {
          select: {
            id: true,
            legalName: true,
            tradeName: true,
            status: true,
            logoUrl: true,
            city: true,
          },
        },
        skills: {
          include: { skill: true },
        },
      },
    });

    // Evaluate matching for each listing
    const results = [];

    for (const listing of activeListings) {
      const companyDisplayName = listing.company.tradeName || listing.company.legalName;
      const matchListing: InternshipMatchListing = {
        id: listing.id,
        title: listing.title,
        sector: listing.sector,
        city: listing.city,
        modality: listing.modality,
        durationWeeks: listing.durationWeeks,
        deadlineDate: listing.deadlineDate,
        status: listing.status,
        company: {
          id: listing.company.id,
          name: companyDisplayName,
          status: listing.company.status,
        },
        skills: listing.skills.map((s) => ({
          name: s.skill.name,
          isRequired: s.isRequired,
        })),
      };

      const evaluation = evaluateMatch(studentMatchData, matchListing);

      // Upsert match result in background/cache
      await prisma.matchResult.upsert({
        where: {
          studentId_internshipId_scoreVersion: {
            studentId: studentProfile.id,
            internshipId: listing.id,
            scoreVersion: evaluation.scoreVersion,
          },
        },
        create: {
          studentId: studentProfile.id,
          internshipId: listing.id,
          score: evaluation.score,
          scoreVersion: evaluation.scoreVersion,
          isEligible: evaluation.isEligible,
          matchFactors: JSON.stringify(evaluation.matchFactors),
          missingFactors: JSON.stringify(evaluation.missingFactors),
        },
        update: {
          score: evaluation.score,
          isEligible: evaluation.isEligible,
          matchFactors: JSON.stringify(evaluation.matchFactors),
          missingFactors: JSON.stringify(evaluation.missingFactors),
          calculatedAt: new Date(),
        },
      });

      results.push({
        internship: {
          id: listing.id,
          title: listing.title,
          sector: listing.sector,
          city: listing.city,
          modality: listing.modality,
          durationWeeks: listing.durationWeeks,
          deadlineDate: listing.deadlineDate,
          isPaid: listing.isPaid,
          stipendAmount: listing.stipendAmount,
          company: {
            id: listing.company.id,
            name: companyDisplayName,
            city: listing.company.city,
            logoUrl: listing.company.logoUrl,
          },
          skills: listing.skills.map((s) => ({
            name: s.skill.name,
            isRequired: s.isRequired,
          })),
        },
        evaluation,
      });
    }

    // Sort: Eligible first, then descending by score
    results.sort((a, b) => {
      if (a.evaluation.isEligible !== b.evaluation.isEligible) {
        return a.evaluation.isEligible ? -1 : 1;
      }
      return b.evaluation.score - a.evaluation.score;
    });

    return apiSuccess({
      matches: results,
      total: results.length,
      studentId: studentProfile.id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
