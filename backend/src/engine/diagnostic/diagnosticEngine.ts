import { CanonicalResume } from '../ingestion/types.js';
import { ScoreEngineOutput } from '../scoring/scoreEngine.js';
import {
  DiagnosticOutput,
  ScoreContributionItem,
  PriorityIssue,
  ResumeSignals,
  ScoreExplanation,
  RecommendedFixStep,
  DiagnosticCategory,
  IssueSeverity,
} from './types.js';
import { calculatePriorityScore } from './priorityCalculator.js';
import {
  checkExperienceFalsePositives,
  checkSkillsFalsePositives,
  checkEducationDates,
} from './falsePositiveGuard.js';
import { CritiqueEngineOutput } from '../critique/types.js';

interface DiagnosticEngineInput {
  resume: CanonicalResume;
  rawText: string;
  scoringOutput: ScoreEngineOutput;
  critiqueOutput?: CritiqueEngineOutput;
  jobDescriptionProvided?: boolean;
}

const CATEGORY_NAMES: Record<DiagnosticCategory, string> = {
  atsReadability: 'ATS Readability',
  keywordRelevance: 'Keyword Relevance',
  experience: 'Experience Quality',
  projects: 'Project Detail',
  formatting: 'Formatting & Layout',
  education: 'Education Consistency',
  achievements: 'Measurable Outcomes',
};

const CATEGORY_TABS: Record<DiagnosticCategory, 'resume-analysis' | 'keywords' | 'experience' | 'education' | 'skills' | 'sections' | 'ats-score'> = {
  atsReadability: 'sections',
  keywordRelevance: 'keywords',
  experience: 'experience',
  projects: 'resume-analysis',
  formatting: 'sections',
  education: 'education',
  achievements: 'resume-analysis',
};

/**
 * Builds the transparent 7-category score contribution table.
 */
function buildScoreContributions(scoringOutput: ScoreEngineOutput): ScoreContributionItem[] {
  const cats: DiagnosticCategory[] = [
    'atsReadability',
    'keywordRelevance',
    'experience',
    'projects',
    'formatting',
    'education',
    'achievements',
  ];

  const items: ScoreContributionItem[] = [];

  for (const cat of cats) {
    const scoreVal = scoringOutput.categoryScores[cat] ?? 0;
    const weightVal = scoringOutput.weights[cat] ?? 0.1;
    const contribution = Math.round(scoreVal * weightVal * 10) / 10;
    const breakdownItem = scoringOutput.breakdown[cat];

    const reason =
      breakdownItem?.reason ||
      (scoreVal < 60
        ? `${CATEGORY_NAMES[cat]} requires enhancement to meet standard recruiter parsing thresholds.`
        : `${CATEGORY_NAMES[cat]} demonstrates solid alignment with ATS parsing expectations.`);

    items.push({
      category: cat,
      name: CATEGORY_NAMES[cat],
      score: scoreVal,
      weight: weightVal,
      weightPercentage: Math.round(weightVal * 100),
      contribution,
      reason,
      strengths: breakdownItem?.strengths || [],
      deductions: breakdownItem?.deductions || [],
    });
  }

  return items;
}

/**
 * Compiles evidence-based priority issues ranked by genuine score impact and confidence.
 */
