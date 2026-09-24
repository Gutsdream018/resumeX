import { countWords, splitLines } from '../../utils/textUtils.js';

export interface FormattingAnalysis {
  wordCount: number;
  lineCount: number;
  hasTablesOrColumnsHint: boolean;
  hasUnusualSymbols: boolean;
  isExtremelyShort: boolean;
  isExcessivelyLong: boolean;
  score: number; // 0 to 100
  issues: string[];
  strengths: string[];
  warnings: string[];
}

export function analyzeFormatting(text: string): FormattingAnalysis {
  const issues: string[] = [];
  const strengths: string[] = [];
  const warnings: string[] = [];

  const wordCount = countWords(text);
  const lines = splitLines(text);
  const lineCount = lines.length;

  const isExtremelyShort = wordCount < 180;
  const isExcessivelyLong = wordCount > 950;

  // Length checks
  if (isExtremelyShort) {
    issues.push(`Resume is critically brief (${wordCount} words). Comprehensive resumes average 400–750 words.`);
  } else if (isExcessivelyLong) {
    warnings.push(`Resume is lengthy (${wordCount} words). Aim for a concise 1-2 page presentation.`);
  } else {
    strengths.push(`Optimal resume length (${wordCount} words), fitting cleanly into standard 1–2 page recruiter expectations.`);
  }

  // Multi-column or table detection
  const hasTablesOrColumnsHint = /(\|\s*-+\s*\||\t{2,}|table\s*of\s*contents)/i.test(text);
  if (hasTablesOrColumnsHint) {
    issues.push('Detected potential table borders or complex multi-column formatting that can scramble ATS reading order.');
  } else {
    strengths.push('Clean linear layout free of complex tables or multi-column text scrambles.');
  }

  // Unusual graphic symbols
  const hasUnusualSymbols = /([★✦■◆●▲▼•‣])/g.test(text);
  const excessiveSpecialChars = (text.match(/[^a-zA-Z0-9\s.,;:\-–—()'"/&@+]/g) || []).length;
  if (excessiveSpecialChars > 25) {
    warnings.push('Contains non-standard symbols or complex icons. Standard circle/hyphen bullets are safest for ATS.');
  }

  // Bullet formatting check
  const bulletLines = lines.filter((l) => /^[•\-\*]/.test(l));
  if (bulletLines.length >= 6) {
    strengths.push(`Consistent bullet point structure utilized across ${bulletLines.length} descriptive statements.`);
  }

  // Date format consistency
  const standardDates = (text.match(/\b(20\d{2}|19\d{2})\b/g) || []).length;
  if (standardDates >= 2) {
    strengths.push('Chronological dates detected for clear career progression tracking.');
  }

  // Scoring
  let score = 80;
  if (isExtremelyShort) score -= 35;
  if (isExcessivelyLong) score -= 15;
  if (hasTablesOrColumnsHint) score -= 20;
  if (excessiveSpecialChars > 25) score -= 10;
  if (bulletLines.length >= 6) score += 10;
  if (standardDates >= 2) score += 10;

  return {
    wordCount,
    lineCount,
    hasTablesOrColumnsHint,
    hasUnusualSymbols,
    isExtremelyShort,
    isExcessivelyLong,
    score: Math.max(15, Math.min(100, score)),
    issues,
    strengths,
    warnings,
  };
}
