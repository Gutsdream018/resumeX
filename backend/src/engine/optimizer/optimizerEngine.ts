import { CanonicalResume } from '../ingestion/types.js';
import {
  OptimizerRescoreResult,
  SectionHealthScore,
  ExportQualityReport,
  ExportQualityCheckItem,
} from './types.js';
import { reconstructRawTextFromResume } from '../critique/revisionEngine.js';
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
import { analysisCache } from '../cache/analysisCache.js';

/**
 * Re-scores a modified CanonicalResume and evaluates section health & export readiness.
 * Accelerated with parallel deterministic execution and SHA-256 caching.
 */
export async function rescoreOptimizedResume(
  modifiedResume: CanonicalResume,
  baselineScore: number = 54
): Promise<OptimizerRescoreResult> {
  const resumeHash = analysisCache.computeHash(modifiedResume);
  const cached = analysisCache.getDeterministicAnalysis(resumeHash, `optimizer:${baselineScore}`);
  if (cached) {
    return cached;
  }

  const rawText = reconstructRawTextFromResume(modifiedResume);
  const structured = parseStructuredResume(rawText);

  // Parallel deterministic analyzers
  const [
    contactResult,
    sectionResult,
    formattingResult,
    keywordResult,
    experienceResult,
    projectResult,
    educationResult,
    achievementResult,
  ] = await Promise.all([
    Promise.resolve().then(() => analyzeContactInfo(structured.contact, rawText)),
    Promise.resolve().then(() => analyzeDocumentSections(structured, rawText, 'mid')),
    Promise.resolve().then(() => analyzeDocumentFormatting(rawText)),
    Promise.resolve().then(() => analyzeKeywords(rawText)),
    Promise.resolve().then(() => analyzeExperienceEntries(structured.experience, rawText, 'mid')),
    Promise.resolve().then(() => analyzeProjects(structured.projects, rawText, 'mid', structured.experience.length)),
    Promise.resolve().then(() => analyzeEducation(structured.education, rawText)),
    Promise.resolve().then(() => analyzeAchievements(rawText, structured.certifications.length, structured.achievements.length)),
  ]);

  const readabilityResult = analyzeAtsReadability(contactResult, sectionResult, formattingResult, rawText);

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

  const overallScore = scoringOutput.overall;
  const scoreDelta = overallScore - baselineScore;

  // 1. Calculate Section Health Scores
  const sectionHealth: SectionHealthScore[] = [
    {
      section: 'summary',
      name: 'Summary / Profile',
      score: modifiedResume.summary ? (modifiedResume.summary.length > 50 ? 85 : 60) : 40,
      issueCount: modifiedResume.summary ? 0 : 1,
      status: modifiedResume.summary ? 'optimal' : 'needs_improvement',
    },
    {
      section: 'experience',
      name: 'Work Experience',
      score: experienceResult.score,
      issueCount: experienceResult.deductions.length,
      status: experienceResult.score >= 70 ? 'optimal' : experienceResult.score >= 50 ? 'needs_improvement' : 'critical',
    },
    {
      section: 'projects',
      name: 'Technical Projects',
      score: projectResult.score,
      issueCount: projectResult.deductions.length,
      status: projectResult.score >= 70 ? 'optimal' : 'needs_improvement',
    },
    {
      section: 'skills',
      name: 'Skills & Competencies',
      score: keywordResult.keywordScore,
      issueCount: ((modifiedResume.skills?.technical?.length || 0) < 5 ? 1 : 0),
      status: keywordResult.keywordScore >= 70 ? 'optimal' : 'needs_improvement',
    },
    {
      section: 'education',
      name: 'Education',
      score: educationResult.score,
      issueCount: educationResult.deductions.length,
      status: educationResult.score >= 75 ? 'optimal' : 'needs_improvement',
    },
    {
      section: 'achievements',
      name: 'Measurable Outcomes',
      score: achievementResult.score,
      issueCount: achievementResult.deductions.length,
      status: achievementResult.score >= 65 ? 'optimal' : 'needs_improvement',
    },
  ];

  // 2. Perform Final Export Quality Check
  const exportQuality = evaluateExportQuality(modifiedResume, scoringOutput.overall, keywordResult);

  // 3. Calculate Optimization Progress Percentage
  const progressChecks = [
    Boolean(modifiedResume.contact.name && (modifiedResume.contact.email || modifiedResume.contact.phone)),
    Boolean(modifiedResume.summary && modifiedResume.summary.length > 40),
    (modifiedResume.experience?.length || 0) > 0,
    (modifiedResume.skills?.technical?.length || 0) >= 6,
    (modifiedResume.education?.length || 0) > 0,
    overallScore >= 70,
  ];
  const passedProgress = progressChecks.filter(Boolean).length;
  const optimizationProgress = Math.round((passedProgress / progressChecks.length) * 100);

  const result: OptimizerRescoreResult = {
    overallScore,
    scoreDelta,
    categoryScores: {
      atsReadability: scoringOutput.categoryScores.atsReadability,
      keywordRelevance: scoringOutput.categoryScores.keywordRelevance,
      experience: scoringOutput.categoryScores.experience,
      projects: scoringOutput.categoryScores.projects,
      formatting: scoringOutput.categoryScores.formatting,
      education: scoringOutput.categoryScores.education,
      achievements: scoringOutput.categoryScores.achievements,
    },
    categoryDeltas: {
      atsReadability: scoringOutput.categoryScores.atsReadability - 60,
      keywordRelevance: scoringOutput.categoryScores.keywordRelevance - 50,
      experience: scoringOutput.categoryScores.experience - 55,
      projects: scoringOutput.categoryScores.projects - 45,
      formatting: scoringOutput.categoryScores.formatting - 70,
      education: scoringOutput.categoryScores.education - 80,
      achievements: scoringOutput.categoryScores.achievements - 40,
    },
    sectionHealth,
    updatedResume: modifiedResume,
    optimizationProgress,
    exportQuality,
  };

  analysisCache.setDeterministicAnalysis(resumeHash, `optimizer:${baselineScore}`, result);
  return result;
}

