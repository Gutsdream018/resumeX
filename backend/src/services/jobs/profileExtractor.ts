import { StructuredResume, ExperienceItem } from '../../models/resume.types.js';
import { ResumeProfile, JobPreferences, SeniorityLevel, EducationSummary } from './types.js';

/**
 * Extracts a normalized, structured candidate profile and default preferences
 * from the user's parsed resume.
 */
export function extractResumeProfile(structured: StructuredResume, rawText: string = ''): {
  profile: ResumeProfile;
  defaultPreferences: JobPreferences;
} {
  // 1. Consolidated Skills
  const skillsSet = new Set<string>();
  if (structured.skills) {
    (structured.skills.technical || []).forEach((s) => s && skillsSet.add(s.trim()));
    (structured.skills.tools || []).forEach((s) => s && skillsSet.add(s.trim()));
    (structured.skills.languages || []).forEach((s) => s && skillsSet.add(s.trim()));
    (structured.skills.soft || []).forEach((s) => s && skillsSet.add(s.trim()));
  }

  // 2. Titles from experience (cleaned from company names and dates)
  const titlesList: string[] = [];
  if (Array.isArray(structured.experience)) {
    structured.experience.forEach((exp: ExperienceItem) => {
      const rawTitle = (exp.role || (exp as any).title || '').trim();
      const title = cleanJobTitle(rawTitle);
      if (title && !titlesList.includes(title)) {
        titlesList.push(title);
      }
    });
  }

  // 3. Years of Experience calculation from date ranges
  const yearsExperience = calculateYearsOfExperience(structured.experience || []);

  // 4. Seniority Determination
  const seniority = determineSeniority(titlesList, yearsExperience);

  // 5. Education Summary
  const education = summarizeEducation(structured.education || []);

  // 6. Industries / Domain Detection
  const industries = detectIndustries(titlesList, Array.from(skillsSet), rawText);

  // 7. Location from contact
  const location = (((structured.contact as any)?.location) || '').trim();

  const profile: ResumeProfile = {
    candidateName: structured.contact?.name || undefined,
    skills: Array.from(skillsSet),
    titles: titlesList,
    yearsExperience,
    education,
    industries,
    seniority,
    location: location || undefined,
    rawSummary: structured.summary || undefined,
  };

  // Prefilled Preferences
  const targetRole = titlesList[0] || (skillsSet.has('React') || skillsSet.has('TypeScript') ? 'Frontend Engineer' : 'Software Engineer');
  const adjacentRoles = titlesList.slice(1, 4);

  // Auto-detect country code from location (e.g., India, UK, USA)
  const countryCode = detectCountryCode(location, rawText);

  const defaultPreferences: JobPreferences = {
    targetRole,
    adjacentRoles: adjacentRoles.length > 0 ? adjacentRoles : undefined,
    location: location || 'Remote',
    workplaceType: 'any',
    countryCode,
  };

  return { profile, defaultPreferences };
}

function calculateYearsOfExperience(experience: ExperienceItem[]): number {
  if (!experience || experience.length === 0) return 1;

  const currentYear = new Date().getFullYear();
  let earliestYear = currentYear;
  let latestYear = 2000;
  let hasValidYears = false;

  const yearRegex = /\b(19\d{2}|20\d{2})\b/g;

  experience.forEach((exp) => {
    const dateStr = `${exp.startDate || ''} ${exp.endDate || ''}`;
    const matches = dateStr.match(yearRegex);
    if (matches) {
      matches.forEach((m) => {
        const y = parseInt(m, 10);
        if (y >= 1980 && y <= currentYear + 1) {
          hasValidYears = true;
          if (y < earliestYear) earliestYear = y;
          if (y > latestYear) latestYear = y;
        }
      });
    }
  });

  if (hasValidYears && latestYear >= earliestYear) {
    const diff = latestYear - earliestYear;
    return Math.max(1, diff === 0 ? 1 : diff);
  }

  // Fallback: estimate ~1.5 years per role
  return Math.min(15, Math.max(1, Math.round(experience.length * 1.5)));
}

