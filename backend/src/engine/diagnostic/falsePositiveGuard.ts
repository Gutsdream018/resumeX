import { CanonicalResume } from '../ingestion/types.js';

export interface FalsePositiveCheckResult {
  hasIssue: boolean;
  refinedTitle?: string;
  refinedReason?: string;
  refinedRecommendation?: string;
  evidence: string[];
}

/**
 * Ensures claims regarding missing experience accurately differentiate between
 * full-time employment and internships.
 */
export function checkExperienceFalsePositives(
  resume: CanonicalResume,
  rawText: string
): FalsePositiveCheckResult {
  const hasExp = resume.experience && resume.experience.length > 0;
  const hasInternships = resume.internships && resume.internships.length > 0;
  const textHasInternship = /(?:intern|internship|trainee|industrial\s+training)\b/i.test(rawText);

  if (!hasExp && (hasInternships || textHasInternship)) {
    return {
      hasIssue: true,
      refinedTitle: 'Internship Experience Detected Separately',
      refinedReason:
        'Internship entries were recognized in the document, but are not structured under a standard "Work Experience" or "Experience" heading.',
      refinedRecommendation:
        'Consolidate internship roles under an "Experience" or "Internship Experience" section to ensure standard ATS chronology indexing.',
      evidence: hasInternships
        ? resume.internships.map((i) => `${i.title || 'Intern'} at ${i.company || 'Company'}`)
        : ['Internship keywords detected in document text'],
    };
  }

  return {
    hasIssue: !hasExp,
    refinedTitle: 'Professional Experience Section Not Detected',
    refinedReason:
      'Standard Applicant Tracking Systems look for a designated "Experience" or "Work History" block to calculate total tenure.',
    refinedRecommendation:
      'Include an Experience section outlining your professional roles, responsibilities, and engineering achievements.',
    evidence: [],
  };
}

/**
 * Ensures claims regarding missing skills distinguish between an absent dedicated section
 * and absence of skills entirely.
 */
export function checkSkillsFalsePositives(
  resume: CanonicalResume,
  rawText: string
): FalsePositiveCheckResult {
  const totalSkills =
    (resume.skills?.technical?.length || 0) +
    (resume.skills?.frameworks?.length || 0) +
    (resume.skills?.databases?.length || 0) +
    (resume.skills?.tools?.length || 0);

  const hasExplicitSkillsHeader = /(?:^|\n)\s*(?:technical\s+skills|skills|technologies|core\s+competencies|proficiencies)\b/i.test(rawText);

  // If skills were extracted from text but no explicit header was used
  if (totalSkills > 0 && !hasExplicitSkillsHeader) {
    const detected = [
      ...(resume.skills.technical || []),
      ...(resume.skills.frameworks || []),
      ...(resume.skills.databases || []),
      ...(resume.skills.tools || []),
    ].slice(0, 6);

    return {
      hasIssue: true,
      refinedTitle: 'Technical Skills Scattered Across Document',
      refinedReason:
        'Relevant technical skills were identified across your text, but they are not organized into a dedicated "Skills" section for rapid ATS parsing.',
      refinedRecommendation:
        'Create a dedicated "Technical Skills" section grouped by category (Languages, Frameworks, Databases, Tools).',
      evidence: detected.map((s) => `Detected skill: ${s}`),
    };
  }

  if (totalSkills === 0) {
    return {
      hasIssue: true,
      refinedTitle: 'Low Technical Keyword Density',
      refinedReason:
        'Fewer than 4 standard technical competencies were indexed. ATS search filters heavily weight canonical terminology.',
      refinedRecommendation:
        'Add a dedicated Skills section listing all programming languages, frameworks, cloud services, and tools you utilize.',
      evidence: [],
    };
  }

  return { hasIssue: false, evidence: [] };
}

/**
 * Validates education dates strictly on logical contradictions and plausibility,
 * never penalizing older historical dates.
 */
export function checkEducationDates(resume: CanonicalResume): FalsePositiveCheckResult {
  if (!resume.education || resume.education.length === 0) {
    return {
      hasIssue: true,
      refinedTitle: 'Education Section Not Detected',
      refinedReason: 'An academic history or degree entry was not identified in the document.',
      refinedRecommendation: 'Add an Education section with your degree, institution, and graduation year.',
      evidence: [],
    };
  }

  const currentYear = new Date().getFullYear();
  for (const edu of resume.education) {
    const rawDate = edu.graduationDate || '';
    const matchYear = rawDate.match(/\b(19\d\d|20\d\d)\b/);
    if (matchYear) {
      const year = parseInt(matchYear[1], 10);
      // Only flag if year is impossible in the far future or absurd historical year
      if (year > currentYear + 7) {
        return {
          hasIssue: true,
          refinedTitle: 'Plausibility Check: Expected Graduation Date',
          refinedReason: `Graduation year ${year} is significantly in the future. Verify formatting to prevent ATS chronology errors.`,
          refinedRecommendation: 'Ensure anticipated graduation year matches standard degree completion timelines.',
          evidence: [`Degree: ${edu.degree || 'Degree'} at ${edu.institution || 'Institution'} (${rawDate})`],
        };
      }
    }
  }

  return { hasIssue: false, evidence: [] };
}
