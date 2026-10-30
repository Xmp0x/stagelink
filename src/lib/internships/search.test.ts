import { describe, it, expect } from "vitest";

// Query builder mirroring /api/internships strict database visibility rules
export function buildInternshipSearchQuery(params: {
  q?: string;
  city?: string;
  modality?: string;
  isPaid?: string;
  now?: Date;
}) {
  const now = params.now || new Date();

  const where: any = {
    status: "PUBLISHED",
    deadlineDate: { gte: now },
    company: {
      status: "VERIFIED",
    },
  };

  if (params.city && params.city.toLowerCase() !== "all") {
    where.city = { equals: params.city, mode: "insensitive" };
  }

  if (params.modality && ["REMOTE", "ONSITE", "HYBRID"].includes(params.modality.toUpperCase())) {
    where.modality = params.modality.toUpperCase();
  }

  if (params.isPaid !== undefined && params.isPaid !== "all") {
    where.isPaid = params.isPaid === "true";
  }

  if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
      {
        skills: {
          some: {
            skill: {
              name: { contains: params.q, mode: "insensitive" },
            },
          },
        },
      },
    ];
  }

  return where;
}

describe("Internship Search Visibility Rules", () => {
  it("enforces mandatory baseline filters: PUBLISHED, VERIFIED company, non-expired deadline", () => {
    const fixedNow = new Date("2026-10-30T12:00:00Z");
    const query = buildInternshipSearchQuery({ now: fixedNow });

    expect(query.status).toBe("PUBLISHED");
    expect(query.company.status).toBe("VERIFIED");
    expect(query.deadlineDate.gte).toEqual(fixedNow);
  });

  it("applies Moroccan city filter correctly", () => {
    const query = buildInternshipSearchQuery({ city: "Tangier" });
    expect(query.city).toEqual({ equals: "Tangier", mode: "insensitive" });
  });

  it("applies modality and isPaid filters", () => {
    const query = buildInternshipSearchQuery({
      modality: "HYBRID",
      isPaid: "true",
    });

    expect(query.modality).toBe("HYBRID");
    expect(query.isPaid).toBe(true);
  });

  it("builds multi-field OR clause for keyword search", () => {
    const query = buildInternshipSearchQuery({ q: "Figma" });
    expect(query.OR).toBeDefined();
    expect(query.OR.length).toBe(3);
  });
});
