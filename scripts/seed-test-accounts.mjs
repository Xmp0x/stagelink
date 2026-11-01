import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Local-only fixture. Re-running preserves accounts and flow progress.
const url = new URL(process.env.DATABASE_URL);
if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.pathname !== "/stagelink") {
  throw new Error("Test accounts require the local stagelink database.");
}
const prisma = new PrismaClient();
const password = "StageLinkTest2026!";

try {
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction(async (tx) => {
    const student = await tx.user.upsert({
      where: { email: "student@stagelink.test" }, update: {},
      create: { email: "student@stagelink.test", passwordHash, role: "STUDENT", isActive: true, isEmailVerified: true },
    });
    const employer = await tx.user.upsert({
      where: { email: "company@stagelink.test" }, update: {},
      create: { email: "company@stagelink.test", passwordHash, role: "COMPANY", isActive: true, isEmailVerified: true },
    });
    const skills = [];
    for (const name of ["React", "TypeScript", "JavaScript"]) {
      skills.push(await tx.skill.upsert({ where: { name }, update: {}, create: { name, category: "Software Engineering" } }));
    }
    await tx.studentProfile.upsert({
      where: { userId: student.id }, update: {},
      create: {
        userId: student.id, firstName: "Amine", lastName: "Demo", city: "Tangier",
        institution: "[DEMO] Test Institute", degree: "Bachelor", academicYear: "Final Year",
        bio: "Fictional student for testing internship applications and matching flows.",
        availableFrom: new Date(), preferredDurationWeeks: 12, preferredModality: "HYBRID",
        discoverabilityConsent: true, profileCompleteness: 100,
        education: { create: { school: "[DEMO] Test Institute", degree: "Bachelor", fieldOfStudy: "Software Engineering", isCurrent: true } },
        skills: { create: skills.map(skill => ({ skillId: skill.id, proficiency: "INTERMEDIATE" })) },
        languages: { create: [{ language: "English", proficiency: "FLUENT" }, { language: "Arabic", proficiency: "NATIVE" }] },
      },
    });
    const company = await tx.company.upsert({
      where: { id: "stagelink-test-company" }, update: {},
      create: {
        id: "stagelink-test-company", legalName: "[DEMO] StageLink Test Company",
        sector: "Software Engineering", city: "Tangier", status: "VERIFIED",
        description: "Fictional company for local recruitment flow testing. Verification is simulated.",
        memberships: { create: { userId: employer.id, role: "OWNER" } },
        verifications: { create: { status: "APPROVED", reviewerNotes: "Simulated local test verification; not a real company.", reviewedAt: new Date() } },
      },
    });
    await tx.internship.upsert({
      where: { id: "stagelink-test-internship" }, update: {},
      create: {
        id: "stagelink-test-internship", companyId: company.id,
        title: "[DEMO] Frontend Developer Intern", sector: "Software Engineering", city: "Tangier",
        modality: "HYBRID", durationWeeks: 12, deadlineDate: new Date(Date.now() + 90 * 86400000),
        openPositions: 2, description: "Test opportunity: build accessible React interfaces with TypeScript alongside a fictional engineering team.",
        requirements: "React, TypeScript, and JavaScript fundamentals.", isPaid: true, stipendAmount: 2500,
        status: "PUBLISHED", publishedAt: new Date(),
        skills: { create: skills.map(skill => ({ skillId: skill.id, isRequired: true })) },
      },
    });
  });
  for (const email of ["student@stagelink.test", "company@stagelink.test"]) {
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    if (!await bcrypt.compare(password, user.passwordHash)) throw new Error(`Existing account ${email} has a different password; preserved it.`);
    console.log(`${user.role}: ${email} / ${password}`);
  }
} finally {
  await prisma.$disconnect();
}
