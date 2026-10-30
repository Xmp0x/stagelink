/**
 * StageLink AI Copilot — Approved Internal Tool Registry
 * 
 * Strict Architecture:
 * - Operates exclusively on internal database records via Prisma.
 * - Enforces tenant isolation: callers can ONLY access their own data.
 * - ABSOLUTE SAFETY GUARD: Application submission CANNOT be executed autonomously
 *   by the AI; it requires explicit student confirmation in the UI.
 */

import { prisma } from "@/lib/prisma";
import {
  evaluateMatch,
  type StudentMatchProfile,
  type InternshipMatchListing,
} from "@/lib/matching/engine";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
}

export const APPROVED_TOOLS: ToolDefinition[] = [
  {
    name: "getMyProfile",
    description: "Retrieves the authenticated student's current profile, education, verified skills, and preferences from the internal database.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "searchPublishedInternships",
    description: "Searches internal database for active, published internships from verified Moroccan employers. Zero external scraping.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keywords to match against title, sector, or description." },
        city: { type: "string", description: "Moroccan city filter (e.g. Casablanca, Tangier, Rabat)." },
        modality: { type: "string", description: "Work modality", enum: ["ONSITE", "REMOTE", "HYBRID"] },
        limit: { type: "number", description: "Maximum number of results (1 to 10)." },
      },
    },
  },
  {
    name: "getInternship",
    description: "Fetches full verified details and requirements for a specific internship by its internal ID.",
    parameters: {
      type: "object",
      properties: {
        listingId: { type: "string", description: "The internal ID of the internship listing." },
      },
      required: ["listingId"],
    },
  },
  {
    name: "rankMyMatches",
    description: "Executes the StageLink explainable matching engine to calculate compatibility scores and gap analysis between the student's profile and active listings.",
    parameters: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Maximum number of matches to return (1 to 10)." },
      },
    },
  },
  {
    name: "getMyApplications",
    description: "Retrieves the student's submitted applications and current ATS progression statuses.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "saveInternship",
    description: "Bookmarks a verified internship for the student so they can review it later in their Saved Opportunities list.",
    parameters: {
      type: "object",
      properties: {
        listingId: { type: "string", description: "The internal ID of the internship listing to save." },
      },
      required: ["listingId"],
    },
  },
  {
    name: "prepareApplicationDraft",
    description: "Drafts a personalized, professional motivation note tailored to a specific verified internship listing based on the student's background.",
    parameters: {
      type: "object",
      properties: {
        listingId: { type: "string", description: "The internal ID of the internship listing." },
      },
      required: ["listingId"],
    },
  },
];

export interface ToolExecutionContext {
  studentUserId: string;
  studentProfileId: string;
}

/**
 * Safely executes an approved tool with tenant scoping.
 */
