import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyMembership } from "@/lib/auth/session";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/api";
import {
  evaluateMatch,
  type StudentMatchProfile,
  type InternshipMatchListing,
} from "@/lib/matching/engine";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: companyId } = params;
    await requireCompanyMembership(companyId, req);

    const { searchParams } = new URL(req.url);
    const internshipId = searchParams.get("internshipId");

    if (!internshipId) {
      throw new ApiError(400, "Query parameter 'internshipId' is required to find matching candidates.");
    }

    // Verify company status
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new ApiError(404, "Company not found.");
    }

    if (company.status !== "VERIFIED") {
      throw new ApiError(403, "Company must be VERIFIED before accessing candidate discovery.");
    }

    // Verify listing belongs to company and is active
    const listing = await prisma.internship.findFirst({
      where: {
        id: internshipId,
        companyId: companyId,
      },
      include: {
        company: {
          select: { id: true, legalName: true, tradeName: true, status: true },
        },
        skills: {
          include: { skill: true },
        },
      },
    });

    if (!listing) {
      throw new ApiError(404, "Internship listing not found for this organization.");
    }

    if (listing.status !== "PUBLISHED") {
      throw new ApiError(400, "Candidate discovery is only available for active, PUBLISHED listings.");
    }

    // STRICT PRIVACY GUARD (Moroccan Law 09-08):
    // Only query students who have explicitly opted in via discoverabilityConsent: true
    const discoverableStudents = await prisma.studentProfile.findMany({
      where: {
        discoverabilityConsent: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        skills: {
          include: { skill: true },
        },
        education: true,
        languages: true,
      },
    });

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
        id: company.id,
        name: company.tradeName || company.legalName,
        status: company.status,
      },
      skills: listing.skills.map((s) => ({
        name: s.skill.name,
        isRequired: s.isRequired,
      })),
    };

    const candidates = [];

    for (const student of discoverableStudents) {
      const studentFullName = `${student.firstName} ${student.lastName}`.trim();
      const primaryField = student.education[0]?.fieldOfStudy || student.degree || null;
      const studentMatchData: StudentMatchProfile = {
        id: student.id,
        name: studentFullName,
        city: student.city,
        fieldPreference: primaryField,
        discoverabilityConsent: student.discoverabilityConsent,
        skills: student.skills.map((s) => ({
          name: s.skill.name,
          proficiency: s.proficiency,
        })),
        education: student.education.map((e) => ({
          school: e.school,
          degree: e.degree,
          fieldOfStudy: e.fieldOfStudy,
        })),
        languages: student.languages.map((l) => ({
          language: l.language,
          proficiency: l.proficiency,
        })),
      };

      const evaluation = evaluateMatch(studentMatchData, matchListing);

      const headline =
        student.bio ||
        `${student.degree || "Student"} at ${student.institution || "Moroccan Higher Education"}`;

      candidates.push({
        candidate: {
          id: student.id,
          name: studentFullName,
          city: student.city,
          fieldPreference: primaryField,
          headline,
          education: student.education,
          skills: student.skills.map((s) => s.skill.name),
        },
        evaluation,
      });
    }

    // Sort candidates: eligible first, then by highest compatibility score
    candidates.sort((a, b) => {
      if (a.evaluation.isEligible !== b.evaluation.isEligible) {
        return a.evaluation.isEligible ? -1 : 1;
      }
      return b.evaluation.score - a.evaluation.score;
    });

    return apiSuccess({
      internshipId: listing.id,
      internshipTitle: listing.title,
      candidates,
      totalDiscoverable: candidates.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
