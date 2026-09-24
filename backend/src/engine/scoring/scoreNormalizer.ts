/**
 * Clamps numerical values strictly between min and max.
 * Automatically handles NaN, null, undefined, and Infinity.
 */
export function safeClamp(value: any, min: number = 0, max: number = 100, fallback: number = 50): number {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(value)));
}

/**
 * Signal Category Ownership Table
 * Prevents double penalization by allocating each core deduction to a primary category.
 */
export type DeductibleIssueType =
  | 'MISSING_EMAIL'
  | 'MISSING_PHONE'
  | 'MISSING_LINKEDIN'
  | 'MISSING_EXPERIENCE_SECTION'
  | 'MISSING_SKILLS_SECTION'
  | 'MISSING_EDUCATION_SECTION'
  | 'MISSING_SUMMARY_SECTION'
  | 'TABLE_OR_COLUMN_SCRAMBLE'
  | 'UNUSUAL_SYMBOLS'
  | 'EXTREMELY_SHORT_TEXT'
  | 'PASSIVE_WEAK_STARTERS'
  | 'MISSING_QUANTIFIABLE_METRICS'
  | 'FIRST_PERSON_PRONOUNS'
  | 'LOW_KEYWORD_DENSITY';

export interface DeductibleSignal {
  type: DeductibleIssueType;
  primaryCategory: 'atsReadability' | 'keywordRelevance' | 'experience' | 'projects' | 'formatting' | 'education' | 'achievements';
  severity: 'low' | 'medium' | 'high' | 'critical';
  penaltyPoints: number;
  message: string;
}

export const SIGNAL_OWNERSHIP: Record<DeductibleIssueType, { primaryCategory: DeductibleSignal['primaryCategory']; defaultPenalty: number }> = {
  MISSING_EMAIL: { primaryCategory: 'atsReadability', defaultPenalty: 20 },
  MISSING_PHONE: { primaryCategory: 'atsReadability', defaultPenalty: 15 },
  MISSING_LINKEDIN: { primaryCategory: 'atsReadability', defaultPenalty: 5 },
  MISSING_EXPERIENCE_SECTION: { primaryCategory: 'experience', defaultPenalty: 35 },
  MISSING_SKILLS_SECTION: { primaryCategory: 'keywordRelevance', defaultPenalty: 30 },
  MISSING_EDUCATION_SECTION: { primaryCategory: 'education', defaultPenalty: 30 },
  MISSING_SUMMARY_SECTION: { primaryCategory: 'formatting', defaultPenalty: 8 },
  TABLE_OR_COLUMN_SCRAMBLE: { primaryCategory: 'atsReadability', defaultPenalty: 25 },
  UNUSUAL_SYMBOLS: { primaryCategory: 'formatting', defaultPenalty: 12 },
  EXTREMELY_SHORT_TEXT: { primaryCategory: 'formatting', defaultPenalty: 30 },
  PASSIVE_WEAK_STARTERS: { primaryCategory: 'experience', defaultPenalty: 15 },
  MISSING_QUANTIFIABLE_METRICS: { primaryCategory: 'achievements', defaultPenalty: 25 },
  FIRST_PERSON_PRONOUNS: { primaryCategory: 'experience', defaultPenalty: 10 },
  LOW_KEYWORD_DENSITY: { primaryCategory: 'keywordRelevance', defaultPenalty: 25 },
};

/**
 * Filter out duplicate issues across categories to avoid penalizing the user multiple times.
 */
export function deduplicateStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const normalized = trimmed.toLowerCase().replace(/[^\w\s]/g, '');
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(trimmed);
    }
  }
  return result;
}
