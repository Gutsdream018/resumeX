import { IssueSeverity, DiagnosticCategory } from './types.js';

const SEVERITY_WEIGHTS: Record<IssueSeverity, number> = {
  critical: 1.6,
  high: 1.25,
  medium: 0.9,
  low: 0.5,
};

/**
 * Computes an objective priority score determining which verified changes
 * are most useful for the candidate to address first.
 */
export function calculatePriorityScore(params: {
  severity: IssueSeverity;
  categoryScore: number; // 0 - 100
  confidence: number; // 0.0 - 1.0
  evidenceCount: number;
}): number {
  const { severity, categoryScore, confidence, evidenceCount } = params;

  const sevWeight = SEVERITY_WEIGHTS[severity] || 1.0;
  // The larger the score deficit in this category, the more impactful the fix
  const categoryDeficitMultiplier = Math.max(0.2, (100 - categoryScore) / 100);
  const conf = Math.max(0.5, Math.min(1.0, confidence));
  const evidenceBonus = 1.0 + Math.min(0.3, evidenceCount * 0.08);

  const rawScore = sevWeight * categoryDeficitMultiplier * conf * evidenceBonus * 100;
  return Math.round(rawScore * 10) / 10;
}
