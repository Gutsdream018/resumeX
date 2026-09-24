import { ContactAnalysisResult } from './contactAnalyzer.js';
import { SectionAnalysisResult } from './sectionAnalyzer.js';
import { FormattingAnalysisResult } from './formattingAnalyzer.js';
import { safeClamp } from '../scoring/scoreNormalizer.js';

export interface AtsReadabilityResult {
  score: number;
  signals: string[];
  deductions: string[];
  warnings: string[];
  breakdown: {
    contactCompleteness: number;
    sectionRecognizability: number;
    textExtractability: number;
    dateConsistency: number;
    layoutCleanliness: number;
  };
}

export function analyzeAtsReadability(
  contact: ContactAnalysisResult,
  sections: SectionAnalysisResult,
  formatting: FormattingAnalysisResult,
  fullText: string
): AtsReadabilityResult {
  const signals: string[] = [];
  const deductions: string[] = [];
  const warnings: string[] = [];

  // 1. Contact Completeness (25%)
  let contactScore = 0;
  if (contact.hasName) contactScore += 30;
  if (contact.hasEmail) contactScore += 40;
  if (contact.hasPhone) contactScore += 30;

  // 2. Section Recognizability (25%)
  let sectionScore = 0;
  if (sections.detectedSections.experience) sectionScore += 35;
  if (sections.detectedSections.skills) sectionScore += 35;
  if (sections.detectedSections.education) sectionScore += 30;

  // 3. Text Extractability & Anomalies (20%)
  let extractScore = 90;
  if (formatting.isExtremelyShort) {
    extractScore -= 40;
    deductions.push('Extracted text volume is abnormally small; possible scanned image or unparseable font layers.');
  }
  const strangeCharRatio = (fullText.match(/[^\w\s.,;:()\-–—/'"@+]/g) || []).length / Math.max(1, fullText.length);
  if (strangeCharRatio > 0.04) {
    extractScore -= 25;
    deductions.push('High concentration of unreadable glyphs/anomalies detected in raw text stream.');
  }

  // 4. Date Consistency (15%)
  const dateScore = formatting.dateConsistencyScore;

  // 5. Layout Cleanliness (15%)
  let layoutScore = 90;
  if (formatting.hasTablesOrColumnsHint) {
    layoutScore -= 30;
    deductions.push('Multi-column tables or text boxes may disrupt top-to-bottom ATS reading order.');
  }
  if (formatting.hasUnusualSymbols) {
    layoutScore -= 15;
    warnings.push('Decorative icons or unsupported symbols may be ignored or rendered as broken characters in older ATS engines.');
  }

  // Aggregate signals & deductions cleanly
  if (contact.hasEmail && contact.hasPhone) {
    signals.push('Core contact channels (email & phone) are clearly legible and easily extracted.');
  }
  if (sections.presentSections.length >= 4) {
    signals.push(`Clear, standard section headings (${sections.presentSections.slice(0, 4).join(', ')}) allow accurate section classification.`);
  }
  if (!formatting.hasTablesOrColumnsHint) {
    signals.push('Single-column linear text layout ensures 100% parseability across all ATS vendors.');
  }

  // Deduct from overall readability score based on weighted sub-factors
  const overallReadability =
    contactScore * 0.25 +
    sectionScore * 0.25 +
    extractScore * 0.20 +
    dateScore * 0.15 +
    layoutScore * 0.15;

  return {
    score: safeClamp(overallReadability, 15, 100),
    signals,
    deductions,
    warnings,
    breakdown: {
      contactCompleteness: safeClamp(contactScore, 0, 100),
      sectionRecognizability: safeClamp(sectionScore, 0, 100),
      textExtractability: safeClamp(extractScore, 0, 100),
      dateConsistency: safeClamp(dateScore, 0, 100),
      layoutCleanliness: safeClamp(layoutScore, 0, 100),
    },
  };
}