function buildPriorityIssues(
  resume: CanonicalResume,
  rawText: string,
  scoringOutput: ScoreEngineOutput,
  critiqueOutput?: CritiqueEngineOutput
): PriorityIssue[] {
  const issues: PriorityIssue[] = [];
  let counter = 1;

  // 1. Guard check: Skills Section & Density
  const skillsGuard = checkSkillsFalsePositives(resume, rawText);
  if (skillsGuard.hasIssue && skillsGuard.refinedTitle) {
    const catScore = scoringOutput.categoryScores.keywordRelevance;
    const severity: IssueSeverity = catScore < 50 ? 'high' : 'medium';
    issues.push({
      id: `ISSUE-${String(counter++).padStart(3, '0')}`,
      title: skillsGuard.refinedTitle,
      severity,
      section: 'skills',
      evidence: skillsGuard.evidence,
      affectedScore: 'keywordRelevance',
      scoreImpact: {
        category: 'keywordRelevance',
        direction: 'negative',
        estimatedDeficit: Math.max(10, 100 - catScore),
      },
      reason: skillsGuard.refinedReason || 'Skills are easier to identify when grouped in a dedicated section.',
      recommendation:
        skillsGuard.refinedRecommendation || 'Create a Technical Skills section with categorized competencies.',
      requiresUserInput: false,
      priorityScore: calculatePriorityScore({
        severity,
        categoryScore: catScore,
        confidence: 0.95,
        evidenceCount: skillsGuard.evidence.length,
      }),
      confidence: 0.95,
      targetTab: 'skills',
    });
  }

  // 2. Guard check: Experience vs Internship
  const expGuard = checkExperienceFalsePositives(resume, rawText);
  if (expGuard.hasIssue && expGuard.refinedTitle) {
    const catScore = scoringOutput.categoryScores.experience;
    const severity: IssueSeverity = catScore < 40 ? 'critical' : 'high';
    issues.push({
      id: `ISSUE-${String(counter++).padStart(3, '0')}`,
      title: expGuard.refinedTitle,
      severity,
      section: 'experience',
      evidence: expGuard.evidence,
      affectedScore: 'experience',
      scoreImpact: {
        category: 'experience',
        direction: 'negative',
        estimatedDeficit: Math.max(15, 100 - catScore),
      },
      reason: expGuard.refinedReason || 'Standard ATS configurations index work history under an explicit heading.',
      recommendation: expGuard.refinedRecommendation || 'Structure professional experience under an Experience heading.',
      requiresUserInput: false,
      priorityScore: calculatePriorityScore({
        severity,
        categoryScore: catScore,
        confidence: 0.92,
        evidenceCount: expGuard.evidence.length,
      }),
      confidence: 0.92,
      targetTab: 'experience',
    });
  }

  // 3. Guard check: Education Plausibility
  const eduGuard = checkEducationDates(resume);
  if (eduGuard.hasIssue && eduGuard.refinedTitle) {
    const catScore = scoringOutput.categoryScores.education;
    const severity: IssueSeverity = catScore < 50 ? 'high' : 'medium';
    issues.push({
      id: `ISSUE-${String(counter++).padStart(3, '0')}`,
      title: eduGuard.refinedTitle,
      severity,
      section: 'education',
      evidence: eduGuard.evidence,
      affectedScore: 'education',
      scoreImpact: {
        category: 'education',
        direction: 'negative',
        estimatedDeficit: 15,
      },
      reason: eduGuard.refinedReason || 'Ensure education milestones are clearly specified.',
      recommendation: eduGuard.refinedRecommendation || 'Include degree, institution, and graduation year.',
      requiresUserInput: false,
      priorityScore: calculatePriorityScore({
        severity,
        categoryScore: catScore,
        confidence: 0.96,
        evidenceCount: eduGuard.evidence.length,
      }),
      confidence: 0.96,
      targetTab: 'education',
    });
  }

  // 4. Merge issues from Critique Engine
  if (critiqueOutput?.issues) {
    for (const cIssue of critiqueOutput.issues) {
      if (issues.length >= 8) break;

      let affectedCategory: DiagnosticCategory = 'experience';
      let targetTab: any = 'resume-analysis';

      if (cIssue.section === 'summary') {
        affectedCategory = 'atsReadability';
        targetTab = 'resume-analysis';
      } else if (cIssue.section === 'skills') {
        affectedCategory = 'keywordRelevance';
        targetTab = 'skills';
      } else if (cIssue.section === 'projects') {
        affectedCategory = 'projects';
        targetTab = 'resume-analysis';
      } else if (cIssue.type === 'LACKS_METRIC_AND_TECH') {
        affectedCategory = 'achievements';
        targetTab = 'resume-analysis';
      }

      const catScore = scoringOutput.categoryScores[affectedCategory] ?? 50;

      issues.push({
        id: cIssue.id,
        title: cIssue.title,
        severity: cIssue.severity,
        sourceText: cIssue.sourceText,
        section: cIssue.section,
        evidence: cIssue.evidence.length > 0 ? cIssue.evidence : [cIssue.sourceText.slice(0, 80)],
        affectedScore: affectedCategory,
        scoreImpact: {
          category: affectedCategory,
          direction: 'negative',
          estimatedDeficit: Math.max(5, Math.round((100 - catScore) * 0.2)),
        },
        reason: cIssue.reason,
        recommendation: cIssue.impact?.description || 'Refine phrasing to demonstrate active technical ownership.',
        requiresUserInput: cIssue.type === 'LACKS_METRIC_AND_TECH',
        priorityScore: calculatePriorityScore({
          severity: cIssue.severity,
          categoryScore: catScore,
          confidence: 0.90,
          evidenceCount: cIssue.evidence.length,
        }),
        confidence: 0.90,
        targetTab,
      });
    }
  }

  // Sort strictly by computed priorityScore in descending order
  issues.sort((a, b) => b.priorityScore - a.priorityScore);

  // Return top 5 most critical, distinct issues
  return issues.slice(0, 5);
}

/**
 * Builds sequential, actionable fix roadmap.
 */
function buildRecommendedFixOrder(priorityIssues: PriorityIssue[]): RecommendedFixStep[] {
  return priorityIssues.map((issue, idx) => ({
    stepNumber: idx + 1,
    title: issue.title,
    description: issue.recommendation,
    targetTab: issue.targetTab,
    category: CATEGORY_NAMES[issue.affectedScore] || issue.affectedScore,
    severity: issue.severity,
  }));
}

/**
 * Extracts distinct resume signals across ATS, Content, and Readability dimensions.
 */
