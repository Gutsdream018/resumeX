// ============================================================================
// Seniority Inference and Level Compatibility Engine
// ============================================================================

export type SeniorityTier = 'entry' | 'mid' | 'senior' | 'lead';

export const SENIORITY_RANK: Record<SeniorityTier, number> = {
  entry: 0,
  mid: 1,
  senior: 2,
  lead: 3,
};

export interface SeniorityEvaluation {
  candidateLevel: SeniorityTier;
  jobLevel: SeniorityTier;
  levelDiff: number; // jobLevel - candidateLevel
  allow: boolean;
  demotePenalty: number;
  reason?: string;
}

/**
 * Normalizes candidate seniority based on explicit level, title, and years of experience.
 */
export function normalizeSeniorityLevel(
  explicitLevel?: string,
  yearsExp: number = 0,
  titles: string[] = []
): SeniorityTier {
  const combined = `${explicitLevel || ''} ${titles.join(' ')}`.toLowerCase();

  // Explicit title / role keyword checks
  if (/\b(lead|staff|principal|director|head of|vp|architect|chief|manager)\b/i.test(combined)) {
    return 'lead';
  }
  if (/\b(senior|sr\.?|iii|level 3|iv)\b/i.test(combined)) {
    return 'senior';
  }
  if (/\b(intern|junior|jr\.?|associate|entry|graduate|trainee|fresher)\b/i.test(combined)) {
    return 'entry';
  }

  // Experience duration heuristics
  if (yearsExp >= 9) return 'lead';
  if (yearsExp >= 4) return 'senior';
  if (yearsExp >= 2) return 'mid';
  return 'entry';
}

/**
 * Infers the seniority required by a job listing from its title and description.
 */
export function inferJobSeniority(title: string, description: string = ''): SeniorityTier {
  const t = title.toLowerCase();
  const d = description.toLowerCase().slice(0, 1500);

  // 1. Lead / Staff / Executive Tier
  if (
    /\b(staff|principal|lead|director|head of|vp|architect|chief|engineering manager)\b/i.test(t) ||
    /\b(10\+|12\+|15\+)\s*(years|yrs)\b/i.test(d)
  ) {
    return 'lead';
  }

  // 2. Senior Tier
  if (
    /\b(senior|sr\.?|level 3|iii|expert|specialist)\b/i.test(t) ||
    /\b(5\+|6\+|7\+|8\+)\s*(years|yrs)\b/i.test(d)
  ) {
    return 'senior';
  }

  // 3. Entry Tier
  if (
    /\b(intern|internship|junior|jr\.?|associate|entry[- ]level|graduate|trainee|fresher)\b/i.test(t) ||
    /\b(0-1|0-2|1-2|fresh graduate)\s*(years|yrs)?\b/i.test(d)
  ) {
    return 'entry';
  }

  // 4. Default Mid Tier
  return 'mid';
}

/**
 * Evaluates candidate vs job seniority compatibility:
 * - Exclude jobs more than one level above candidate (>1 level difference).
 * - Demote jobs exactly one level above candidate (+1 level difference) with a score penalty (-12 points).
 * - Jobs at or below candidate level are accepted with zero penalty.
 */
export function evaluateSeniorityMatch(
  candidateLevel: SeniorityTier,
  jobLevel: SeniorityTier
): SeniorityEvaluation {
  const cRank = SENIORITY_RANK[candidateLevel];
  const jRank = SENIORITY_RANK[jobLevel];
  const levelDiff = jRank - cRank;

  if (levelDiff > 1) {
    return {
      candidateLevel,
      jobLevel,
      levelDiff,
      allow: false,
      demotePenalty: 0,
      reason: `Job requires ${jobLevel.toUpperCase()} level, which is more than one tier above candidate (${candidateLevel.toUpperCase()}).`,
    };
  }

  if (levelDiff === 1) {
    return {
      candidateLevel,
      jobLevel,
      levelDiff,
      allow: true,
      demotePenalty: 12, // 12 points score demotion
      reason: `Job is one tier above candidate (${jobLevel.toUpperCase()} vs ${candidateLevel.toUpperCase()}). Demoting rank.`,
    };
  }

  return {
    candidateLevel,
    jobLevel,
    levelDiff,
    allow: true,
    demotePenalty: 0,
  };
}
