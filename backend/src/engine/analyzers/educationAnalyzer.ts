import { EducationItem } from '../../models/resume.types.js';
import { safeClamp } from '../scoring/scoreNormalizer.js';

export interface EducationAnalysisResult {
  entryCount: number;
  hasDegree: boolean;
  hasInstitution: boolean;
  hasGraduationDate: boolean;
  score: number;
  signals: string[];
  deductions: string[];
}

export function analyzeEducation(education: EducationItem[], fullText: string): EducationAnalysisResult {
  const signals: string[] = [];
  const deductions: string[] = [];

  const entryCount = education.length;
  const hasDegreeRegex = /\b(bachelor|master|phd|b\.s\.|m\.s\.|b\.tech|m\.tech|bba|mba|associate|degree|diploma)\b/i;
  const hasDegree = education.some((e) => hasDegreeRegex.test(e.degree)) || hasDegreeRegex.test(fullText);
  const hasInstitution = education.some((e) => e.institution && e.institution.length > 2 && e.institution !== 'Institution') ||
    /(?:university|college|institute|polytechnic|academy)\b/i.test(fullText);
  const hasGraduationDate = education.some((e) => Boolean(e.graduationDate)) || /(?:19|20)\d{2}\b/.test(fullText);

  let score = 30;

  if (entryCount > 0) {
    score += 30;
    signals.push('Recognized Education section present with academic records.');
  }

  if (hasDegree) {
    score += 25;
    signals.push('Explicit degree level identified (e.g. BS, MS, Bachelor, Master).');
  } else {
    deductions.push('Academic degree title (e.g. Bachelor of Science) was not clearly identified.');
  }

  if (hasInstitution) {
    score += 15;
    signals.push('Accredited college/university or credential-issuing institution specified.');
  } else {
    deductions.push('Institution/university name could not be reliably extracted.');
  }

  return {
    entryCount,
    hasDegree,
    hasInstitution,
    hasGraduationDate,
    score: safeClamp(score, 20, 100),
    signals,
    deductions,
  };
}
