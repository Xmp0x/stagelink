/**
 * StageLink Bi-directional Explainable Matching Engine
 * 
 * Version: 1.0.0
 * Evaluates compatibility between student profiles and internship listings
 * based on verified database records.
 * 
 * Explicit Rule: "Compatibility heuristic, not an employment guarantee".
 */

import { normalizeSkill, normalizeCity } from "./skillsCatalog";

export const MATCHING_ALGORITHM_VERSION = "1.0.0";
export const MATCHING_DISCLAIMER = "Compatibility heuristic, not an employment guarantee";

export interface StudentMatchProfile {
  id: string;
  name?: string;
  city?: string | null;
  fieldPreference?: string | null;
  discoverabilityConsent?: boolean;
  skills: Array<{ name: string; proficiency?: string }>;
  education: Array<{ school: string; degree: string; fieldOfStudy?: string | null }>;
  languages?: Array<{ language: string; proficiency?: string }>;
}

export interface InternshipMatchListing {
  id: string;
  title: string;
  sector: string;
  city: string;
  modality: "ONSITE" | "REMOTE" | "HYBRID" | string;
  durationWeeks: number;
  deadlineDate: Date | string;
  status: string;
  company: {
    id: string;
    name: string;
    status: string;
  };
  skills: Array<{ name: string; isRequired: boolean }>;
}

export interface MatchEvaluation {
  internshipId: string;
  studentId: string;
  score: number; // 0 to 100
  scoreVersion: string;
  isEligible: boolean;
  matchFactors: {
    matchedRequiredSkills: string[];
    matchedPreferredSkills: string[];
    skillsScore: number;
    educationScore: number;
    locationScore: number;
    fieldScore: number;
    durationScore: number;
    languageScore: number;
    locationFit: string;
    educationFit: string;
    fieldFit: string;
  };
  missingFactors: {
    missingRequiredSkills: string[];
    missingPreferredSkills: string[];
    ineligibilityReasons: string[];
  };
  summary: string;
  disclaimer: string;
  calculatedAt: string;
}

/**
 * Evaluates match compatibility between a student and an internship listing.
 */
