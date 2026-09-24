import { AtsReadabilityResult } from '../analyzers/atsReadabilityAnalyzer.js';
import { KeywordAnalysisResult } from '../analyzers/keywordAnalyzer.js';
import { ExperienceAnalysisResult } from '../analyzers/experienceAnalyzer.js';
import { ProjectAnalysisResult } from '../analyzers/projectAnalyzer.js';
import { FormattingAnalysisResult } from '../analyzers/formattingAnalyzer.js';
import { EducationAnalysisResult } from '../analyzers/educationAnalyzer.js';
import { AchievementAnalysisResult } from '../analyzers/achievementAnalyzer.js';
import { SectionAnalysisResult } from '../analyzers/sectionAnalyzer.js';
import { MuseSemanticAnalysisResult } from '../ai/museAnalyzer.js';
import { getWeightsForCareerLevel, ScoreWeights } from './scoreWeights.js';
import { safeClamp } from './scoreNormalizer.js';
import {
  CareerLevel,
  DetailedScoreBreakdown,
  DetailedSectionQualities,
} from '../schemas/analysisSchema.js';

export interface ScoreEngineOutput {
  overall: number;
  scoreGrade: string;
  confidence: number;
  categoryScores: {
    atsReadability: number;
    keywordRelevance: number;
    experience: number;
    projects: number;
    formatting: number;
    education: number;
    achievements: number;
  };
  breakdown: DetailedScoreBreakdown;
  sectionQualities: DetailedSectionQualities;
  weights: ScoreWeights;
}

