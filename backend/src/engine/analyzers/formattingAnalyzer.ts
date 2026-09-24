import { countWords, splitLines } from '../../utils/textUtils.js';
import { safeClamp } from '../scoring/scoreNormalizer.js';

export interface FormattingAnalysisResult {
  wordCount: number;
  lineCount: number;
  hasTablesOrColumnsHint: boolean;
  hasUnusualSymbols: boolean;
  isExtremelyShort: boolean;
  isExcessivelyLong: boolean;
  bulletConsistencyScore: number;
  dateConsistencyScore: number;
  score: number;
  signals: string[];
  deductions: string[];
  warnings: string[];
}

export function analyzeDocumentFormatting(text: string): FormattingAnalysisResult {
  const signals: string[] = [];
  const deductions: string[] = [];
  const warnings: string[] = [];

  const wordCount = countWords(text);
  const lines = splitLines(text);
  const lineCount = lines.length;

  const isExtremelyShort = wordCount < 180;
  const isExcessivelyLong = wordCount > 1100;

  let score = 85;

  // Length Evaluation
  if (isExtremelyShort) {
    score -= 30;
    deductions.push(`Resume is critically brief (${wordCount} words). Comprehensive tech resumes average 400–750 words.`);
  } else if (isExcessivelyLong) {
    score -= 10;
    warnings.push(`Resume is lengthy (${wordCount} words). Aim for a focused 1–2 page presentation.`);
  } else {
    score += 5;
    signals.push(`Optimal word density (${wordCount} words) aligning with standard 1–2 page ATS parsing models.`);
  }

  // Multi-column or table detection
  const hasTablesOrColumnsHint = /(\|\s*-+\s*\||\t{2,}|table\s*of\s*contents)/i.test(text);
  if (hasTablesOrColumnsHint) {
    score -= 20;
    deductions.push('Detected potential table borders or complex multi-column columns that can scramble ATS linear reading order.');
  } else {
    signals.push('Clean linear layout free of complex tables or multi-column text scrambles.');
  }

  // Graphic / Non-standard symbols check
  const nonStandardSymbols = (text.match(/[★✦■◆●▲▼‣►✓✔✕✖]/g) || []).length;
  const hasUnusualSymbols = nonStandardSymbols > 5;
  if (hasUnusualSymbols) {
    score -= 10;
    warnings.push(`Detected ${nonStandardSymbols} non-standard graphic symbols. Standard round bullets (•) or hyphens (-) are safest for ATS parsers.`);
  } else {
    signals.push('Standard bullet characters and clean typography.');
  }

  // Bullet Point Structure & Consistency
  const bulletLines = lines.filter((l) => /^[•\-\*\d+\.\)]/.test(l.trim()));
  const bulletConsistencyScore = bulletLines.length >= 6 ? 95 : bulletLines.length >= 3 ? 80 : 55;
  if (bulletLines.length >= 6) {
    signals.push(`Consistent bullet point structure across ${bulletLines.length} descriptive entries.`);
  } else if (bulletLines.length < 3) {
    warnings.push('Low bullet point count. ATS and recruiters prefer bulleted experience items over dense text blocks.');
  }

  // Date Format Consistency
  const yearMatches = text.match(/\b(19\d{2}|20\d{2})\b/g) || [];
  const standardMonthYearMatches = text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(?:19|20)\d{2}\b/gi) || [];
  const dateConsistencyScore = standardMonthYearMatches.length >= 2 ? 95 : yearMatches.length >= 2 ? 80 : 50;

  if (standardMonthYearMatches.length >= 2) {
    signals.push('Standardized Month/Year chronological date formatting detected.');
  } else if (yearMatches.length >= 2) {
    signals.push('Year-based chronology detected.');
  } else {
    warnings.push('Inconsistent or missing chronological dates across roles.');
  }

  return {
    wordCount,
    lineCount,
    hasTablesOrColumnsHint,
    hasUnusualSymbols,
    isExtremelyShort,
    isExcessivelyLong,
    bulletConsistencyScore,
    dateConsistencyScore,
    score: safeClamp(score, 15, 100),
    signals,
    deductions,
    warnings,
  };
}
