import { JobMatchResponse, StructuredResume } from '../../models/resume.types.js';
import { compareResumeToJobKeywords } from '../keywords/keywordEngine.js';
import { parseStructuredResume } from '../parser/sectionParser.js';
import { clamp } from '../../utils/textUtils.js';

export function executeJobMatch(
  resumeText: string,
  jobDescription: string,
  structuredResume?: StructuredResume
): JobMatchResponse {
  const resume = structuredResume || parseStructuredResume(resumeText);
  const keywordResult = compareResumeToJobKeywords(resumeText, jobDescription);

  // 1. Skill Match (0 - 100)
  const skillMatch = keywordResult.matchPercentage;

  // 2. Experience Relevance
  let experienceRelevance = 65;
  const jdRequiresSenior = /senior|staff|lead|principal|architect/i.test(jobDescription);
  const hasSeniorExperience = resume.experience.some((e) => /senior|staff|lead|principal|architect/i.test(e.role));
  if (jdRequiresSenior) {
    if (hasSeniorExperience) experienceRelevance += 25;
    else experienceRelevance -= 15;
  }
  if (resume.experience.length >= 3) experienceRelevance += 10;

  // 3. Keyword Match
  const keywordMatch = keywordResult.matchPercentage;

  // 4. Education Relevance
  let educationRelevance = 75;
  const jdRequiresDegree = /bachelor|master|degree|phd/i.test(jobDescription);
  const hasDegree = resume.education.length > 0;
  if (jdRequiresDegree && hasDegree) educationRelevance = 90;
  else if (jdRequiresDegree && !hasDegree) educationRelevance = 50;

  // Overall Match Score
  const overallMatch = Math.round(
    skillMatch * 0.40 +
    experienceRelevance * 0.25 +
    keywordMatch * 0.25 +
    educationRelevance * 0.10
  );

  // Generate actionable recommendations
  const recommendations: string[] = [];

  if (keywordResult.missing.length > 0) {
    const topMissing = keywordResult.missing.slice(0, 4).join(', ');
    recommendations.push(`Incorporate high-priority missing keywords: ${topMissing}.`);
  }

  if (keywordResult.partialMatches.length > 0) {
    const pm = keywordResult.partialMatches[0];
    recommendations.push(`Standardize technology naming: job posting explicitly mentions "${pm.keyword}" while your resume uses "${pm.matchedWith}".`);
  }

  if (jdRequiresSenior && !hasSeniorExperience) {
    recommendations.push('Emphasize technical leadership, mentoring, and system architectural ownership to better match the seniority requested in this role.');
  }

  if (recommendations.length < 3) {
    recommendations.push('Tailor the metrics in your top experience bullets to match the core business goals outlined in the job description.');
  }

  return {
    matchScore: clamp(overallMatch, 25, 99),
    matchedSkills: keywordResult.matched,
    missingSkills: keywordResult.missing,
    missingKeywords: keywordResult.missing,
    recommendations,
    breakdown: {
      skillMatch: clamp(skillMatch, 20, 100),
      experienceRelevance: clamp(experienceRelevance, 20, 100),
      keywordMatch: clamp(keywordMatch, 20, 100),
      educationRelevance: clamp(educationRelevance, 20, 100),
    },
  };
}
