/**
 * StageLink Moroccan Demonstration Seed Script
 * 
 * Creates realistic, ethically compliant seed data strictly labeled with [DEMO] prefix.
 * Complies with Moroccan Law 09-08 and Phase P9 requirements.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 StageLink Moroccan Demo Seed Runner");

  // Check database connectivity
  try {
    await prisma.$connect();
  } catch (err) {
    console.warn("\n⚠️  PostgreSQL Database is not reachable at DATABASE_URL.");
    console.warn("   To seed the database, start your local PostgreSQL service or run:");
    console.warn("   docker run --name stagelink-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=stagelink -p 5432:5432 -d postgres:16-alpine\n");
    console.warn("   Then re-run: npm run db:push && npm run db:seed\n");
    return;
  }

  console.log("🌱 Connected to database. Seeding realistic Moroccan demo data...");

  // 1. Seed Canonical Skills
  console.log("📦 Seeding canonical skills taxonomy...");
  const skillsData = [
    { name: "React", category: "Frontend" },
    { name: "TypeScript", category: "Programming Languages" },
    { name: "JavaScript", category: "Programming Languages" },
    { name: "Node.js", category: "Backend" },
    { name: "Next.js", category: "Frontend" },
    { name: "Python", category: "Programming Languages" },
    { name: "PostgreSQL", category: "Databases" },
    { name: "Docker", category: "DevOps" },
    { name: "Kubernetes", category: "DevOps" },
    { name: "AWS", category: "Cloud" },
    { name: "UI/UX Design", category: "Design" },
    { name: "Tailwind CSS", category: "Frontend" },
    { name: "Linux", category: "Systems" },
    { name: "Agile / Scrum", category: "Methodologies" },
    { name: "Communication", category: "Soft Skills" },
  ];

  const skillRecords = {};
  for (const skill of skillsData) {
    const record = await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    });
    skillRecords[skill.name] = record;
  }

  // 2. Seed Base Accounts
  console.log("👤 Seeding core user accounts (Admin, Employer, Students)...");
  const defaultPasswordHash = await bcrypt.hash("StageLink2026!", 10);

  // Admin Account
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@stagelink.ma" },
    update: {},
    create: {
      email: "admin@stagelink.ma",
      passwordHash: defaultPasswordHash,
      role: "ADMIN",
      isEmailVerified: true,
      isActive: true,
    },
  });

  // Employer Account
  const employerUser = await prisma.user.upsert({
    where: { email: "employer@stagelink.ma" },
    update: {},
    create: {
      email: "employer@stagelink.ma",
      passwordHash: defaultPasswordHash,
      role: "COMPANY",
      isEmailVerified: true,
      isActive: true,
    },
  });

  // Student 1 (Casablanca - Software Engineering)
  const student1User = await prisma.user.upsert({
    where: { email: "yassine@stagelink.ma" },
    update: {},
    create: {
      email: "yassine@stagelink.ma",
      passwordHash: defaultPasswordHash,
      role: "STUDENT",
      isEmailVerified: true,
      isActive: true,
    },
  });

  const student1Profile = await prisma.studentProfile.upsert({
    where: { userId: student1User.id },
    update: {},
    create: {
      userId: student1User.id,
      firstName: "Yassine",
      lastName: "Alami",
      city: "Casablanca",
      institution: "EMSI Casablanca",
      degree: "Diplôme d'Ingénieur",
      academicYear: "Final Year (PFE)",
      bio: "Passionate full-stack software engineering student specializing in React, TypeScript, and modern web architectures.",
      discoverabilityConsent: true,
      profileCompleteness: 85,
    },
  });

  // Education for Student 1
  await prisma.studentEducation.deleteMany({ where: { studentId: student1Profile.id } });
  await prisma.studentEducation.create({
    data: {
      studentId: student1Profile.id,
      school: "EMSI Casablanca",
      degree: "Diplôme d'Ingénieur",
      fieldOfStudy: "Software Engineering & Computer Science",
      startDate: new Date("2021-09-01"),
      isCurrent: true,
    },
  });

  // Skills for Student 1
  await prisma.studentSkill.deleteMany({ where: { studentId: student1Profile.id } });
  const student1Skills = ["React", "TypeScript", "Node.js", "Tailwind CSS", "PostgreSQL"];
  for (const s of student1Skills) {
    if (skillRecords[s]) {
      await prisma.studentSkill.create({
        data: {
          studentId: student1Profile.id,
          skillId: skillRecords[s].id,
          proficiency: "ADVANCED",
        },
      });
    }
  }

  // Languages for Student 1
  await prisma.studentLanguage.deleteMany({ where: { studentId: student1Profile.id } });
  await prisma.studentLanguage.createMany({
    data: [
      { studentId: student1Profile.id, language: "French", proficiency: "FLUENT" },
      { studentId: student1Profile.id, language: "English", proficiency: "FLUENT" },
      { studentId: student1Profile.id, language: "Arabic", proficiency: "NATIVE" },
    ],
  });

  // Student 2 (Tangier - UI/UX Design & Front-End, CMC Tangier)
  const student2User = await prisma.user.upsert({
    where: { email: "hafsa@stagelink.ma" },
    update: {},
    create: {
      email: "hafsa@stagelink.ma",
      passwordHash: defaultPasswordHash,
      role: "STUDENT",
      isEmailVerified: true,
      isActive: true,
    },
  });

  const student2Profile = await prisma.studentProfile.upsert({
    where: { userId: student2User.id },
    update: {},
    create: {
      userId: student2User.id,
      firstName: "Hafsa",
      lastName: "Berrada",
      city: "Tangier",
      institution: "CMC Tangier",
      degree: "Technicien Spécialisé",
      academicYear: "2nd Year",
      bio: "CMC Tangier digital design & front-end student focused on UI/UX prototyping and accessible web interfaces.",
      discoverabilityConsent: true,
      profileCompleteness: 90,
    },
  });

  await prisma.studentEducation.deleteMany({ where: { studentId: student2Profile.id } });
  await prisma.studentEducation.create({
    data: {
      studentId: student2Profile.id,
      school: "Cité des Métiers et des Compétences (CMC) Tangier",
      degree: "Technicien Spécialisé",
      fieldOfStudy: "Digital Design & Web Development",
      startDate: new Date("2024-09-01"),
      isCurrent: true,
    },
  });

  await prisma.studentSkill.deleteMany({ where: { studentId: student2Profile.id } });
  const student2Skills = ["UI/UX Design", "Tailwind CSS", "JavaScript", "React", "Communication"];
  for (const s of student2Skills) {
    if (skillRecords[s]) {
      await prisma.studentSkill.create({
        data: {
          studentId: student2Profile.id,
          skillId: skillRecords[s].id,
          proficiency: "ADVANCED",
        },
      });
    }
  }

  // 3. Seed Companies (Clearly Marked [DEMO])
  console.log("🏢 Seeding verified Moroccan demo organizations...");

  // Company 1: Casablanca Fintech
  let company1 = await prisma.company.findFirst({
    where: { legalName: "[DEMO] Casablanca Fintech Solutions SARL" },
  });
  if (!company1) {
    company1 = await prisma.company.create({
      data: {
        legalName: "[DEMO] Casablanca Fintech Solutions SARL",
        tradeName: "[DEMO] CasaFintech Lab",
        sector: "Financial Technology",
        city: "Casablanca",
        description: "Innovative Casablanca fintech venture building next-generation digital payment platforms and microfinance rails.",
        website: "https://demo.casafintech.ma",
        status: "VERIFIED",
      },
    });
  }

  await prisma.companyMembership.upsert({
    where: {
      companyId_userId: { companyId: company1.id, userId: employerUser.id },
    },
    update: {},
    create: {
      companyId: company1.id,
      userId: employerUser.id,
      role: "ADMIN",
    },
  });

  await prisma.companyVerification.deleteMany({ where: { companyId: company1.id } });
  await prisma.companyVerification.create({
    data: {
      companyId: company1.id,
      registrationNumber: "RC-CASA-452810 / ICE-002819401000088",
      status: "APPROVED",
      reviewerNotes: "Verified via Casablanca Commercial Court registry (Demo simulated).",
      reviewedAt: new Date(),
      reviewedByUserId: adminUser.id,
    },
  });

  // Company 2: Tangier Med Logistics Systems
  let company2 = await prisma.company.findFirst({
    where: { legalName: "[DEMO] Tangier Med Logistics Systems SA" },
  });
  if (!company2) {
    company2 = await prisma.company.create({
      data: {
        legalName: "[DEMO] Tangier Med Logistics Systems SA",
        tradeName: "[DEMO] TMS Logistics Port Hub",
        sector: "Logistics & Supply Chain",
        city: "Tangier",
        description: "Smart maritime terminal and supply-chain logistics technology operator situated at Tangier Med Port Complex.",
        website: "https://demo.tmslogistics.ma",
        status: "VERIFIED",
      },
    });
  }

  // Company 3: Rabat Cloud
  let company3 = await prisma.company.findFirst({
    where: { legalName: "[DEMO] Rabat Cloud & DevOps Innovations SARL" },
  });
  if (!company3) {
    company3 = await prisma.company.create({
      data: {
        legalName: "[DEMO] Rabat Cloud & DevOps Innovations SARL",
        tradeName: "[DEMO] RabatCloud AI",
        sector: "Cloud Infrastructure & AI",
        city: "Rabat",
        description: "Cloud-native infrastructure and automated MLOps engineering studio based at Rabat Technopolis.",
        website: "https://demo.rabatcloud.ma",
        status: "VERIFIED",
      },
    });
  }

  // 4. Seed Internship Listings (All marked [DEMO])
  console.log("💼 Seeding authentic verified Moroccan demo internship opportunities...");

  // Listing 1: Full-Stack in Casablanca
  const deadlineFuture = new Date(Date.now() + 60 * 86400000);
  let listing1 = await prisma.internship.findFirst({
    where: { title: "[DEMO] Full-Stack TypeScript Engineering Intern" },
  });
  if (!listing1) {
    listing1 = await prisma.internship.create({
      data: {
        companyId: company1.id,
        title: "[DEMO] Full-Stack TypeScript Engineering Intern",
        sector: "Software Engineering",
        city: "Casablanca",
        modality: "HYBRID",
        durationWeeks: 16,
        startMonth: "July 2026",
        deadlineDate: deadlineFuture,
        openPositions: 2,
        isPaid: true,
        stipendAmount: 3500,
        status: "PUBLISHED",
        publishedAt: new Date(),
        description: "Join CasaFintech to build modern responsive web portals for digital treasury and payment gateway interfaces. You will work alongside senior software engineers using Next.js, TypeScript, and Prisma.",
        requirements: "Hands-on experience building web applications with React or TypeScript. Understanding of relational databases and Git version control.",
      },
    });

    await prisma.internshipSkill.createMany({
      data: [
        { internshipId: listing1.id, skillId: skillRecords["React"].id, isRequired: true },
        { internshipId: listing1.id, skillId: skillRecords["TypeScript"].id, isRequired: true },
        { internshipId: listing1.id, skillId: skillRecords["Node.js"].id, isRequired: true },
        { internshipId: listing1.id, skillId: skillRecords["Docker"].id, isRequired: false },
      ],
    });
  }

  // Listing 2: Smart Port Logistics in Tangier
  let listing2 = await prisma.internship.findFirst({
    where: { title: "[DEMO] Smart Port Logistics Software Intern" },
  });
  if (!listing2) {
    listing2 = await prisma.internship.create({
      data: {
        companyId: company2.id,
        title: "[DEMO] Smart Port Logistics Software Intern",
        sector: "Logistics & Supply Chain",
        city: "Tangier",
        modality: "ONSITE",
        durationWeeks: 12,
        startMonth: "August 2026",
        deadlineDate: deadlineFuture,
        openPositions: 3,
        isPaid: true,
        stipendAmount: 4000,
        status: "PUBLISHED",
        publishedAt: new Date(),
        description: "Develop container tracking algorithms and backend services integrated with container terminal telemetry at Tangier Med Port.",
        requirements: "Familiarity with Python or backend APIs. Passion for industrial IoT and supply chain modernization.",
      },
    });

    await prisma.internshipSkill.createMany({
      data: [
        { internshipId: listing2.id, skillId: skillRecords["Python"].id, isRequired: true },
        { internshipId: listing2.id, skillId: skillRecords["PostgreSQL"].id, isRequired: true },
        { internshipId: listing2.id, skillId: skillRecords["Docker"].id, isRequired: true },
      ],
    });
  }

  // Listing 3: Cloud & DevOps in Rabat (Remote)
  let listing3 = await prisma.internship.findFirst({
    where: { title: "[DEMO] Cloud & DevOps Infrastructure Intern" },
  });
  if (!listing3) {
    listing3 = await prisma.internship.create({
      data: {
        companyId: company3.id,
        title: "[DEMO] Cloud & DevOps Infrastructure Intern",
        sector: "Cloud Infrastructure & AI",
        city: "Rabat",
        modality: "REMOTE",
        durationWeeks: 12,
        startMonth: "July 2026",
        deadlineDate: deadlineFuture,
        openPositions: 1,
        isPaid: true,
        stipendAmount: 3000,
        status: "PUBLISHED",
        publishedAt: new Date(),
        description: "Automate CI/CD pipelines and infrastructure-as-code for containerized cloud workloads deployed across multi-region environments.",
        requirements: "Knowledge of Linux fundamentals, Docker containerization, and basic cloud concepts.",
      },
    });

    await prisma.internshipSkill.createMany({
      data: [
        { internshipId: listing3.id, skillId: skillRecords["Docker"].id, isRequired: true },
        { internshipId: listing3.id, skillId: skillRecords["Linux"].id, isRequired: true },
        { internshipId: listing3.id, skillId: skillRecords["Kubernetes"].id, isRequired: false },
      ],
    });
  }

  // Listing 4: UI/UX Product Design in Casablanca
  let listing4 = await prisma.internship.findFirst({
    where: { title: "[DEMO] UI/UX Product Design Intern" },
  });
  if (!listing4) {
    listing4 = await prisma.internship.create({
      data: {
        companyId: company1.id,
        title: "[DEMO] UI/UX Product Design Intern",
        sector: "Design & User Experience",
        city: "Casablanca",
        modality: "HYBRID",
        durationWeeks: 8,
        startMonth: "July 2026",
        deadlineDate: deadlineFuture,
        openPositions: 1,
        isPaid: true,
        stipendAmount: 2500,
        status: "PUBLISHED",
        publishedAt: new Date(),
        description: "Craft high-fidelity design systems and user journey flows for consumer finance mobile and web apps.",
        requirements: "Strong portfolio in Figma or modern design tools. Empathy for end users and accessibility standards.",
      },
    });

    await prisma.internshipSkill.createMany({
      data: [
        { internshipId: listing4.id, skillId: skillRecords["UI/UX Design"].id, isRequired: true },
        { internshipId: listing4.id, skillId: skillRecords["Communication"].id, isRequired: true },
        { internshipId: listing4.id, skillId: skillRecords["Tailwind CSS"].id, isRequired: false },
      ],
    });
  }

  // 5. Seed Demonstration Applications
  console.log("📝 Seeding candidate application journeys in ATS...");
  await prisma.application.upsert({
    where: {
      studentId_internshipId: {
        studentId: student1Profile.id,
        internshipId: listing1.id,
      },
    },
    update: {},
    create: {
      studentId: student1Profile.id,
      internshipId: listing1.id,
      status: "INTERVIEW",
      coverNote: "I am excited to apply for this Full-Stack role. My experience in React, TypeScript, and PostgreSQL at EMSI Casablanca aligns directly with CasaFintech's stack.",
      events: {
        create: [
          {
            toStatus: "SUBMITTED",
            actorUserId: student1User.id,
            note: "Application submitted via StageLink candidate portal.",
          },
          {
            fromStatus: "SUBMITTED",
            toStatus: "UNDER_REVIEW",
            actorUserId: employerUser.id,
            note: "Candidate profile and technical skills reviewed.",
          },
          {
            fromStatus: "UNDER_REVIEW",
            toStatus: "INTERVIEW",
            actorUserId: employerUser.id,
            note: "Invited to technical discussion on Tuesday at 14:00 GMT+1.",
          },
        ],
      },
    },
  });

  // 6. Seed System Audit Event
  await prisma.auditEvent.create({
    data: {
      actorUserId: adminUser.id,
      action: "PLATFORM_DEMO_SEED_COMPLETED",
      targetType: "System",
      targetId: "genesis",
      metadata: JSON.stringify({
        seededCompanies: 3,
        seededListings: 4,
        seededStudents: 2,
        seedVersion: "1.0.0",
      }),
    },
  });

  console.log("✅ StageLink Moroccan demo seed successfully completed!");
  console.log(`
  Credentials summary:
  • Admin:    admin@stagelink.ma    / StageLink2026!
  • Employer: employer@stagelink.ma / StageLink2026!
  • Student:  yassine@stagelink.ma  / StageLink2026!
  • Student:  hafsa@stagelink.ma    / StageLink2026!
  `);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
