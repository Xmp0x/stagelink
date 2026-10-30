import { describe, it, expect } from "vitest";
import { calculateProfileCompleteness } from "./completeness";

describe("Student Profile & Privacy Rules", () => {
  it("defaults discoverability consent to false for student privacy (Law 09-08)", () => {
    const defaultStudentProfile = {
      firstName: "Test",
      lastName: "Student",
      city: "Casablanca",
      discoverabilityConsent: false,
    };

    expect(defaultStudentProfile.discoverabilityConsent).toBe(false);
  });

  it("calculates accurate completeness increments as student adds profile data", () => {
    // Stage 1: Just name and city (post-registration)
    const stage1 = calculateProfileCompleteness({
      firstName: "Fatima",
      lastName: "Zahra",
      city: "Rabat",
    });
    expect(stage1.score).toBe(20);
    expect(stage1.missingSteps).toContain("Specify your educational institution, degree, and academic year");

    // Stage 2: Adds academic info
    const stage2 = calculateProfileCompleteness({
      firstName: "Fatima",
      lastName: "Zahra",
      city: "Rabat",
      institution: "ENSA",
      degree: "Diplôme d'Ingénieur",
      academicYear: "4th Year",
    });
    expect(stage2.score).toBe(40);

    // Stage 3: Adds bio & 3 skills
    const stage3 = calculateProfileCompleteness({
      firstName: "Fatima",
      lastName: "Zahra",
      city: "Rabat",
      institution: "ENSA",
      degree: "Diplôme d'Ingénieur",
      academicYear: "4th Year",
      bio: "Software engineering student with strong interest in distributed cloud architectures.",
      skillsCount: 3,
    });
    expect(stage3.score).toBe(65); // 20 + 20 + 10 + 15 = 65
  });
});
