import { CanonicalResume } from '../ingestion/types.js';
import { ScoreDeltaResult, RevisionHistoryItem } from './types.js';
import { parseStructuredResume } from '../../services/parser/sectionParser.js';
import { analyzeContactInfo } from '../analyzers/contactAnalyzer.js';
import { analyzeDocumentSections } from '../analyzers/sectionAnalyzer.js';
import { analyzeDocumentFormatting } from '../analyzers/formattingAnalyzer.js';
import { analyzeAtsReadability } from '../analyzers/atsReadabilityAnalyzer.js';
import { analyzeKeywords } from '../analyzers/keywordAnalyzer.js';
import { analyzeExperienceEntries } from '../analyzers/experienceAnalyzer.js';
import { analyzeProjects } from '../analyzers/projectAnalyzer.js';
import { analyzeEducation } from '../analyzers/educationAnalyzer.js';
import { analyzeAchievements } from '../analyzers/achievementAnalyzer.js';
import { calculateComprehensiveAtsScores } from '../scoring/scoreEngine.js';

/**
 * Reconstructs raw text from a CanonicalResume representation.
 */
export function reconstructRawTextFromResume(resume: CanonicalResume): string {
  const parts: string[] = [];

  // Contact
  if (resume.contact.name) parts.push(resume.contact.name);
  const contactLine = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedin,
    resume.contact.github,
    resume.contact.portfolio,
  ]
    .filter(Boolean)
    .join(' | ');
  if (contactLine) parts.push(contactLine);

  // Summary
  if (resume.summary) {
    parts.push('\nPROFESSIONAL SUMMARY');
    parts.push(resume.summary);
  }

  // Skills
  const allSkills = [
    ...(resume.skills?.technical || []),
    ...(resume.skills?.frameworks || []),
    ...(resume.skills?.databases || []),
    ...(resume.skills?.tools || []),
    ...(resume.skills?.soft || []),
  ];
  if (allSkills.length > 0) {
    parts.push('\nTECHNICAL SKILLS');
    parts.push(allSkills.join(', '));
  }

  // Experience
  if (resume.experience && resume.experience.length > 0) {
    parts.push('\nPROFESSIONAL EXPERIENCE');
    for (const exp of resume.experience) {
      parts.push(`${exp.title || 'Role'} - ${exp.company || 'Company'} (${exp.startDate || ''} - ${exp.endDate || ''})`);
      if (exp.bullets) {
        for (const bullet of exp.bullets) {
          parts.push(`• ${bullet}`);
        }
      }
    }
  }

  // Projects
  if (resume.projects && resume.projects.length > 0) {
    parts.push('\nPROJECTS');
    for (const proj of resume.projects) {
      const tech = Array.isArray(proj.technologies) ? proj.technologies.join(', ') : '';
      parts.push(`${proj.name || 'Project'}${tech ? ' | ' + tech : ''}`);
      if (proj.bullets && Array.isArray(proj.bullets)) {
        for (const bullet of proj.bullets) {
          parts.push(`• ${bullet}`);
        }
      } else if (proj.description) {
        parts.push(`• ${proj.description}`);
      }
    }
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    parts.push('\nEDUCATION');
    for (const edu of resume.education) {
      parts.push(`${edu.degree || 'Degree'} - ${edu.institution || 'University'} (${edu.graduationDate || ''})`);
    }
  }

  // Certifications
  if (resume.certifications && resume.certifications.length > 0) {
    parts.push('\nCERTIFICATIONS');
    for (const cert of resume.certifications) {
      if (typeof cert === 'string') {
        parts.push(`• ${cert}`);
      } else if (cert && cert.name) {
        parts.push(`• ${cert.name} (${cert.issuer || ''})`);
      }
    }
  }

  // Achievements
  if (resume.achievements && resume.achievements.length > 0) {
    parts.push('\nACHIEVEMENTS');
    for (const ach of resume.achievements) {
      if (typeof ach === 'string') {
        parts.push(`• ${ach}`);
      }
    }
  }

  return parts.join('\n');
}

/**
 * Calculates deterministic ATS score for a canonical resume.
 */
