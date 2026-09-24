import { SkillsStructure } from '../../models/resume.types.js';

export interface SkillsAnalysis {
  skills: SkillsStructure;
  totalSkillsCount: number;
  score: number; // 0 to 100
  issues: string[];
  strengths: string[];
  topSkills: string[];
}

const COMMON_TECH_TAXONOMY = {
  languages: [
    'JavaScript', 'TypeScript', 'Python', 'Go', 'Golang', 'Java', 'C++', 'C#',
    'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'SQL', 'HTML', 'CSS', 'R', 'Scala',
    'Bash', 'Shell', 'C', 'Embedded C', 'MATLAB', 'VHDL', 'Verilog', 'Assembly'
  ],
  frameworks: [
    'React', 'Next.js', 'Node.js', 'Express', 'Vue', 'Angular', 'Django', 'FastAPI',
    'Flask', 'Spring Boot', 'ASP.NET', 'Ruby on Rails', 'TailwindCSS', 'GraphQL', 'Redux',
    'FreeRTOS', 'RTOS', 'Signal Integrity', 'Power Electronics', 'PCB Design', 'Embedded Systems'
  ],
  tools: [
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Terraform', 'Git', 'GitHub',
    'GitLab', 'Jenkins', 'Linux', 'Jira', 'PostgreSQL', 'MongoDB', 'Redis', 'Kafka',
    'Elasticsearch', 'CI/CD', 'Webpack', 'Vite', 'Prometheus', 'Grafana',
    'Altium Designer', 'KiCad', 'Cadence', 'Simulink', 'SPICE', 'LTspice', 'Oscilloscope',
    'Logic Analyzer', 'ARM Cortex', 'ARM', 'FPGA', 'CAN Bus', 'SPI', 'I2C', 'UART'
  ],
  soft: [
    'Leadership', 'Mentoring', 'Cross-functional Collaboration', 'Problem Solving',
    'Agile', 'Scrum', 'Communication', 'Project Management', 'Strategic Planning',
    'Compliance', 'Documentation'
  ]
};

export function analyzeSkills(existingSkills: SkillsStructure, fullText: string): SkillsAnalysis {
  const issues: string[] = [];
  const strengths: string[] = [];

  const languages = new Set<string>(existingSkills.languages || []);
  const technical = new Set<string>(existingSkills.technical || []);
  const tools = new Set<string>(existingSkills.tools || []);
  const soft = new Set<string>(existingSkills.soft || []);

  // Scan text for taxonomy keywords
  for (const lang of COMMON_TECH_TAXONOMY.languages) {
    if (new RegExp(`(?:^|\\W)${lang.replace('++', '\\+\\+')}(?:$|\\W)`, 'i').test(fullText)) {
      languages.add(lang);
    }
  }

  for (const fw of COMMON_TECH_TAXONOMY.frameworks) {
    if (new RegExp(`(?:^|\\W)${fw.replace('.', '\\.')}(?:$|\\W)`, 'i').test(fullText)) {
      technical.add(fw);
    }
  }

  for (const tool of COMMON_TECH_TAXONOMY.tools) {
    if (new RegExp(`(?:^|\\W)${tool}(?:$|\\W)`, 'i').test(fullText)) {
      tools.add(tool);
    }
  }

  for (const s of COMMON_TECH_TAXONOMY.soft) {
    if (new RegExp(`(?:^|\\W)${s}(?:$|\\W)`, 'i').test(fullText)) {
      soft.add(s);
    }
  }

  const allLanguages = Array.from(languages);
  const allTechnical = Array.from(technical);
  const allTools = Array.from(tools);
  const allSoft = Array.from(soft);

  const totalSkillsCount = allLanguages.length + allTechnical.length + allTools.length + allSoft.length;
  const topSkills = [...allLanguages, ...allTechnical, ...allTools].slice(0, 10);

  if (totalSkillsCount >= 10) {
    strengths.push(`Extensive technical breadth: identified ${totalSkillsCount} recognized languages, frameworks, and tools.`);
  } else if (totalSkillsCount >= 5) {
    strengths.push(`Solid foundational tech stack with ${totalSkillsCount} detected skills.`);
  } else {
    issues.push('Limited technical keyword density. Add specific technologies, libraries, and platforms you work with.');
  }

  if (allTools.length >= 3) {
    strengths.push(`Demonstrates modern infrastructure and tooling proficiency (${allTools.slice(0, 4).join(', ')}).`);
  }

  // Scoring
  let score = 40;
  score += Math.min(35, totalSkillsCount * 3);
  if (allLanguages.length >= 2) score += 10;
  if (allTools.length >= 2) score += 10;
  if (allSoft.length >= 1) score += 5;

  return {
    skills: {
      languages: allLanguages,
      technical: allTechnical,
      tools: allTools,
      soft: allSoft,
    },
    totalSkillsCount,
    score: Math.max(20, Math.min(100, Math.round(score))),
    issues,
    strengths,
    topSkills,
  };
}
