import { describe, it, expect } from "vitest";
import { calculateProfileCompleteness } from "./completeness";

describe("Profile Completeness Engine", () => {
  it("should calculate 20 points for basic info only", () => {
    const result = calculateProfileCompleteness({
      firstName: "Hamza",
      lastName: "El Idrissi",
      city: "Tangier",
    });

    expect(result.score).toBe(20);
    expect(result.breakdown.basicInfo.completed).toBe(true);
    expect(result.breakdown.academics.completed).toBe(false);
    expect(result.missingSteps.length).toBeGreaterThan(0);
  });

  it("should calculate 100 points for a fully completed profile", () => {
    const result = calculateProfileCompleteness({
      firstName: "Hamza",
      lastName: "El Idrissi",
      city: "Tangier",
      institution: "CMC Tangier",
      degree: "Technicien Spécialisé",
      academicYear: "2nd Year",
      bio: "Aspiring full stack software developer with hands-on experience in Next.js and React.",
      educationCount: 1,
      skillsCount: 4,
      languagesCount: 2,
      availableFrom: new Date("2026-06-01"),
      availableTo: new Date("2026-08-31"),
      preferredDurationWeeks: 8,
    });

    expect(result.score).toBe(100);
    expect(result.missingSteps.length).toBe(0);
    expect(result.breakdown.basicInfo.completed).toBe(true);
    expect(result.breakdown.academics.completed).toBe(true);
    expect(result.breakdown.bio.completed).toBe(true);
    expect(result.breakdown.education.completed).toBe(true);
    expect(result.breakdown.skills.completed).toBe(true);
    expect(result.breakdown.languages.completed).toBe(true);
    expect(result.breakdown.availability.completed).toBe(true);
  });

  it("should award partial points for 1 or 2 skills", () => {
    const result = calculateProfileCompleteness({
      firstName: "Hamza",
      lastName: "El Idrissi",
      city: "Tangier",
      skillsCount: 2,
    });

    // 20 (basic) + 10 (2/3 of 15) = 30
    expect(result.score).toBe(30);
    expect(result.breakdown.skills.completed).toBe(false);
  });
});