export function calculateComprehensiveAtsScores(
  data: {
    readability: AtsReadabilityResult;
    keywords: KeywordAnalysisResult;
    experience: ExperienceAnalysisResult;
    projects: ProjectAnalysisResult;
    formatting: FormattingAnalysisResult;
    education: EducationAnalysisResult;
    achievements: AchievementAnalysisResult;
    sections: SectionAnalysisResult;
    muse?: MuseSemanticAnalysisResult;
  },
  careerLevel: CareerLevel = 'mid'
): ScoreEngineOutput {
  const {
    readability,
    keywords,
    experience,
    projects,
    formatting,
    education,
    achievements,
    sections,
    muse,
  } = data;

  const weights = getWeightsForCareerLevel(careerLevel);

  // 1. Hybrid Category Score Calculations
  const atsReadabilityScore = readability.score;
  const keywordRelevanceScore = keywords.keywordScore;

  // Experience: 70% deterministic + 30% Muse semantic quality
  const experienceScore = safeClamp(
    muse?.museStatus === 'success'
      ? experience.score * 0.70 + (muse.experienceQuality || experience.score) * 0.30
      : experience.score
  );

  // Projects: 70% deterministic + 30% Muse semantic quality
  const projectsScore = safeClamp(
    muse?.museStatus === 'success'
      ? projects.score * 0.70 + (muse.projectQuality || projects.score) * 0.30
      : projects.score
  );

  // Formatting: 90% deterministic + 10% semantic structure
  const formattingScore = safeClamp(
    muse?.museStatus === 'success'
      ? formatting.score * 0.90 + (muse.summaryQuality || formatting.score) * 0.10
      : formatting.score
  );

  const educationScore = education.score;
  const achievementsScore = achievements.score;

  // 2. Weighted Category Breakdown & Contributions
  const breakdown: DetailedScoreBreakdown = {
    atsReadability: {
      score: atsReadabilityScore,
      weight: weights.atsReadability,
      contribution: parseFloat((atsReadabilityScore * weights.atsReadability).toFixed(1)),
      reason: atsReadabilityScore >= 80
        ? 'Clean single-column structure and verified contact channels ensure seamless ATS parsing.'
        : 'Contact information gaps or multi-column layout hints risk ATS parser rejection.',
      strengths: readability.signals,
      deductions: readability.deductions,
      warnings: readability.warnings,
    },
    keywordRelevance: {
      score: keywordRelevanceScore,
      weight: weights.keywordRelevance,
      contribution: parseFloat((keywordRelevanceScore * weights.keywordRelevance).toFixed(1)),
      reason: keywordRelevanceScore >= 80
        ? `Strong technical keyword density across modern frameworks, languages, and tools.`
        : 'Keyword volume is low. Adding recognized frameworks and infrastructure tools improves search indexing.',
      strengths: keywords.signals,
      deductions: keywords.deductions,
    },
    experience: {
      score: experienceScore,
      weight: weights.experience,
      contribution: parseFloat((experienceScore * weights.experience).toFixed(1)),
      reason: experienceScore >= 80
        ? 'Well-structured role history with decisive leadership action verbs and Google XYZ impact phrasing.'
        : 'Passive duty starters ("responsible for", "worked on") or brief bullet points reduce impact.',
      strengths: experience.signals,
      deductions: experience.deductions,
    },
    projects: {
      score: projectsScore,
      weight: weights.projects,
      contribution: parseFloat((projectsScore * weights.projects).toFixed(1)),
      reason: projectsScore >= 80
        ? 'Technical projects clearly list modern tech stacks and real-world implementations.'
        : 'Adding dedicated technical projects substantiates hands-on engineering capabilities.',
      strengths: projects.signals,
      deductions: projects.deductions,
    },
    formatting: {
      score: formattingScore,
      weight: weights.formatting,
      contribution: parseFloat((formattingScore * weights.formatting).toFixed(1)),
      reason: formattingScore >= 80
        ? 'Ideal length, typography, and bullet consistency matching 1–2 page recruiter expectations.'
        : 'Formatting adjustments (length, non-standard symbols, bullet consistency) needed for optimal scanability.',
      strengths: formatting.signals,
      deductions: formatting.deductions,
      warnings: formatting.warnings,
    },
    education: {
      score: educationScore,
      weight: weights.education,
      contribution: parseFloat((educationScore * weights.education).toFixed(1)),
      reason: educationScore >= 80
        ? 'Degree level and academic institution are explicitly recognized.'
        : 'Ensure degree name and university/credential details are explicitly listed.',
      strengths: education.signals,
      deductions: education.deductions,
    },
    achievements: {
      score: achievementsScore,
      weight: weights.achievements,
      contribution: parseFloat((achievementsScore * weights.achievements).toFixed(1)),
      reason: achievementsScore >= 80
        ? 'High impact density with multiple quantifiable metrics (percentages, scale, or revenue).'
        : 'Incorporate quantifiable metrics (% efficiency, user scale, cost cuts) to substantiate accomplishments.',
      strengths: achievements.signals,
      deductions: achievements.deductions,
    },
  };

  // 3. Overall Weighted Score Calculation
  const overall = safeClamp(
    breakdown.atsReadability.contribution +
    breakdown.keywordRelevance.contribution +
    breakdown.experience.contribution +
    breakdown.projects.contribution +
    breakdown.formatting.contribution +
    breakdown.education.contribution +
    breakdown.achievements.contribution,
    15,
    99
  );

  // 4. Section Qualities
  const sectionQualities: DetailedSectionQualities = {
    summary: {
      score: sections.detectedSections.summary ? 88 : 45,
      strengths: sections.detectedSections.summary ? ['Clear Executive Summary frames background.'] : [],
      issues: sections.detectedSections.summary ? [] : ['Missing Executive Summary.'],
      signals: [],
    },
    experience: {
      score: experienceScore,
      strengths: experience.signals,
      issues: experience.deductions,
      signals: [],
    },
    projects: {
      score: projectsScore,
      strengths: projects.signals,
      issues: projects.deductions,
      signals: [],
    },
    skills: {
      score: keywordRelevanceScore,
      strengths: keywords.signals,
      issues: keywords.deductions,
      signals: keywords.matched.slice(0, 10),
    },
    education: {
      score: educationScore,
      strengths: education.signals,
      issues: education.deductions,
      signals: [],
    },
    certifications: {
      score: sections.detectedSections.certifications ? 90 : 60,
      strengths: sections.detectedSections.certifications ? ['Certifications section substantiates formal expertise.'] : [],
      issues: [],
      signals: [],
    },
    achievements: {
      score: achievementsScore,
      strengths: achievements.signals,
      issues: achievements.deductions,
      signals: [],
    },
  };

  // 5. Internal Confidence Metric (0.0 to 1.0)
  let confidenceFactors = 0.5;
  if (formatting.wordCount >= 200 && formatting.wordCount <= 1200) confidenceFactors += 0.2;
  if (sections.presentSections.length >= 4) confidenceFactors += 0.15;
  if (readability.breakdown.contactCompleteness >= 70) confidenceFactors += 0.1;
  if (muse?.museStatus === 'success') confidenceFactors += 0.05;
  const confidence = parseFloat(Math.min(0.98, Math.max(0.60, confidenceFactors)).toFixed(2));

  return {
    overall,
    scoreGrade: getScoreGrade(overall),
    confidence,
    categoryScores: {
      atsReadability: atsReadabilityScore,
      keywordRelevance: keywordRelevanceScore,
      experience: experienceScore,
      projects: projectsScore,
      formatting: formattingScore,
      education: educationScore,
      achievements: achievementsScore,
    },
    breakdown,
    sectionQualities,
    weights,
  };
}

export function getScoreGrade(score: number): string {
  if (score >= 90) return 'Exceptional';
  if (score >= 80) return 'Strong / Interview Ready';
  if (score >= 70) return 'Good / Minor Refinements Needed';
  if (score >= 55) return 'Needs Moderate Improvement';
  return 'Requires Critical Rework';
}
