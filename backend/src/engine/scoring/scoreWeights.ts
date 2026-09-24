import { CareerLevel } from '../schemas/analysisSchema.js';

export interface ScoreWeights {
  atsReadability: number;
  keywordRelevance: number;
  experience: number;
  projects: number;
  formatting: number;
  education: number;
  achievements: number;
}

export const BASE_SCORE_WEIGHTS: ScoreWeights = {
  atsReadability: 0.20,
  keywordRelevance: 0.20,
  experience: 0.20,
  projects: 0.15,
  formatting: 0.10,
  education: 0.05,
  achievements: 0.10,
};

export const CAREER_LEVEL_WEIGHTS: Record<CareerLevel, ScoreWeights> = {
  student: {
    atsReadability: 0.20,
    keywordRelevance: 0.20,
    experience: 0.10,
    projects: 0.25,
    formatting: 0.10,
    education: 0.10,
    achievements: 0.05,
  },
  entry: {
    atsReadability: 0.20,
    keywordRelevance: 0.20,
    experience: 0.15,
    projects: 0.20,
    formatting: 0.10,
    education: 0.08,
    achievements: 0.07,
  },
  mid: {
    atsReadability: 0.20,
    keywordRelevance: 0.20,
    experience: 0.20,
    projects: 0.15,
    formatting: 0.10,
    education: 0.05,
    achievements: 0.10,
  },
  senior: {
    atsReadability: 0.15,
    keywordRelevance: 0.20,
    experience: 0.25,
    projects: 0.10,
    formatting: 0.10,
    education: 0.05,
    achievements: 0.15,
  },
  executive: {
    atsReadability: 0.15,
    keywordRelevance: 0.15,
    experience: 0.30,
    projects: 0.05,
    formatting: 0.10,
    education: 0.05,
    achievements: 0.20,
  },
};

/**
 * Validates that weights sum to exactly 1.0 (with 0.001 floating point tolerance).
 */
export function validateWeights(weights: ScoreWeights, name: string = 'Custom'): ScoreWeights {
  const sum = Object.values(weights).reduce((acc, w) => acc + w, 0);
  if (Math.abs(sum - 1.0) > 0.001) {
    console.warn(`[ScoreWeights] ${name} weights sum to ${sum.toFixed(4)}, expected 1.0. Normalizing.`);
    const factor = 1.0 / sum;
    const normalized: any = {};
    for (const [k, v] of Object.entries(weights)) {
      normalized[k] = parseFloat((v * factor).toFixed(4));
    }
    return normalized as ScoreWeights;
  }
  return { ...weights };
}

// Startup Self-Check: Verify all weight profiles sum to 1.0
(function startupWeightValidation() {
  validateWeights(BASE_SCORE_WEIGHTS, 'Base');
  for (const [lvl, w] of Object.entries(CAREER_LEVEL_WEIGHTS)) {
    validateWeights(w, `CareerLevel-${lvl}`);
  }
})();

export function getWeightsForCareerLevel(level?: CareerLevel): ScoreWeights {
  if (level && CAREER_LEVEL_WEIGHTS[level]) {
    return { ...CAREER_LEVEL_WEIGHTS[level] };
  }
  return { ...BASE_SCORE_WEIGHTS };
}
