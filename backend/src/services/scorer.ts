import { CategoryScores } from '../types/index.js';

export const CATEGORY_WEIGHTS: Record<keyof CategoryScores, number> = {
  ats: 0.20,             // 20%
  content: 0.15,         // 15%
  skills: 0.15,          // 15%
  experience: 0.15,      // 15%
  impact: 0.15,          // 15%
  formatting: 0.10,      // 10%
  grammar: 0.05,         // 5%
  professionalism: 0.05, // 5%
};

/**
 * Ensures scores are strictly clamped between 0 and 100
 */
export function clampScore(val: number): number {
  if (isNaN(val)) return 0;
  return Math.min(100, Math.max(0, Math.round(val)));
}

/**
 * Deterministically calculates the weighted overall resume score.
 * Formula:
 * Overall = (ats * 0.20) + (content * 0.15) + (skills * 0.15) + (experience * 0.15) +
 *           (impact * 0.15) + (formatting * 0.10) + (grammar * 0.05) + (professionalism * 0.05)
 */
export function calculateWeightedScore(rawCategoryScores: Partial<CategoryScores>): {
  overall_score: number;
  normalized_categories: CategoryScores;
  score_grade: string;
} {
  const normalized_categories: CategoryScores = {
    ats: clampScore(rawCategoryScores.ats ?? 50),
    content: clampScore(rawCategoryScores.content ?? 50),
    skills: clampScore(rawCategoryScores.skills ?? 50),
    experience: clampScore(rawCategoryScores.experience ?? 50),
    impact: clampScore(rawCategoryScores.impact ?? 50),
    formatting: clampScore(rawCategoryScores.formatting ?? 50),
    grammar: clampScore(rawCategoryScores.grammar ?? 50),
    professionalism: clampScore(rawCategoryScores.professionalism ?? 50),
  };

  let weightedSum = 0;
  for (const [category, weight] of Object.entries(CATEGORY_WEIGHTS) as [keyof CategoryScores, number][]) {
    weightedSum += normalized_categories[category] * weight;
  }

  const overall_score = Math.round(weightedSum);
  const score_grade = getScoreGrade(overall_score);

  return {
    overall_score,
    normalized_categories,
    score_grade,
  };
}

export function getScoreGrade(score: number): string {
  if (score >= 90) return 'Exceptional';
  if (score >= 80) return 'Strong / Interview Ready';
  if (score >= 70) return 'Good / Minor Refinements Needed';
  if (score >= 55) return 'Needs Moderate Improvement';
  return 'Requires Critical Rework';
}
