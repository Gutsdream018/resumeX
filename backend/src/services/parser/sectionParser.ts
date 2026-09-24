import {
  StructuredResume,
  ContactInfo,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  SkillsStructure,
} from '../../models/resume.types.js';
import { splitLines, cleanBullet, isBulletLine } from '../../utils/textUtils.js';

interface SectionBlock {
  type: string;
  header: string;
  lines: string[];
}

const SECTION_PATTERNS: { type: string; regex: RegExp }[] = [
  { type: 'summary', regex: /^(professional\s+summary|career\s+summary|summary|profile|about\s+me|career\s+objective|objective|executive\s+summary)$/i },
  { type: 'experience', regex: /^(work\s+experience|professional\s+experience|experience|employment\s+history|work\s+history|career\s+history|summer\s+internship\s+program|internships?)$/i },
  { type: 'education', regex: /^(education|educational\s+qualifications?|academic\s+background|academic\s+qualifications?|academics|educational\s+background)$/i },
  { type: 'projects', regex: /^(projects|key\s+projects|personal\s+projects|technical\s+projects|portfolio|seminars\s*(?:&|and)\s*workshops|seminars)$/i },
  { type: 'skills', regex: /^(technical\s+skills|skills\s+&\s+tools|skills|technologies|core\s+competencies|proficiencies|technical\s+expertise)$/i },
  { type: 'certifications', regex: /^(certifications|technical\s+certifications?|licenses\s+&\s+certifications|certificates|professional\s+certifications|workshops?\s*(?:&|and)\s*certifications?)$/i },
  { type: 'achievements', regex: /^(achievements|honors\s*(?:&|and)\s*achievements|achievements\s*(?:&|and)\s*awards|awards\s*(?:&|and)\s*honors|awards|honors|key\s+accomplishments|accomplishments)$/i },
  { type: 'other', regex: /^(publications|languages|volunteer|interests|activities|co-?curricular\s+activities|extra-?curricular\s+activities|patents)$/i },
];

function normalizeInlineHeadings(text: string): string {
  const inlineHeaderRegex =
    /(?:^|\s|\.|\b)(EDUCATIONAL\s+QUALIFICATIONS?|TECHNICAL\s+CERTIFICATIONS?|CO-?CURRICULAR\s+ACTIVITIES|EXTRA-?CURRICULAR\s+ACTIVITIES|SUMMER\s+INTERNSHIP\s+PROGRAM|WORK\s+EXPERIENCE|PROFESSIONAL\s+EXPERIENCE|TECHNICAL\s+SKILLS|CAREER\s+OBJECTIVE|PROFESSIONAL\s+SUMMARY|PROJECTS|CERTIFICATIONS|EDUCATION|SKILLS)\s*[:\-e]?\s*/gi;

  return text.replace(inlineHeaderRegex, (match, header) => `\n\n${header.trim().toUpperCase()}\n`);
}

export function parseStructuredResume(text: string): StructuredResume {
  const normalized = normalizeInlineHeadings(text);
  const lines = splitLines(normalized);

  // 1. Extract Contact Info
  const contact = extractContactInfo(lines, text);

  // 2. Partition into Section Blocks
  const blocks = partitionSections(lines);

  // 3. Parse individual sections
  let summary = '';
  const education: EducationItem[] = [];
  const experience: ExperienceItem[] = [];
  const projects: ProjectItem[] = [];
  const certifications: string[] = [];
  const achievements: string[] = [];
  const other: string[] = [];
  let skillsRawLines: string[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'summary':
        summary = block.lines.join(' ').trim();
        break;
      case 'education':
        education.push(...parseEducationLines(block.lines));
        break;
      case 'experience':
        experience.push(...parseExperienceLines(block.lines));
        break;
      case 'projects':
        projects.push(...parseProjectLines(block.lines));
        break;
      case 'skills':
        skillsRawLines.push(...block.lines);
        break;
      case 'certifications':
        certifications.push(...parseListItems(block.lines));
        break;
      case 'achievements':
        achievements.push(...parseListItems(block.lines));
        break;
      case 'other':
        other.push(...parseListItems(block.lines));
        break;
    }
  }

  // If no summary block found, check if lines between contact and first section look like a summary
  if (!summary && blocks.length > 0 && blocks[0].type !== 'summary') {
    const firstSectionLineIndex = lines.findIndex((l) =>
      SECTION_PATTERNS.some((p) => p.regex.test(l.replace(/[:\-]/g, '').trim()))
    );
    if (firstSectionLineIndex > 2) {
      const candidateSummaryLines = lines.slice(1, firstSectionLineIndex).filter((l) => !containsContactInfo(l));
      if (candidateSummaryLines.length > 0) {
        summary = candidateSummaryLines.join(' ');
      }
    }
  }

  // 4. Categorize skills
  const skills = parseSkills(skillsRawLines, text);

  return {
    contact,
    summary,
    education,
    experience,
    projects,
    skills,
    certifications,
    achievements,
    other,
  };
}

