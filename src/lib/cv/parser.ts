import { PDFParse } from "pdf-parse";

export interface ExtractedSkill {
  name: string;
  confidence: number;
}

export interface ExtractedEducation {
  school: string;
  degree: string;
  fieldOfStudy?: string;
  confidence: number;
}

export interface ExtractedCVData {
  rawText: string;
  pageCount: number;
  contact?: {
    email?: string;
    phone?: string;
  };
  skills: ExtractedSkill[];
  education: ExtractedEducation[];
  languages: string[];
  overallConfidence: number;
  warning?: string;
}

const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46]; // %PDF
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validatePdfBuffer(buffer: Buffer): { isValid: boolean; error?: string } {
  if (!buffer || buffer.length === 0) {
    return { isValid: false, error: "Uploaded file is empty." };
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File size exceeds the 5MB maximum limit (received ${(buffer.length / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  // Check magic bytes %PDF
  if (
    buffer.length < 4 ||
    buffer[0] !== PDF_MAGIC_BYTES[0] ||
    buffer[1] !== PDF_MAGIC_BYTES[1] ||
    buffer[2] !== PDF_MAGIC_BYTES[2] ||
    buffer[3] !== PDF_MAGIC_BYTES[3]
  ) {
    return {
      isValid: false,
      error: "Invalid file signature. File must be a valid PDF document.",
    };
  }

  return { isValid: true };
}

// Known Moroccan educational institutions & degree keywords
const INSTITUTION_KEYWORDS = [
  "CMC",
  "OFPPT",
  "1337",
  "ENSA",
  "ENSAM",
  "ENCG",
  "FST",
  "EST",
  "ISCAE",
  "EHTP",
  "EMI",
  "INSEA",
  "Université",
  "Universite",
  "University",
  "Faculté",
  "School",
];

const DEGREE_KEYWORDS = [
  "Technicien Spécialisé",
  "Technicien",
  "Diplôme d'Ingénieur",
  "Ingénieur d'État",
  "Licence Professionnelle",
  "Licence",
  "Master",
  "Doctorat",
  "DUT",
  "BTS",
  "Bachelor",
];

// Common tech, design & business skills
const KNOWN_SKILLS = [
  "React",
  "React Native",
  "Next.js",
  "Vue.js",
  "Angular",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Express",
  "NestJS",
  "Python",
  "Django",
  "FastAPI",
  "Java",
  "Spring Boot",
  "C++",
  "C#",
  ".NET",
  "PHP",
  "Laravel",
  "SQL",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "Docker",
  "Kubernetes",
  "Git",
  "GitHub",
  "CI/CD",
  "AWS",
  "Azure",
  "Linux",
  "Figma",
  "Adobe XD",
  "UI/UX Design",
  "Wireframing",
  "Prototyping",
  "Tailwind CSS",
  "HTML5",
  "CSS3",
  "REST API",
  "GraphQL",
  "Agile",
  "Scrum",
  "Machine Learning",
  "Data Analysis",
  "Pandas",
  "Excel",
  "Supply Chain",
  "Logistics",
];

export async function parseCvPdf(buffer: Buffer): Promise<ExtractedCVData> {
  const validation = validatePdfBuffer(buffer);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const parser = new PDFParse({ data: buffer });
  let rawText = "";
  let pageCount = 1;

  try {
    const textResult = await parser.getText();
    rawText = textResult.text || "";
    pageCount = textResult.total || 1;
  } finally {
    await parser.destroy();
  }

  // Check for scanned / non-selectable PDF
  if (rawText.trim().length < 30) {
    return {
      rawText: "",
      pageCount,
      skills: [],
      education: [],
      languages: [],
      overallConfidence: 0.0,
      warning:
        "The uploaded PDF appears to be a scanned image or lacks selectable text. Please upload a standard text PDF to enable automated profile extraction.",
    };
  }

  // 1. Extract Contact Info
  const emailMatch = rawText.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = rawText.match(/(?:\+212|0)[5-7]\d{8}/);

  // 2. Extract Skills
  const extractedSkills: ExtractedSkill[] = [];
  const lowerText = rawText.toLowerCase();

  for (const skill of KNOWN_SKILLS) {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (regex.test(rawText)) {
      extractedSkills.push({
        name: skill,
        confidence: 0.9,
      });
    }
  }

  // 3. Extract Education candidates
  const extractedEducation: ExtractedEducation[] = [];
  const lines = rawText.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);

  for (const line of lines) {
    const hasDegree = DEGREE_KEYWORDS.some((deg) => line.toLowerCase().includes(deg.toLowerCase()));
    const hasInst = INSTITUTION_KEYWORDS.some((inst) => line.toLowerCase().includes(inst.toLowerCase()));

    if (hasDegree || hasInst) {
      extractedEducation.push({
        school: hasInst ? line.slice(0, 80) : "Institution Mentioned",
        degree: hasDegree ? line.slice(0, 80) : "Diploma",
        confidence: hasDegree && hasInst ? 0.85 : 0.65,
      });
      if (extractedEducation.length >= 3) break;
    }
  }

  // 4. Extract Languages
  const languages: string[] = [];
  if (lowerText.includes("anglais") || lowerText.includes("english")) languages.push("English");
  if (lowerText.includes("français") || lowerText.includes("francais") || lowerText.includes("french")) languages.push("French");
  if (lowerText.includes("arabe") || lowerText.includes("arabic")) languages.push("Arabic");
  if (lowerText.includes("espagnol") || lowerText.includes("spanish")) languages.push("Spanish");

  // 5. Calculate Overall Confidence
  let confidencePoints = 0;
  if (emailMatch) confidencePoints += 0.2;
  if (extractedSkills.length >= 3) confidencePoints += 0.3;
  if (extractedEducation.length >= 1) confidencePoints += 0.3;
  if (languages.length >= 1) confidencePoints += 0.2;

  return {
    rawText: rawText.slice(0, 10000),
    pageCount,
    contact: {
      email: emailMatch ? emailMatch[0] : undefined,
      phone: phoneMatch ? phoneMatch[0] : undefined,
    },
    skills: extractedSkills,
    education: extractedEducation,
    languages,
    overallConfidence: parseFloat(confidencePoints.toFixed(2)),
  };
}
