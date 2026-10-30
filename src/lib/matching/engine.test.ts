import { describe, it, expect } from "vitest";
import { normalizeSkill, normalizeCity } from "./skillsCatalog";
import {
  evaluateMatch,
  MATCHING_ALGORITHM_VERSION,
  MATCHING_DISCLAIMER,
  type StudentMatchProfile,
  type InternshipMatchListing,
} from "./engine";

describe("Skills Catalog & City Normalizer", () => {
  it("normalizes common tech and design skill synonyms", () => {
    expect(normalizeSkill("react.js")).toBe("React");
    expect(normalizeSkill("reactjs")).toBe("React");
    expect(normalizeSkill("ts")).toBe("TypeScript");
    expect(normalizeSkill("figma")).toBe("UI/UX Design");
    expect(normalizeSkill("ui/ux")).toBe("UI/UX Design");
    expect(normalizeSkill("nodejs")).toBe("Node.js");
    expect(normalizeSkill("k8s")).toBe("Kubernetes");
    expect(normalizeSkill("docker")).toBe("Docker");
  });

  it("handles fallback skill capitalization cleanly", () => {
    expect(normalizeSkill("quantum computing")).toBe("Quantum Computing");
  });

  it("normalizes Moroccan cities accurately", () => {
    expect(normalizeCity("casa")).toBe("Casablanca");
    expect(normalizeCity("Casablanca")).toBe("Casablanca");
    expect(normalizeCity("tanger")).toBe("Tangier");
    expect(normalizeCity("tanja")).toBe("Tangier");
    expect(normalizeCity("Rabat-Sale")).toBe("Rabat");
    expect(normalizeCity("remote")).toBe("Remote");
  });
});

describe("Matching Engine Core Algorithm", () => {
  const baseStudent: StudentMatchProfile = {
    id: "student-1",
    name: "Yassine Alami",
    city: "Casablanca",
    fieldPreference: "Software Engineering",
    discoverabilityConsent: true,
    skills: [
      { name: "React" },
      { name: "TypeScript" },
      { name: "Node.js" },
      { name: "Tailwind CSS" },
    ],
    education: [
      {
        school: "EMSI Casablanca",
        degree: "Diplôme d'Ingénieur",
        fieldOfStudy: "Software Engineering",
      },
    ],
    languages: [{ language: "English" }, { language: "French" }],
  };

  const baseListing: InternshipMatchListing = {
    id: "internship-1",
    title: "Full-Stack Web Engineering Intern",
    sector: "Software Engineering",
    city: "Casablanca",
    modality: "HYBRID",
    durationWeeks: 12,
    deadlineDate: new Date(Date.now() + 86400000 * 30), // 30 days ahead
    status: "PUBLISHED",
    company: {
      id: "company-1",
      name: "Casablanca Tech Hub",
      status: "VERIFIED",
    },
    skills: [
      { name: "React", isRequired: true },
      { name: "TypeScript", isRequired: true },
      { name: "Docker", isRequired: false },
    ],
  };

  it("produces high score and marks eligible when all required skills and criteria match", () => {
    const result = evaluateMatch(baseStudent, baseListing);

    expect(result.isEligible).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.scoreVersion).toBe(MATCHING_ALGORITHM_VERSION);
    expect(result.disclaimer).toBe(MATCHING_DISCLAIMER);
    expect(result.matchFactors.matchedRequiredSkills).toContain("React");
    expect(result.matchFactors.matchedRequiredSkills).toContain("TypeScript");
    expect(result.missingFactors.missingRequiredSkills).toHaveLength(0);
    expect(result.missingFactors.missingPreferredSkills).toContain("Docker");
  });

  it("marks as ineligible when a mandatory required skill is missing", () => {
    const listingWithMissingSkill: InternshipMatchListing = {
      ...baseListing,
      skills: [
        { name: "React", isRequired: true },
        { name: "Rust", isRequired: true }, // Student does not possess Rust
      ],
    };

    const result = evaluateMatch(baseStudent, listingWithMissingSkill);

    expect(result.isEligible).toBe(false);
    expect(result.missingFactors.missingRequiredSkills).toContain("Rust");
    expect(result.missingFactors.ineligibilityReasons.join(" ")).toMatch(
      /Missing required skills: Rust/
    );
  });

  it("marks as ineligible when deadline has passed", () => {
    const expiredListing: InternshipMatchListing = {
      ...baseListing,
      deadlineDate: new Date(Date.now() - 86400000), // Yesterday
    };

    const result = evaluateMatch(baseStudent, expiredListing);

    expect(result.isEligible).toBe(false);
    expect(result.missingFactors.ineligibilityReasons.join(" ")).toMatch(
      /Application deadline has passed/
    );
  });

  it("marks as ineligible when company is not verified", () => {
    const unverifiedListing: InternshipMatchListing = {
      ...baseListing,
      company: {
        id: "company-unverified",
        name: "Unverified Startup",
        status: "PENDING_VERIFICATION",
      },
    };

    const result = evaluateMatch(baseStudent, unverifiedListing);

    expect(result.isEligible).toBe(false);
    expect(result.missingFactors.ineligibilityReasons.join(" ")).toMatch(
      /Company verification is pending or rejected/
    );
  });

  it("is deterministic: evaluates identical inputs to identical outputs", () => {
    const result1 = evaluateMatch(baseStudent, baseListing);
    const result2 = evaluateMatch(baseStudent, baseListing);

    expect(result1.score).toBe(result2.score);
    expect(result1.isEligible).toBe(result2.isEligible);
    expect(result1.matchFactors.skillsScore).toBe(result2.matchFactors.skillsScore);
    expect(result1.summary).toBe(result2.summary);
  });

  it("handles remote work modality smoothly across different cities", () => {
    const remoteListing: InternshipMatchListing = {
      ...baseListing,
      city: "Tangier",
      modality: "REMOTE",
    };

    const result = evaluateMatch(baseStudent, remoteListing);
    expect(result.isEligible).toBe(true);
    expect(result.matchFactors.locationScore).toBe(15);
    expect(result.matchFactors.locationFit).toMatch(/Remote work modality/);
  });
});