function containsContactInfo(line: string): boolean {
  return /@|linkedin\.com|github\.com|phone|\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/i.test(line);
}

function extractContactInfo(lines: string[], fullText: string): ContactInfo {
  let name = '';
  let email = '';
  let phone = '';
  let linkedin = '';
  let github = '';

  // Email
  const emailMatch = fullText.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) email = emailMatch[0].trim();

  // Phone
  const phoneMatch = fullText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) phone = phoneMatch[0].trim();

  // LinkedIn
  const linkedinMatch = fullText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i);
  if (linkedinMatch) linkedin = linkedinMatch[0].trim();

  // GitHub
  const githubMatch = fullText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/i);
  if (githubMatch) github = githubMatch[0].trim();

  // Name heuristic: usually first line that isn't a generic title, email, phone, or section
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const candidate = lines[i].trim();
    if (
      candidate.length >= 2 &&
      candidate.length <= 40 &&
      !candidate.includes('@') &&
      !candidate.includes('linkedin.com') &&
      !candidate.includes('github.com') &&
      !candidate.includes('http') &&
      !/^(resume|curriculum vitae|cv)$/i.test(candidate) &&
      !SECTION_PATTERNS.some((p) => p.regex.test(candidate))
    ) {
      name = candidate.replace(/[|,].*$/, '').trim();
      break;
    }
  }

  return { name, email, phone, linkedin, github };
}

