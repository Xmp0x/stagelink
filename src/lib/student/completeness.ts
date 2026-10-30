export interface CompletenessInput {
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  institution?: string | null;
  degree?: string | null;
  academicYear?: string | null;
  bio?: string | null;
  availableFrom?: Date | string | null;
  availableTo?: Date | string | null;
  preferredDurationWeeks?: number | null;
  educationCount?: number;
  skillsCount?: number;
  languagesCount?: number;
}

export interface CompletenessResult {
  score: number; // 0 to 100
  breakdown: {
    basicInfo: { score: number; max: number; completed: boolean };
    academics: { score: number; max: number; completed: boolean };
    bio: { score: number; max: number; completed: boolean };
    education: { score: number; max: number; completed: boolean };
    skills: { score: number; max: number; completed: boolean };
    languages: { score: number; max: number; completed: boolean };
    availability: { score: number; max: number; completed: boolean };
  };
  missingSteps: string[];
}

export function calculateProfileCompleteness(input: CompletenessInput): CompletenessResult {
  let score = 0;
  const missingSteps: string[] = [];

  // 1. Basic Info (20 pts)
  const hasBasicInfo = Boolean(input.firstName && input.lastName && input.city);
  const basicScore = hasBasicInfo ? 20 : 0;
  score += basicScore;
  if (!hasBasicInfo) {
    missingSteps.push("Provide your full name and city");
  }

  // 2. Academics (20 pts)
  const hasAcademics = Boolean(input.institution && input.degree && input.academicYear);
  const academicScore = hasAcademics ? 20 : 0;
  score += academicScore;
  if (!hasAcademics) {
    missingSteps.push("Specify your educational institution, degree, and academic year");
  }

  // 3. Bio / Summary (10 pts)
  const hasBio = Boolean(input.bio && input.bio.trim().length >= 20);
  const bioScore = hasBio ? 10 : 0;
  score += bioScore;
  if (!hasBio) {
    missingSteps.push("Write a professional bio (at least 20 characters)");
  }

  // 4. Education History (15 pts)
  const hasEducation = (input.educationCount ?? 0) >= 1;
  const educationScore = hasEducation ? 15 : 0;
  score += educationScore;
  if (!hasEducation) {
    missingSteps.push("Add at least one educational qualification or diploma");
  }

  // 5. Skills (15 pts)
  const skillsCount = input.skillsCount ?? 0;
  const hasSkills = skillsCount >= 3;
  const skillsScore = hasSkills ? 15 : Math.round((skillsCount / 3) * 15);
  score += skillsScore;
  if (!hasSkills) {
    missingSteps.push("Add at least 3 skills to match relevant internships");
  }

  // 6. Languages (10 pts)
  const hasLanguages = (input.languagesCount ?? 0) >= 1;
  const languagesScore = hasLanguages ? 10 : 0;
  score += languagesScore;
  if (!hasLanguages) {
    missingSteps.push("List the languages you speak (e.g. English, French, Arabic)");
  }

  // 7. Availability (10 pts)
  const hasAvailability = Boolean(input.availableFrom && input.preferredDurationWeeks);
  const availabilityScore = hasAvailability ? 10 : 0;
  score += availabilityScore;
  if (!hasAvailability) {
    missingSteps.push("Specify your internship availability start date and preferred duration");
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    breakdown: {
      basicInfo: { score: basicScore, max: 20, completed: hasBasicInfo },
      academics: { score: academicScore, max: 20, completed: hasAcademics },
      bio: { score: bioScore, max: 10, completed: hasBio },
      education: { score: educationScore, max: 15, completed: hasEducation },
      skills: { score: skillsScore, max: 15, completed: hasSkills },
      languages: { score: languagesScore, max: 10, completed: hasLanguages },
      availability: { score: availabilityScore, max: 10, completed: hasAvailability },
    },
    missingSteps,
  };
}
