import { AtsEvaluationResult } from '../ats/atsEngine.js';
import { CategoryScores } from '../../models/resume.types.js';
import { clamp } from '../../utils/textUtils.js';

export interface FinalScores {
  overall: number;
  scoreGrade: string;
  step5Scores: {
    overall: number;
    ats: number;
    keywords: number;
    experience: number;
    projects: number;
    formatting: number;
    education: number;
    achievements: number;
  };
  frontendCategoryScores: CategoryScores;
}

export function compileFinalScores(
  atsResult: AtsEvaluationResult,
  extra?: { contentScore?: number; grammarScore?: number; professionalismScore?: number }
): FinalScores {
  const cats = atsResult.categories;
  const overall = atsResult.overall;

  // Compile the 8-category object required by the existing frontend dashboard
  const frontendCategoryScores: CategoryScores = {
    ats: cats.atsCompatibility,
    content: clamp(extra?.contentScore ?? (cats.experience * 0.5 + cats.achievements * 0.5)),
    skills: cats.keywordRelevance,
    experience: cats.experience,
    impact: cats.achievements,
    formatting: cats.formatting,
    grammar: clamp(extra?.grammarScore ?? 88),
    professionalism: clamp(extra?.professionalismScore ?? (cats.atsCompatibility * 0.6 + cats.education * 0.4)),
  };

  const step5Scores = {
    overall,
    ats: cats.atsCompatibility,
    keywords: cats.keywordRelevance,
    experience: cats.experience,
    projects: cats.projects,
    formatting: cats.formatting,
    education: cats.education,
    achievements: cats.achievements,
  };

  const scoreGrade = getScoreGrade(overall);

  return {
    overall,
    scoreGrade,
    step5Scores,
    frontendCategoryScores,
  };
}

export function getScoreGrade(score: number): string {
  if (score >= 90) return 'Exceptional';
  if (score >= 80) return 'Strong / Interview Ready';
  if (score >= 70) return 'Good / Minor Refinements Needed';
  if (score >= 55) return 'Needs Moderate Improvement';
  return 'Requires Critical Rework';
}