function buildResumeSignals(
  resume: CanonicalResume,
  scoringOutput: ScoreEngineOutput
): ResumeSignals {
  const atsSignals: string[] = [];
  const contentSignals: string[] = [];
  const readabilitySignals: string[] = [];

  // ATS Signals
  if (scoringOutput.categoryScores.atsReadability >= 75) {
    atsSignals.push('Recognized standard section headings across core resume divisions.');
  } else {
    atsSignals.push('Some section headers deviate from standard ATS taxonomy keywords.');
  }

  if (resume.contact.email && resume.contact.phone) {
    atsSignals.push('Direct contact channels (email, phone) parsed successfully.');
  }

  if (scoringOutput.categoryScores.keywordRelevance >= 70) {
    atsSignals.push('Strong density of canonical technical competencies identified.');
  } else {
    atsSignals.push('Technical terminology is dispersed rather than grouped in a Skills matrix.');
  }

  // Content Signals
  if (scoringOutput.categoryScores.experience >= 70) {
    contentSignals.push('Experience entries demonstrate clear role titles and organization context.');
  } else {
    contentSignals.push('Bullet points lean on passive responsibilities rather than active verbs.');
  }

  if (scoringOutput.categoryScores.achievements >= 65) {
    contentSignals.push('Measurable metrics (% improvement, scale, numbers) detected in bullet points.');
  } else {
    contentSignals.push('Limited quantifiable outcomes found; consider pairing deliverables with metrics.');
  }

  // Readability Signals
  if (scoringOutput.categoryScores.formatting >= 75) {
    readabilitySignals.push('Clean layout density with consistent bullet structure.');
  } else {
    readabilitySignals.push('Variable bullet length or whitespace balance detected.');
  }

  readabilitySignals.push('Single-column reading flow ensures deterministic top-to-bottom parsing.');

  return {
    atsSignals,
    contentSignals,
    readabilitySignals,
  };
}

/**
 * Builds evidence-grounded list of positive strengths.
 */
function buildStrengths(
  resume: CanonicalResume,
  scoringOutput: ScoreEngineOutput
): string[] {
  const strengths: string[] = [];

  if (resume.contact.name && (resume.contact.email || resume.contact.phone)) {
    strengths.push(`Contact information for ${resume.contact.name} is structured and verified.`);
  }

  if (resume.education.length > 0) {
    const firstEdu = resume.education[0];
    strengths.push(`Academic credentials clearly documented (${firstEdu.degree || 'Degree'} at ${firstEdu.institution || 'University'}).`);
  }

  if (resume.experience.length > 0) {
    strengths.push(`Chronological employment history indexed with ${resume.experience.length} distinct organization entry/entries.`);
  }

  const totalSkills =
    (resume.skills?.technical?.length || 0) +
    (resume.skills?.tools?.length || 0);

  if (totalSkills >= 4) {
    strengths.push(`Technical proficiency verified across ${totalSkills} industry keywords.`);
  }

  if (scoringOutput.categoryScores.formatting >= 70) {
    strengths.push('Document layout conforms to linear single-column ATS reading standards.');
  }

  return strengths.slice(0, 5);
}

/**
 * Generates transparent score explanation.
 */
function buildScoreExplanation(
  overallScore: number,
  contributions: ScoreContributionItem[],
  strengths: string[]
): ScoreExplanation {
  const weakestCategories = [...contributions]
    .sort((a, b) => a.score - b.score)
    .filter((c) => c.score < 70)
    .slice(0, 3);

  const deductions = weakestCategories.map(
    (c) => `${c.name} (${c.score}/100) — ${c.reason}`
  );

  let calibratedVerdict = 'Needs Optimization';
  if (overallScore >= 80) calibratedVerdict = 'Strong ATS Profile';
  else if (overallScore >= 65) calibratedVerdict = 'Good Foundation';

  const summary =
    overallScore >= 80
      ? 'Your resume demonstrates high ATS readability, clear keyword alignment, and structured experience.'
      : overallScore >= 65
      ? 'Your document provides a solid foundation with clear section headers, but score is reduced by missing metrics or dispersed keywords.'
      : 'Your resume requires structural refinement in keyword consolidation, active phrasing, and quantifiable achievements to optimize ATS discoverability.';

  return {
    score: overallScore,
    summary,
    deductions,
    strengths,
    calibratedVerdict,
  };
}

/**
 * Master execution function for the Diagnostic Intelligence Engine.
 */
export function runDiagnosticEngine(input: DiagnosticEngineInput): DiagnosticOutput {
  const { resume, rawText, scoringOutput, critiqueOutput } = input;

  const contributions = buildScoreContributions(scoringOutput);
  const priorityIssues = buildPriorityIssues(resume, rawText, scoringOutput, critiqueOutput);
  const recommendedFixOrder = buildRecommendedFixOrder(priorityIssues);
  const signals = buildResumeSignals(resume, scoringOutput);
  const strengths = buildStrengths(resume, scoringOutput);
  const scoreExplanation = buildScoreExplanation(scoringOutput.overall, contributions, strengths);

  let calibratedVerdict = 'Needs Optimization';
  if (scoringOutput.overall >= 80) calibratedVerdict = 'Strong ATS Profile';
  else if (scoringOutput.overall >= 65) calibratedVerdict = 'Good Foundation';

  return {
    overallScore: scoringOutput.overall,
    contributions,
    priorityIssues,
    signals,
    strengths,
    scoreExplanation,
    recommendedFixOrder,
    calibratedVerdict,
    confidence: scoringOutput.confidence,
  };
}