function scoreCanonicalResume(resume: CanonicalResume): {
  overall: number;
  categoryScores: Record<string, number>;
} {
  const rawText = reconstructRawTextFromResume(resume);
  const structured = parseStructuredResume(rawText);
  const contactResult = analyzeContactInfo(structured.contact, rawText);
  const sectionResult = analyzeDocumentSections(structured, rawText, 'mid');
  const formattingResult = analyzeDocumentFormatting(rawText);
  const readabilityResult = analyzeAtsReadability(contactResult, sectionResult, formattingResult, rawText);
  const keywordResult = analyzeKeywords(rawText);
  const experienceResult = analyzeExperienceEntries(structured.experience, rawText, 'mid');
  const projectResult = analyzeProjects(structured.projects, rawText, 'mid', structured.experience.length);
  const educationResult = analyzeEducation(structured.education, rawText);
  const achievementResult = analyzeAchievements(rawText, structured.certifications.length, structured.achievements.length);

  const scoringOutput = calculateComprehensiveAtsScores(
    {
      readability: readabilityResult,
      keywords: keywordResult,
      experience: experienceResult,
      projects: projectResult,
      formatting: formattingResult,
      education: educationResult,
      achievements: achievementResult,
      sections: sectionResult,
    },
    'mid'
  );

  return {
    overall: scoringOutput.overall,
    categoryScores: {
      atsReadability: scoringOutput.categoryScores.atsReadability,
      keywordRelevance: scoringOutput.categoryScores.keywordRelevance,
      experience: scoringOutput.categoryScores.experience,
      projects: scoringOutput.categoryScores.projects,
      formatting: scoringOutput.categoryScores.formatting,
      education: scoringOutput.categoryScores.education,
      achievements: scoringOutput.categoryScores.achievements,
    },
  };
}

/**
 * Applies a suggested revision to a CanonicalResume and calculates real-time score delta.
 */
export function applyRevisionToResume(
  currentResume: CanonicalResume,
  issueId: string,
  originalText: string,
  revisionText: string
): ScoreDeltaResult {
  const beforeScoring = scoreCanonicalResume(currentResume);

  // Deep clone resume to mutate
  const updatedResume: CanonicalResume = JSON.parse(JSON.stringify(currentResume));
  let replaced = false;

  // 1. Check summary
  if (updatedResume.summary && updatedResume.summary.includes(originalText)) {
    updatedResume.summary = updatedResume.summary.replace(originalText, revisionText);
    replaced = true;
  }

  // 2. Check experience bullets
  if (!replaced) {
    for (const exp of updatedResume.experience) {
      for (let i = 0; i < exp.bullets.length; i++) {
        if (exp.bullets[i].trim() === originalText.trim() || exp.bullets[i].includes(originalText)) {
          exp.bullets[i] = exp.bullets[i].replace(originalText, revisionText);
          replaced = true;
          break;
        }
      }
      if (replaced) break;
    }
  }

  // 3. Check project bullets
  if (!replaced) {
    for (const proj of updatedResume.projects) {
      for (let i = 0; i < proj.bullets.length; i++) {
        if (proj.bullets[i].trim() === originalText.trim() || proj.bullets[i].includes(originalText)) {
          proj.bullets[i] = proj.bullets[i].replace(originalText, revisionText);
          replaced = true;
          break;
        }
      }
      if (replaced) break;
    }
  }

  // 4. Check skills
  if (!replaced && originalText.toLowerCase().includes('skills:')) {
    const techWords = revisionText.match(/\b[A-Za-z0-9+#.-]+\b/g) || [];
    for (const word of techWords) {
      if (!updatedResume.skills.technical.includes(word) && word.length > 2) {
        updatedResume.skills.technical.push(word);
      }
    }
    replaced = true;
  }

  const afterScoring = scoreCanonicalResume(updatedResume);
  const delta = afterScoring.overall - beforeScoring.overall;

  const categoryDeltas: Record<string, number> = {};
  for (const cat of Object.keys(afterScoring.categoryScores)) {
    categoryDeltas[cat] = afterScoring.categoryScores[cat] - (beforeScoring.categoryScores[cat] || 0);
  }

  return {
    beforeScore: beforeScoring.overall,
    afterScore: afterScoring.overall,
    delta: delta >= 0 ? delta : 0, // Never penalize a valid improvement
    categoryDeltas,
    updatedResume,
    resolvedIssueId: issueId,
  };
}
