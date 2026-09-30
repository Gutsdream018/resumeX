import { describe, it, expect } from 'vitest';
import {
  SCORE_CATEGORIES_CONFIG,
  resolveCategoryScores,
  getWeakestCategory,
  computePotentialScore,
  calculateRingGeometry,
  getScoreBand,
} from '../scoreCategories';

describe('Score Categories & Ring Math Test Suite', () => {
  it('1. Category Weights sum to exactly 100%', () => {
    const totalWeight = SCORE_CATEGORIES_CONFIG.reduce((sum, cat) => sum + cat.weight, 0);
    expect(totalWeight).toBe(100);
    expect(SCORE_CATEGORIES_CONFIG.length).toBe(6);
  });

  it('2. Ring Geometry and Dash-offset Math', () => {
    // 100% score should have strokeDashoffset === 0
    const ring100 = calculateRingGeometry(100, 0, 6, 72, 12);
    expect(ring100.radius).toBe(72);
    expect(ring100.circumference).toBeCloseTo(2 * Math.PI * 72, 4);
    expect(ring100.strokeDashoffset).toBeCloseTo(0, 4);

    // 0% score should have strokeDashoffset === circumference
    const ring0 = calculateRingGeometry(0, 0, 6, 72, 12);
    expect(ring0.strokeDashoffset).toBeCloseTo(ring0.circumference, 4);

    // 50% score should have strokeDashoffset === circumference / 2
    const ring50 = calculateRingGeometry(50, 1, 6, 72, 12);
    expect(ring50.radius).toBe(84);
    expect(ring50.strokeDashoffset).toBeCloseTo(ring50.circumference * 0.5, 4);

    // Clamping: 120% clamps to 100%
    const ringOverflow = calculateRingGeometry(120, 0, 6, 72, 12);
    expect(ringOverflow.strokeDashoffset).toBeCloseTo(0, 4);

    // Clamping: -10% clamps to 0%
    const ringUnderflow = calculateRingGeometry(-10, 0, 6, 72, 12);
    expect(ringUnderflow.strokeDashoffset).toBeCloseTo(ringUnderflow.circumference, 4);
  });

  it('3. Deterministic Category Score Derivation', () => {
    const mockAnalysis: any = {
      overall_score: 75,
      category_scores: {
        ats: 85,
        content: 70,
        experience: 65,
        skills: 80,
        impact: 50,
      },
      score: {
        education: 90,
      },
    };

    const resolved = resolveCategoryScores(mockAnalysis);
    expect(resolved.length).toBe(6);

    const ats = resolved.find((c) => c.id === 'ats');
    expect(ats?.score).toBe(85);
    expect(ats?.status).toBe('strong');

    const impact = resolved.find((c) => c.id === 'impact');
    expect(impact?.score).toBe(50);
    expect(impact?.status).toBe('needs_work');

    const weakest = getWeakestCategory(resolved);
    expect(weakest.id).toBe('impact');
    expect(weakest.score).toBe(50);
  });

  it('4. Realistic Deterministic Potential Score Calculation', () => {
    const mockAnalysis: any = {
      overall_score: 70,
      diagnostic: {
        priorityIssues: [
          { severity: 'critical', title: 'Missing Quantifiable Metrics', scoreImpact: { estimatedDeficit: 6 } },
          { severity: 'high', title: 'Passive Power Verbs', scoreImpact: { estimatedDeficit: 4 } },
          { severity: 'medium', title: 'Skills Section Formatting', scoreImpact: { estimatedDeficit: 2 } },
        ],
      },
    };

    const potential = computePotentialScore(70, mockAnalysis);
    expect(potential.potentialScore).toBe(82); // 70 + 6 + 4 + 2
    expect(potential.potentialGain).toBe(12);
    expect(potential.fixCount).toBe(3);
    expect(potential.topFix).toBe('Missing Quantifiable Metrics');

    // Clamped ceiling: should never exceed 98
    const maxedPotential = computePotentialScore(95, mockAnalysis);
    expect(maxedPotential.potentialScore).toBeLessThanOrEqual(98);
  });

  it('5. Score Bands Mapping', () => {
    expect(getScoreBand(85).id).toBe('strong');
    expect(getScoreBand(80).id).toBe('strong');
    expect(getScoreBand(79).id).toBe('good');
    expect(getScoreBand(65).id).toBe('good');
    expect(getScoreBand(64).id).toBe('needs_work');
    expect(getScoreBand(40).id).toBe('needs_work');
  });
});