export async function executeApprovedTool(
  toolName: string,
  args: Record<string, any>,
  context: ToolExecutionContext
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    switch (toolName) {
      case "getMyProfile": {
        const profile = await prisma.studentProfile.findUnique({
          where: { id: context.studentProfileId },
          include: {
            education: true,
            skills: { include: { skill: true } },
            languages: true,
          },
        });

        if (!profile) {
          return { success: false, error: "Profile not found." };
        }

        return {
          success: true,
          data: {
            name: `${profile.firstName} ${profile.lastName}`.trim(),
            city: profile.city,
            institution: profile.institution,
            degree: profile.degree,
            bio: profile.bio,
            completeness: profile.profileCompleteness,
            skills: profile.skills.map((s) => s.skill.name),
            education: profile.education.map((e) => `${e.degree} at ${e.school} (${e.fieldOfStudy || "Engineering"})`),
            languages: profile.languages.map((l) => `${l.language} (${l.proficiency})`),
          },
        };
      }

      case "searchPublishedInternships": {
        const { query, city, modality, limit = 5 } = args;
        const take = Math.min(10, Math.max(1, limit));
        const now = new Date();

        const where: any = {
          status: "PUBLISHED",
          deadlineDate: { gte: now },
          company: { status: "VERIFIED" },
        };

        if (city && city.toLowerCase() !== "all") {
          where.city = { equals: city, mode: "insensitive" };
        }

        if (modality && ["ONSITE", "REMOTE", "HYBRID"].includes(modality.toUpperCase())) {
          where.modality = modality.toUpperCase();
        }

        if (query) {
          where.OR = [
            { title: { contains: query, mode: "insensitive" } },
            { sector: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ];
        }

        const listings = await prisma.internship.findMany({
          where,
          take,
          orderBy: { createdAt: "desc" },
          include: {
            company: {
              select: { id: true, legalName: true, tradeName: true, city: true },
            },
            skills: { include: { skill: true } },
          },
        });

        return {
          success: true,
          data: {
            count: listings.length,
            listings: listings.map((l) => ({
              id: l.id,
              title: l.title,
              company: l.company.tradeName || l.company.legalName,
              city: l.city,
              modality: l.modality,
              durationWeeks: l.durationWeeks,
              isPaid: l.isPaid,
              deadlineDate: l.deadlineDate.toISOString().split("T")[0],
              skills: l.skills.map((s) => s.skill.name),
            })),
          },
        };
      }

      case "getInternship": {
        const { listingId } = args;
        if (!listingId) return { success: false, error: "listingId is required." };

        const listing = await prisma.internship.findUnique({
          where: { id: listingId },
          include: {
            company: {
              select: { id: true, legalName: true, tradeName: true, city: true, sector: true },
            },
            skills: { include: { skill: true } },
          },
        });

        if (!listing) return { success: false, error: "Listing not found in database." };

        return {
          success: true,
          data: {
            id: listing.id,
            title: listing.title,
            company: listing.company.tradeName || listing.company.legalName,
            companySector: listing.company.sector,
            city: listing.city,
            modality: listing.modality,
            durationWeeks: listing.durationWeeks,
            description: listing.description,
            requirements: listing.requirements,
            isPaid: listing.isPaid,
            stipendAmount: listing.stipendAmount,
            deadlineDate: listing.deadlineDate.toISOString().split("T")[0],
            skills: listing.skills.map((s) => ({
              name: s.skill.name,
              isRequired: s.isRequired,
            })),
          },
        };
      }

      case "rankMyMatches": {
        const { limit = 5 } = args;
        const take = Math.min(10, Math.max(1, limit));

        const studentProfile = await prisma.studentProfile.findUnique({
          where: { id: context.studentProfileId },
          include: {
            education: true,
            skills: { include: { skill: true } },
            languages: true,
          },
        });

        if (!studentProfile) return { success: false, error: "Student profile not found." };

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
        };

        const now = new Date();
        const activeListings = await prisma.internship.findMany({
          where: {
            status: "PUBLISHED",
            deadlineDate: { gte: now },
            company: { status: "VERIFIED" },
          },
          include: {
            company: {
              select: { id: true, legalName: true, tradeName: true, status: true },
            },
            skills: { include: { skill: true } },
          },
        });

        const evaluated = activeListings.map((l) => {
          const matchListing: InternshipMatchListing = {
            id: l.id,
            title: l.title,
            sector: l.sector,
            city: l.city,
            modality: l.modality,
            durationWeeks: l.durationWeeks,
            deadlineDate: l.deadlineDate,
            status: l.status,
            company: {
              id: l.company.id,
              name: l.company.tradeName || l.company.legalName,
              status: l.company.status,
            },
            skills: l.skills.map((s) => ({
              name: s.skill.name,
              isRequired: s.isRequired,
            })),
          };

          const evaluation = evaluateMatch(studentMatchData, matchListing);
          return {
            id: l.id,
            title: l.title,
            company: l.company.tradeName || l.company.legalName,
            city: l.city,
            modality: l.modality,
            score: evaluation.score,
            isEligible: evaluation.isEligible,
            summary: evaluation.summary,
            matchedSkills: evaluation.matchFactors.matchedRequiredSkills,
            missingSkills: evaluation.missingFactors.missingRequiredSkills,
          };
        });

        evaluated.sort((a, b) => {
          if (a.isEligible !== b.isEligible) return a.isEligible ? -1 : 1;
          return b.score - a.score;
        });

        return {
          success: true,
          data: {
            matches: evaluated.slice(0, take),
            totalAvailable: evaluated.length,
          },
        };
      }

      case "getMyApplications": {
        const applications = await prisma.application.findMany({
          where: { studentId: context.studentProfileId },
          include: {
            internship: {
              include: {
                company: {
                  select: { legalName: true, tradeName: true },
                },
              },
            },
          },
          orderBy: { submittedAt: "desc" },
        });

        return {
          success: true,
          data: {
            count: applications.length,
            applications: applications.map((a) => ({
              id: a.id,
              internshipId: a.internshipId,
              title: a.internship.title,
              company: a.internship.company.tradeName || a.internship.company.legalName,
              status: a.status,
              submittedAt: a.submittedAt.toISOString().split("T")[0],
            })),
          },
        };
      }

      case "saveInternship": {
        const { listingId } = args;
        if (!listingId) return { success: false, error: "listingId is required." };

        const listing = await prisma.internship.findUnique({
          where: { id: listingId },
        });

        if (!listing) return { success: false, error: "Listing does not exist." };

        await prisma.savedInternship.upsert({
          where: {
            studentId_internshipId: {
              studentId: context.studentProfileId,
              internshipId: listingId,
            },
          },
          create: {
            studentId: context.studentProfileId,
            internshipId: listingId,
          },
          update: {},
        });

        return {
          success: true,
          data: {
            message: `Internship "${listing.title}" saved to your bookmarks.`,
            saved: true,
          },
        };
      }

      case "prepareApplicationDraft": {
        const { listingId } = args;
        if (!listingId) return { success: false, error: "listingId is required." };

        const listing = await prisma.internship.findUnique({
          where: { id: listingId },
          include: {
            company: { select: { legalName: true, tradeName: true } },
            skills: { include: { skill: true } },
          },
        });

        if (!listing) return { success: false, error: "Listing not found." };

        const profile = await prisma.studentProfile.findUnique({
          where: { id: context.studentProfileId },
          include: {
            education: true,
            skills: { include: { skill: true } },
          },
        });

        const studentName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : "Student";
        const companyName = listing.company.tradeName || listing.company.legalName;
        const topSkills = profile?.skills.slice(0, 3).map((s) => s.skill.name).join(", ") || "software development";
        const school = profile?.education[0]?.school || "Moroccan Higher Education Institution";

        const draftCoverNote = `Dear Hiring Team at ${companyName},

I am writing to express my strong interest in the ${listing.title} internship in ${listing.city}. As a student at ${school} with practical experience in ${topSkills}, I have developed a solid foundation aligned with your team's mission.

During my studies, I have focused on solving real-world challenges through hands-on projects, emphasizing clean code, collaboration, and rapid learning. I am eager to contribute to ${companyName} and further develop my skills during this ${listing.durationWeeks}-week internship.

Thank you for your consideration, and I look forward to the opportunity to discuss my application.

Sincerely,
${studentName}`;

        return {
          success: true,
          data: {
            listingId: listing.id,
            listingTitle: listing.title,
            companyName,
            draftCoverNote,
            actionNotice: "To submit your application, please review this draft and click 'Apply Now' on the listing page.",
          },
        };
      }

      default:
        return { success: false, error: `Tool '${toolName}' is not recognized or permitted.` };
    }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to execute tool." };
  }
}
