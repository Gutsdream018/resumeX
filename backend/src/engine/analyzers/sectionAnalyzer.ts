import { StructuredResume } from '../../models/resume.types.js';
import { safeClamp } from '../scoring/scoreNormalizer.js';
import { CareerLevel } from '../schemas/analysisSchema.js';

export interface SectionAnalysisResult {
  detectedSections: {
    summary: boolean;
    education: boolean;
    experience: boolean;
    projects: boolean;
    skills: boolean;
    certifications: boolean;
    achievements: boolean;
  };
  missingSections: string[];
  presentSections: string[];
  score: number;
  signals: string[];
  deductions: string[];
}

export function analyzeDocumentSections(
  resume: StructuredResume,
  fullText: string,
  careerLevel?: CareerLevel
): SectionAnalysisResult {
  const signals: string[] = [];
  const deductions: string[] = [];

  const hasExplicitSummaryHeader = /(?:^|\n)\s*(?:professional\s+summary|summary|profile|about\s+me|career\s+objective|objective|executive\s+summary)\b/i.test(fullText);

  const detectedSections = {
    summary: hasExplicitSummaryHeader || (Boolean(resume.summary) && resume.summary.length > 30),
    education: resume.education.length > 0 || /(?:education|university|college|bachelor|master|phd|diploma)\b/i.test(fullText),
    experience: resume.experience.length > 0 || /(?:professional\s+experience|work\s+experience|experience|employment\s+history)\b/i.test(fullText),
    projects: resume.projects.length > 0 || /(?:technical\s+projects|projects|selected\s+work|portfolio)\b/i.test(fullText),
    skills: (resume.skills.technical.length + resume.skills.tools.length + resume.skills.languages.length > 0) || /(?:technical\s+skills|skills|technologies|proficiencies|core\s+competencies)\b/i.test(fullText),
    certifications: resume.certifications.length > 0 || /(?:certifications|licenses|credentials|certified)\b/i.test(fullText),
    achievements: resume.achievements.length > 0 || /(?:achievements|awards|honors|publications|patents)\b/i.test(fullText),
  };

  const presentSections: string[] = [];
  const missingSections: string[] = [];

  for (const [sec, isPresent] of Object.entries(detectedSections)) {
    if (isPresent) presentSections.push(sec.charAt(0).toUpperCase() + sec.slice(1));
    else missingSections.push(sec.charAt(0).toUpperCase() + sec.slice(1));
  }

  // Base Section Scoring
  let score = 30;

  if (detectedSections.experience) {
    score += 25;
    signals.push('Recognized Professional Experience section with clear role entries.');
  } else if (careerLevel !== 'student') {
    deductions.push('Missing "Professional Experience" section. Standard ATS configurations look for an explicit work history block.');
  } else {
    // Contextual handling: For students, substitute project section weighting
    if (detectedSections.projects) {
      score += 20;
      signals.push('Projects section actively substitutes for early-career work experience.');
    }
  }

  if (detectedSections.skills) {
    score += 20;
    signals.push('Dedicated Technical Skills section enables fast algorithmic indexing.');
  } else {
    deductions.push('Missing dedicated "Skills" section. ATS parsers rely on this block for keyword density calculations.');
  }

  if (detectedSections.education) {
    score += 15;
    signals.push('Education history detected with academic credentials.');
  } else {
    deductions.push('Missing "Education" section (degree, university, or certificate).');
  }

  if (detectedSections.summary) {
    score += 10;
    signals.push('Executive Summary provides clear 2-3 sentence context at the top of the resume.');
  }

  if (detectedSections.projects) {
    score += 10;
    signals.push('Technical Projects section highlights hands-on initiatives and applied tools.');
  }

  if (detectedSections.certifications) {
    score += 5;
    signals.push('Certifications section substantiates formal technical proficiencies.');
  }

  return {
    detectedSections,
    missingSections,
    presentSections,
    score: safeClamp(score, 10, 100),
    signals,
    deductions,
  };
}