function determineSeniority(titles: string[], years: number): SeniorityLevel {
  const titleText = titles.join(' ').toLowerCase();

  if (titleText.includes('vp') || titleText.includes('director') || titleText.includes('head of') || titleText.includes('chief')) {
    return 'executive';
  }
  if (titleText.includes('lead') || titleText.includes('principal') || titleText.includes('staff') || titleText.includes('manager')) {
    return 'lead';
  }
  if (titleText.includes('senior') || titleText.includes('sr.') || titleText.includes('sr ') || years >= 5) {
    return 'senior';
  }
  if (titleText.includes('junior') || titleText.includes('jr.') || titleText.includes('intern') || years <= 1) {
    return 'entry';
  }
  return 'mid';
}

function summarizeEducation(educationList: any[]): EducationSummary {
  if (!educationList || educationList.length === 0) {
    return { highestDegree: 'Bachelor of Science' };
  }

  const degreeRank: Record<string, number> = {
    phd: 5,
    doctorate: 5,
    master: 4,
    ms: 4,
    mba: 4,
    bachelor: 3,
    bs: 3,
    ba: 3,
    btech: 3,
    associate: 2,
    diploma: 1,
  };

  let bestRank = 0;
  let bestItem = educationList[0];

  educationList.forEach((edu) => {
    const deg = (edu.degree || '').toLowerCase();
    for (const [key, rank] of Object.entries(degreeRank)) {
      if (deg.includes(key) && rank > bestRank) {
        bestRank = rank;
        bestItem = edu;
      }
    }
  });

  return {
    highestDegree: bestItem.degree || 'Bachelor of Science',
    field: bestItem.field || undefined,
    institution: bestItem.institution || undefined,
  };
}

function detectIndustries(titles: string[], skills: string[], rawText: string): string[] {
  const text = `${titles.join(' ')} ${skills.join(' ')} ${rawText}`.toLowerCase();
  const industries: string[] = [];

  const mappings: Record<string, string[]> = {
    'Technology & Software': ['software', 'react', 'python', 'java', 'frontend', 'backend', 'fullstack', 'api', 'cloud'],
    'Fintech & Financial Services': ['fintech', 'banking', 'payments', 'trading', 'crypto', 'ledger', 'accounting'],
    'Healthcare & Biotech': ['health', 'hospital', 'clinical', 'medical', 'biotech', 'patient'],
    'E-Commerce & Retail': ['ecommerce', 'e-commerce', 'shopify', 'retail', 'cart', 'marketplace'],
    'Artificial Intelligence & ML': ['machine learning', 'deep learning', 'nlp', 'llm', 'pytorch', 'tensorflow', 'data science'],
  };

  for (const [industry, keywords] of Object.entries(mappings)) {
    if (keywords.some((kw) => text.includes(kw))) {
      industries.push(industry);
    }
  }

  return industries.length > 0 ? industries : ['Technology & Software'];
}

function detectCountryCode(location: string, rawText: string): string {
  const combined = `${location} ${rawText}`.toLowerCase();
  if (combined.includes('india') || combined.includes('bangalore') || combined.includes('bengaluru') || combined.includes('mumbai') || combined.includes('delhi') || combined.includes('hyderabad') || combined.includes('pune') || combined.includes('chennai')) {
    return 'in';
  }
  if (combined.includes('united kingdom') || combined.includes('london') || combined.includes('uk') || combined.includes('manchester')) {
    return 'gb';
  }
  if (combined.includes('canada') || combined.includes('toronto') || combined.includes('vancouver')) {
    return 'ca';
  }
  if (combined.includes('germany') || combined.includes('berlin') || combined.includes('munich')) {
    return 'de';
  }
  return 'us';
}

export function cleanJobTitle(raw: string): string {
  if (!raw) return '';
  // Strip trailing company, dates, locations (e.g. ", Mechonyx Automation...", " at Google", " - May 2022...")
  let cleaned = raw.split(/[\n\r,–—|]|\bat\b|\bfrom\b/i)[0].trim();
  // Strip common date patterns if any remained
  cleaned = cleaned.replace(/\b(19|20)\d{2}\b.*$/i, '').trim();
  return cleaned || raw.trim();
}
