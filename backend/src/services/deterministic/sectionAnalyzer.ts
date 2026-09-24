import { StructuredResume } from '../../models/resume.types.js';

export interface SectionAnalysis {
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
  score: number; // 0 to 100
  issues: string[];
  strengths: string[];
}

export function analyzeSections(resume: StructuredResume, fullText: string): SectionAnalysis {
  const issues: string[] = [];
  const strengths: string[] = [];

  const hasExplicitSummaryHeader = /(?:^|\n)\s*(?:professional\s+summary|summary|profile|about\s+me|career\s+objective|objective|executive\s+summary)\b/i.test(fullText);

  const detectedSections = {
    summary: hasExplicitSummaryHeader,
    education: resume.education.length > 0 || /(education|university|college|degree|bachelor|master)/i.test(fullText),
    experience: resume.experience.length > 0 || /(experience|employment|work history)/i.test(fullText),
    projects: resume.projects.length > 0 || /(projects|portfolio)/i.test(fullText),
    skills: (resume.skills.technical.length + resume.skills.tools.length + resume.skills.languages.length > 0) || /(skills|technologies|proficiencies)/i.test(fullText),
    certifications: resume.certifications.length > 0 || /(certifications|licenses|certificates)/i.test(fullText),
    achievements: resume.achievements.length > 0 || /(achievements|awards|honors)/i.test(fullText),
  };

  const presentSections: string[] = [];
  const missingSections: string[] = [];

  if (detectedSections.experience) presentSections.push('Experience');
  else {
    missingSections.push('Experience');
    issues.push('Missing "Professional Experience" section. This is required by virtually every ATS and hiring manager.');
  }

  if (detectedSections.skills) presentSections.push('Skills');
  else {
    missingSections.push('Skills');
    issues.push('Missing a dedicated "Technical Skills" section, preventing automated keyword indexing.');
  }

  if (detectedSections.education) presentSections.push('Education');
  else {
    missingSections.push('Education');
    issues.push('Missing "Education" section (degree, university, or credential).');
  }

  if (detectedSections.summary) {
    presentSections.push('Summary');
    strengths.push('Includes a Professional Summary providing immediate recruiter orientation.');
  } else {
    missingSections.push('Summary');
    issues.push('No Executive Summary found. A 2-3 sentence overview at the top helps frame your experience.');
  }

  if (detectedSections.projects) {
    presentSections.push('Projects');
    strengths.push('Dedicated Projects section highlights hands-on initiative and applied tools.');
  } else {
    missingSections.push('Projects');
  }

  if (detectedSections.certifications) presentSections.push('Certifications');
  if (detectedSections.achievements) presentSections.push('Achievements');

  // Scoring: Experience (30), Skills (25), Education (20), Summary (15), Projects (10)
  let score = 0;
  if (detectedSections.experience) score += 30;
  if (detectedSections.skills) score += 25;
  if (detectedSections.education) score += 20;
  if (detectedSections.summary) score += 15;
  if (detectedSections.projects) score += 10;
  score -= missingSections.length * 5;

  return {
    detectedSections,
    missingSections,
    presentSections,
    score: Math.max(10, Math.min(100, score)),
    issues,
    strengths,
  };
}