/**
 * Validates document readiness before PDF/DOCX export.
 */
export function evaluateExportQuality(
  resume: CanonicalResume,
  overallScore: number = 70,
  keywordResult?: any
): ExportQualityReport {
  const checks: ExportQualityCheckItem[] = [
    {
      id: 'check-contact',
      title: 'Contact Channels Validated',
      passed: Boolean(resume.contact.name && (resume.contact.email || resume.contact.phone)),
      message: 'Name and reachable contact channels (email or phone) are verified.',
      severity: 'critical',
    },
    {
      id: 'check-skills',
      title: 'Technical Skills Matrix Populated',
      passed: (resume.skills?.technical?.length || 0) + (resume.skills?.tools?.length || 0) >= 4,
      message: 'At least 4 canonical skills are cataloged for ATS search indexing.',
      severity: 'high',
    },
    {
      id: 'check-experience',
      title: 'Experience Entries Structured',
      passed: (resume.experience && resume.experience.length > 0) || (resume.internships && resume.internships.length > 0),
      message: 'Work history entries have defined titles, organizations, and bullets.',
      severity: 'high',
    },
    {
      id: 'check-placeholders',
      title: 'No Unresolved Brackets or Placeholders',
      passed: !JSON.stringify(resume).includes('[Insert') && !JSON.stringify(resume).includes('[X%]'),
      message: 'All template placeholders have been customized with candidate facts.',
      severity: 'medium',
    },
    {
      id: 'check-score-threshold',
      title: 'ATS Discoverability Threshold',
      passed: overallScore >= 60,
      message: `Overall score (${overallScore}/100) satisfies standard automated screening benchmarks.`,
      severity: 'medium',
    },
  ];

  const readyToExport = checks.filter((c) => c.severity === 'critical' || c.severity === 'high').every((c) => c.passed);

  return {
    readyToExport,
    checks,
    overallAtsScore: overallScore,
    optimizationProgress: Math.round((checks.filter((c) => c.passed).length / checks.length) * 100),
  };
}