export function evaluateMatch(
  student: StudentMatchProfile,
  internship: InternshipMatchListing
): MatchEvaluation {
  const ineligibilityReasons: string[] = [];
  let isEligible = true;

  // ---------------------------------------------------------------------------
  // Step A: Hard Invariant & Eligibility Checks
  // ---------------------------------------------------------------------------

  if (internship.status !== "PUBLISHED") {
    isEligible = false;
    ineligibilityReasons.push("Listing is not currently published.");
  }

  if (internship.company.status !== "VERIFIED") {
    isEligible = false;
    ineligibilityReasons.push("Company verification is pending or rejected.");
  }

  const deadline = new Date(internship.deadlineDate).getTime();
  if (deadline < Date.now()) {
    isEligible = false;
    ineligibilityReasons.push("Application deadline has passed.");
  }

  // Normalize student skills
  const studentSkillSet = new Set(
    student.skills.map((s) => normalizeSkill(s.name).toLowerCase())
  );

  // Group listing skills into required and preferred
  const requiredListingSkills = internship.skills.filter((s) => s.isRequired);
  const preferredListingSkills = internship.skills.filter((s) => !s.isRequired);

  const matchedRequiredSkills: string[] = [];
  const missingRequiredSkills: string[] = [];

  for (const item of requiredListingSkills) {
    const canonical = normalizeSkill(item.name);
    if (studentSkillSet.has(canonical.toLowerCase())) {
      matchedRequiredSkills.push(canonical);
    } else {
      missingRequiredSkills.push(canonical);
    }
  }

  // If missing any required skill, flag as ineligible
  if (missingRequiredSkills.length > 0) {
    isEligible = false;
    ineligibilityReasons.push(
      `Missing required skills: ${missingRequiredSkills.join(", ")}`
    );
  }

  const matchedPreferredSkills: string[] = [];
  const missingPreferredSkills: string[] = [];

  for (const item of preferredListingSkills) {
    const canonical = normalizeSkill(item.name);
    if (studentSkillSet.has(canonical.toLowerCase())) {
      matchedPreferredSkills.push(canonical);
    } else {
      missingPreferredSkills.push(canonical);
    }
  }

  // ---------------------------------------------------------------------------
  // Step C: Weighted Relevance Scoring (Weights sum to 100)
  // ---------------------------------------------------------------------------

  // 1. Skills overlap (35% total: 25% required + 10% preferred)
  let skillsScore = 0;
  if (requiredListingSkills.length === 0) {
    skillsScore += 25;
  } else {
    skillsScore += (matchedRequiredSkills.length / requiredListingSkills.length) * 25;
  }

  if (preferredListingSkills.length === 0) {
    skillsScore += 10;
  } else {
    skillsScore += (matchedPreferredSkills.length / preferredListingSkills.length) * 10;
  }

  // 2. Educational relevance (15%)
  let educationScore = 5; // Base baseline
  let educationFit = "General educational background";

  if (student.education && student.education.length > 0) {
    educationScore = 10; // Default if records exist
    educationFit = "Degree program on file";

    const sectorLower = internship.sector.toLowerCase();
    const titleLower = internship.title.toLowerCase();

    for (const edu of student.education) {
      const fieldLower = (edu.fieldOfStudy || "").toLowerCase();
      const degreeLower = (edu.degree || "").toLowerCase();

      const isDirectMatch =
        (fieldLower && sectorLower.includes(fieldLower)) ||
        (fieldLower && titleLower.includes(fieldLower)) ||
        (sectorLower.includes("tech") && (fieldLower.includes("computer") || fieldLower.includes("info") || fieldLower.includes("software") || fieldLower.includes("dev"))) ||
        (sectorLower.includes("design") && (fieldLower.includes("design") || fieldLower.includes("multimedia") || fieldLower.includes("art"))) ||
        (sectorLower.includes("finance") && (fieldLower.includes("finance") || fieldLower.includes("accounting") || fieldLower.includes("economy")));

      if (isDirectMatch) {
        educationScore = 15;
        educationFit = `Strong curriculum match: ${edu.degree} in ${edu.fieldOfStudy || "relevant field"}`;
        break;
      }
    }
  }

  // 3. Location / Work Modality (15%)
  let locationScore = 3;
  let locationFit = "Location accommodation required";

  const normStudentCity = normalizeCity(student.city);
  const normListingCity = normalizeCity(internship.city);

  if (internship.modality === "REMOTE") {
    locationScore = 15;
    locationFit = "Remote work modality (compatible with all regions)";
  } else if (normStudentCity.toLowerCase() === normListingCity.toLowerCase()) {
    locationScore = 15;
    locationFit = `Direct location match in ${normListingCity}`;
  } else if (internship.modality === "HYBRID") {
    locationScore = 10;
    locationFit = `Hybrid position in ${normListingCity} (partial presence required)`;
  } else if (!student.city) {
    locationScore = 8;
    locationFit = `Candidate location unspecified for ${normListingCity} position`;
  } else {
    locationScore = 4;
    locationFit = `Candidate in ${normStudentCity}, on-site position in ${normListingCity}`;
  }

  // 4. Field / Career Alignment (15%)
  let fieldScore = 8;
  let fieldFit = "General industry alignment";

  if (student.fieldPreference) {
    const prefLower = student.fieldPreference.toLowerCase();
    const sectorLower = internship.sector.toLowerCase();

    if (sectorLower.includes(prefLower) || prefLower.includes(sectorLower)) {
      fieldScore = 15;
      fieldFit = `Direct alignment with preferred career field (${student.fieldPreference})`;
    } else {
      fieldScore = 6;
      fieldFit = `Position sector (${internship.sector}) differs from primary interest (${student.fieldPreference})`;
    }
  } else {
    fieldScore = 10;
  }

  // 5. Availability & Duration (10%)
  // Standard internship spans 8 to 24 weeks
  let durationScore = 10;
  if (internship.durationWeeks < 4 || internship.durationWeeks > 32) {
    durationScore = 6;
  }

  // 6. Language Fit (10%)
  // Default to full 10% in Moroccan higher education context
  const languageScore = 10;

  // Total raw score sum
  const rawTotal =
    skillsScore +
    educationScore +
    locationScore +
    fieldScore +
    durationScore +
    languageScore;

  const score = Math.min(100, Math.max(0, Math.round(rawTotal)));

  // Generate transparent human summary
  let summary = "";
  if (!isEligible) {
    summary = `Ineligible: ${ineligibilityReasons.join("; ")}. Overall compatibility score: ${score}%.`;
  } else if (score >= 80) {
    summary = `High compatibility (${score}%). Strong match on ${matchedRequiredSkills.length} required skills and location profile.`;
  } else if (score >= 60) {
    summary = `Moderate compatibility (${score}%). Meets all core requirements with some optional skill or location gaps.`;
  } else {
    summary = `Baseline compatibility (${score}%). Meets mandatory requirements but differs in specialization or modality.`;
  }

  return {
    internshipId: internship.id,
    studentId: student.id,
    score,
    scoreVersion: MATCHING_ALGORITHM_VERSION,
    isEligible,
    matchFactors: {
      matchedRequiredSkills,
      matchedPreferredSkills,
      skillsScore: Math.round(skillsScore),
      educationScore: Math.round(educationScore),
      locationScore: Math.round(locationScore),
      fieldScore: Math.round(fieldScore),
      durationScore: Math.round(durationScore),
      languageScore: Math.round(languageScore),
      locationFit,
      educationFit,
      fieldFit,
    },
    missingFactors: {
      missingRequiredSkills,
      missingPreferredSkills,
      ineligibilityReasons,
    },
    summary,
    disclaimer: MATCHING_DISCLAIMER,
    calculatedAt: new Date().toISOString(),
  };
}
