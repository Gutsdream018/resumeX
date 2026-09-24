import { AtsCategoryScores } from '../models/resume.types.js';

export interface ScoringWeights {
  atsCompatibility: number;
  keywordRelevance: number;
  experience: number;
  projects: number;
  formatting: number;
  education: number;
  achievements: number;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  atsCompatibility: 0.20, // 20%
  keywordRelevance: 0.20, // 20%
  experience: 0.20,       // 20%
  projects: 0.15,         // 15%
  formatting: 0.10,       // 10%
  education: 0.05,        // 5%
  achievements: 0.10,     // 10%
};

export class ScoringConfig {
  private weights: ScoringWeights;

  constructor(customWeights?: Partial<ScoringWeights>) {
    this.weights = {
      ...DEFAULT_SCORING_WEIGHTS,
      ...customWeights,
    };
    this.validateWeights();
  }

  public getWeights(): ScoringWeights {
    return { ...this.weights };
  }

  public setWeights(newWeights: Partial<ScoringWeights>): void {
    this.weights = {
      ...this.weights,
      ...newWeights,
    };
    this.validateWeights();
  }

  private validateWeights(): void {
    const total = Object.values(this.weights).reduce((sum, w) => sum + w, 0);
    // Allow slight float tolerance
    if (Math.abs(total - 1.0) > 0.01) {
      console.warn(`[ScoringConfig] Weights sum to ${total}, expected 1.0. Normalizing weights.`);
      const factor = 1.0 / total;
      for (const key of Object.keys(this.weights) as (keyof ScoringWeights)[]) {
        this.weights[key] = parseFloat((this.weights[key] * factor).toFixed(4));
      }
    }
  }
}

export const defaultScoringConfig = new ScoringConfig();
