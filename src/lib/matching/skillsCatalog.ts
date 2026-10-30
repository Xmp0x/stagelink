/**
 * StageLink Canonical Skills & Taxonomy Normalization Catalog
 * 
 * Maps common variations, aliases, and misspellings to normalized canonical skills,
 * and provides Moroccan city normalizers.
 */

// Canonical Skill Dictionary mapping lowercase alias -> Canonical Skill Name
export const CANONICAL_SKILLS_MAP: Record<string, string> = {
  // Web & Frontend
  "react": "React",
  "react.js": "React",
  "reactjs": "React",
  "react native": "React Native",
  "react-native": "React Native",
  "vue": "Vue.js",
  "vue.js": "Vue.js",
  "vuejs": "Vue.js",
  "angular": "Angular",
  "angularjs": "Angular",
  "next.js": "Next.js",
  "nextjs": "Next.js",
  "next": "Next.js",
  "nuxt": "Nuxt.js",
  "nuxtjs": "Nuxt.js",
  "svelte": "Svelte",
  "sveltekit": "SvelteKit",
  "html": "HTML5",
  "html5": "HTML5",
  "css": "CSS3",
  "css3": "CSS3",
  "tailwind": "Tailwind CSS",
  "tailwindcss": "Tailwind CSS",
  "tailwind css": "Tailwind CSS",
  "bootstrap": "Bootstrap",
  "sass": "Sass/SCSS",
  "scss": "Sass/SCSS",
  "javascript": "JavaScript",
  "js": "JavaScript",
  "typescript": "TypeScript",
  "ts": "TypeScript",

  // Backend & Runtime
  "node": "Node.js",
  "node.js": "Node.js",
  "nodejs": "Node.js",
  "express": "Express.js",
  "express.js": "Express.js",
  "expressjs": "Express.js",
  "nest": "NestJS",
  "nestjs": "NestJS",
  "python": "Python",
  "python3": "Python",
  "django": "Django",
  "fastapi": "FastAPI",
  "flask": "Flask",
  "java": "Java",
  "spring": "Spring Boot",
  "spring boot": "Spring Boot",
  "springboot": "Spring Boot",
  "php": "PHP",
  "laravel": "Laravel",
  "symfony": "Symfony",
  "c#": "C#",
  "csharp": "C#",
  ".net": ".NET",
  "dotnet": ".NET",
  "asp.net": "ASP.NET",
  "golang": "Go",
  "go": "Go",
  "rust": "Rust",
  "ruby": "Ruby",
  "rails": "Ruby on Rails",
  "ruby on rails": "Ruby on Rails",

  // Databases & Storage
  "sql": "SQL",
  "mysql": "MySQL",
  "postgres": "PostgreSQL",
  "postgresql": "PostgreSQL",
  "psql": "PostgreSQL",
  "mongodb": "MongoDB",
  "mongo": "MongoDB",
  "redis": "Redis",
  "sqlite": "SQLite",
  "prisma": "Prisma ORM",
  "prisma orm": "Prisma ORM",
  "typeorm": "TypeORM",

  // Cloud & DevOps
  "docker": "Docker",
  "kubernetes": "Kubernetes",
  "k8s": "Kubernetes",
  "aws": "AWS",
  "amazon web services": "AWS",
  "azure": "Microsoft Azure",
  "gcp": "Google Cloud",
  "google cloud": "Google Cloud",
  "git": "Git",
  "github": "GitHub",
  "gitlab": "GitLab",
  "ci/cd": "CI/CD",
  "linux": "Linux",
  "bash": "Bash",

  // UI / UX & Design
  "figma": "UI/UX Design",
  "ui design": "UI/UX Design",
  "ux design": "UI/UX Design",
  "ui/ux": "UI/UX Design",
  "ui/ux design": "UI/UX Design",
  "adobe xd": "Adobe XD",
  "sketch": "Sketch",
  "photoshop": "Adobe Photoshop",
  "illustrator": "Adobe Illustrator",
  "wireframing": "Wireframing & Prototyping",
  "prototyping": "Wireframing & Prototyping",
  "user research": "User Research",

  // Data & AI
  "machine learning": "Machine Learning",
  "ml": "Machine Learning",
  "deep learning": "Deep Learning",
  "nlp": "Natural Language Processing",
  "computer vision": "Computer Vision",
  "pandas": "Pandas",
  "numpy": "NumPy",
  "tensorflow": "TensorFlow",
  "pytorch": "PyTorch",
  "scikit-learn": "Scikit-Learn",
  "data analysis": "Data Analysis",
  "power bi": "Power BI",
  "powerbi": "Power BI",
  "tableau": "Tableau",
  "excel": "Microsoft Excel",

  // Project Management & Soft Skills
  "agile": "Agile / Scrum",
  "scrum": "Agile / Scrum",
  "jira": "Jira",
  "trello": "Trello",
  "communication": "Communication",
  "problem solving": "Problem Solving",
  "teamwork": "Teamwork",
};

/**
 * Normalizes an arbitrary skill string to its canonical representation.
 * Returns capitalized canonical form if known, otherwise trims and title-cases.
 */
export function normalizeSkill(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.trim().toLowerCase();
  if (CANONICAL_SKILLS_MAP[cleaned]) {
    return CANONICAL_SKILLS_MAP[cleaned];
  }

  // Capitalize words as fallback
  return raw
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Moroccan City Normalizer
 * Maps colloquial/spelling variations to standard city names.
 */
export const MOROCCAN_CITIES_MAP: Record<string, string> = {
  "casa": "Casablanca",
  "casablanca": "Casablanca",
  "dar el beida": "Casablanca",
  "bouskoura": "Casablanca",
  "mohammedia": "Casablanca",
  "rabat": "Rabat",
  "rabat-sale": "Rabat",
  "sale": "Rabat",
  "salé": "Rabat",
  "temara": "Rabat",
  "tanger": "Tangier",
  "tangier": "Tangier",
  "tangiers": "Tangier",
  "tanja": "Tangier",
  "marrakech": "Marrakech",
  "marrakesh": "Marrakech",
  "fes": "Fes",
  "fez": "Fes",
  "agadir": "Agadir",
  "oujda": "Oujda",
  "kenitra": "Kenitra",
  "kénitra": "Kenitra",
  "tetouan": "Tetouan",
  "tétouan": "Tetouan",
  "el jadida": "El Jadida",
  "safi": "Safi",
  "nador": "Nador",
  "meknes": "Meknes",
  "meknès": "Meknes",
  "laayoune": "Laayoune",
  "dakhla": "Dakhla",
  "benguerir": "Benguerir",
  "khouribga": "Khouribga",
  "beni mellal": "Beni Mellal",
  "remote": "Remote",
  "remotely": "Remote",
};

/**
 * Normalizes a city name against the Moroccan city catalog.
 */
export function normalizeCity(raw?: string | null): string {
  if (!raw) return "Any";
  const cleaned = raw.trim().toLowerCase();
  if (MOROCCAN_CITIES_MAP[cleaned]) {
    return MOROCCAN_CITIES_MAP[cleaned];
  }
  return raw.trim().charAt(0).toUpperCase() + raw.trim().slice(1).toLowerCase();
}