function partitionSections(lines: string[]): SectionBlock[] {
  const blocks: SectionBlock[] = [];
  let currentBlock: SectionBlock | null = null;

  for (const line of lines) {
    const cleanHeader = line.replace(/[:\-#_]/g, '').trim();
    const matchedPattern = SECTION_PATTERNS.find((p) => p.regex.test(cleanHeader));

    if (matchedPattern) {
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      currentBlock = {
        type: matchedPattern.type,
        header: cleanHeader,
        lines: [],
      };
    } else if (currentBlock) {
      currentBlock.lines.push(line);
    }
  }

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks;
}

function parseExperienceLines(lines: string[]): ExperienceItem[] {
  const items: ExperienceItem[] = [];
  let currentItem: ExperienceItem | null = null;

  for (const line of lines) {
    const isBullet = isBulletLine(line);

    // Header line indicator: contains separator '|' or '–' or date patterns like (2020 - Present)
    const isHeaderLine =
      !isBullet &&
      (/\|/.test(line) ||
        /(?:19|20)\d{2}|present/i.test(line) ||
        /^(senior|lead|staff|software|engineer|developer|manager|intern|associate|analyst|consultant)/i.test(line));

    if (isHeaderLine) {
      if (currentItem) items.push(currentItem);

      // Extract details
      const parts = line.split(/[|•]/).map((p) => p.trim());
      const role = parts[0] || 'Professional Role';
      const company = parts[1] || 'Company';
      const datePart = parts.find((p) => /(?:19|20)\d{2}|present/i.test(p)) || '';
      
      let startDate = '';
      let endDate = datePart;
      if (datePart) {
        const split = datePart.split(/\s*(?:–|-|to)\s*/i);
        if (split.length >= 2) {
          startDate = split[0].trim();
          endDate = split[1].trim();
        }
      }

      currentItem = {
        role,
        company,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        bullets: [],
      };
    } else if (currentItem) {
      const clean = cleanBullet(line);
      if (clean.length > 0) {
        if (isBullet || currentItem.bullets.length === 0) {
          currentItem.bullets.push(clean);
        } else {
          // Wrapped continuation line of the previous bullet point
          const lastIdx = currentItem.bullets.length - 1;
          currentItem.bullets[lastIdx] = `${currentItem.bullets[lastIdx]} ${clean}`;
        }
      }
    } else if (isBullet) {
      // Bullets before any recognized header
      if (!currentItem) {
        currentItem = {
          role: 'Role',
          company: 'Company',
          bullets: [],
        };
      }
      currentItem.bullets.push(cleanBullet(line));
    }
  }

  if (currentItem) items.push(currentItem);
  return items;
}

function parseProjectLines(lines: string[]): ProjectItem[] {
  const items: ProjectItem[] = [];
  let currentItem: ProjectItem | null = null;

  for (const line of lines) {
    const isBullet = isBulletLine(line);

    // Project header indicator
    if (!isBullet && (line.includes('|') || line.includes(':') || line.length < 50)) {
      if (currentItem) items.push(currentItem);

      const parts = line.split(/[|:]/).map((p) => p.trim());
      const name = parts[0] || 'Project';
      const techPart = parts[1] || '';
      const technologies = techPart
        ? techPart.split(/[,/]/).map((t) => t.trim()).filter(Boolean)
        : [];

      currentItem = {
        name,
        technologies,
        bullets: [],
      };
    } else if (currentItem) {
      const clean = cleanBullet(line);
      if (clean.length > 0) {
        if (isBullet || currentItem.bullets.length === 0) {
          currentItem.bullets.push(clean);
        } else {
          // Wrapped continuation line
          const lastIdx = currentItem.bullets.length - 1;
          currentItem.bullets[lastIdx] = `${currentItem.bullets[lastIdx]} ${clean}`;
        }
      }
    }
  }

  if (currentItem) items.push(currentItem);
  return items;
}

function parseEducationLines(lines: string[]): EducationItem[] {
  const items: EducationItem[] = [];
  let currentItem: EducationItem | null = null;

  for (const line of lines) {
    if (isBulletLine(line)) {
      if (currentItem) {
        if (!currentItem.highlights) currentItem.highlights = [];
        currentItem.highlights.push(cleanBullet(line));
      }
      continue;
    }

    const isDegree = /(bachelor|master|ph\.?d|b\.s|m\.s|b\.a|m\.a|associate|degree|diploma)/i.test(line);
    const isUniversity = /(university|college|institute|school|academy)/i.test(line);
    const hasDate = /(?:19|20)\d{2}/.test(line);

    if (isDegree || isUniversity || hasDate) {
      if (currentItem && (isDegree || isUniversity)) {
        items.push(currentItem);
        currentItem = null;
      }

      if (!currentItem) {
        const parts = line.split(/[|•–-]/).map((p) => p.trim());
        const degree = parts.find((p) => /(bachelor|master|ph\.?d|b\.s|m\.s|degree)/i.test(p)) || parts[0] || 'Degree';
        const institution = parts.find((p) => /(university|college|institute|school)/i.test(p)) || parts[1] || 'Institution';
        const dateMatch = line.match(/(?:19|20)\d{2}(?:\s*[-–]\s*(?:(?:19|20)\d{2}|present))?/i);

        currentItem = {
          degree,
          institution,
          graduationDate: dateMatch ? dateMatch[0] : undefined,
          highlights: [],
        };
      } else {
        // Additional info on subsequent line
        if (isDegree && currentItem.degree === 'Degree') currentItem.degree = line;
        if (isUniversity && currentItem.institution === 'Institution') currentItem.institution = line;
      }
    }
  }

  if (currentItem) items.push(currentItem);
  return items;
}

function parseListItems(lines: string[]): string[] {
  return lines.map((l) => cleanBullet(l)).filter((l) => l.length > 0);
}

function parseSkills(lines: string[], fullText: string): SkillsStructure {
  const technical: Set<string> = new Set();
  const soft: Set<string> = new Set();
  const tools: Set<string> = new Set();
  const languages: Set<string> = new Set();

  const skillText = lines.length > 0 ? lines.join('\n') : fullText;

  // Language keywords
  const langTerms = [
    'JavaScript', 'TypeScript', 'Python', 'Go', 'Golang', 'Java', 'C\\+\\+', 'C#',
    'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'SQL', 'HTML', 'CSS', 'R', 'Scala'
  ];
  for (const term of langTerms) {
    if (new RegExp(`(?:^|\\W)${term}(?:$|\\W)`, 'i').test(skillText)) {
      languages.add(term.replace('\\+\\+', '++'));
    }
  }

  // Tools & Platforms
  const toolTerms = [
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Terraform', 'Git', 'GitHub',
    'GitLab', 'Jenkins', 'Linux', 'Jira', 'Figma', 'Webpack', 'Vite', 'Postman', 'Redis', 'Kafka'
  ];
  for (const term of toolTerms) {
    if (new RegExp(`(?:^|\\W)${term}(?:$|\\W)`, 'i').test(skillText)) {
      tools.add(term);
    }
  }

  // Technical Frameworks & Libraries
  const techTerms = [
    'React', 'Next.js', 'Node.js', 'Express', 'Vue', 'Angular', 'PostgreSQL', 'MongoDB',
    'GraphQL', 'REST APIs', 'Microservices', 'TailwindCSS', 'Spring Boot', 'Django', 'FastAPI', 'CI/CD'
  ];
  for (const term of techTerms) {
    if (new RegExp(`(?:^|\\W)${term}(?:$|\\W)`, 'i').test(skillText)) {
      technical.add(term);
    }
  }

  // Soft Skills
  const softTerms = [
    'Leadership', 'Mentoring', 'Cross-functional Collaboration', 'Problem Solving',
    'Agile', 'Scrum', 'Communication', 'Project Management', 'Time Management'
  ];
  for (const term of softTerms) {
    if (new RegExp(`(?:^|\\W)${term}(?:$|\\W)`, 'i').test(skillText)) {
      soft.add(term);
    }
  }

  return {
    technical: Array.from(technical),
    soft: Array.from(soft),
    tools: Array.from(tools),
    languages: Array.from(languages),
  };
}
