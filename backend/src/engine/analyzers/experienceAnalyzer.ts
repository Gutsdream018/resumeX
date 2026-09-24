import { ExperienceItem } from '../../models/resume.types.js';
import { safeClamp } from '../scoring/scoreNormalizer.js';
import { CareerLevel } from '../schemas/analysisSchema.js';

export interface ExperienceAnalysisResult {
  entryCount: number;
  totalBullets: number;
  strongVerbCount: number;
  weakStarterCount: number;
  xyzFormulaCount: number;
  score: number;
  signals: string[];
  deductions: string[];
  weakBullets: Array<{ bullet: string; issue: string; suggestedFix?: string }>;
}

const STRONG_VERBS = [
  'spearheaded', 'architected', 'engineered', 'orchestrated', 'streamlined',
  'optimized', 'developed', 'deployed', 'built', 'reduced', 'increased',
  'boosted', 'automated', 'implemented', 'designed', 'delivered', 'generated',
  'scaled', 'negotiated', 'transformed', 'authored', 'established', 'directed',
  'accelerated', 'executed', 'consolidated', 'modernized', 'overhauled'
];

const WEAK_STARTERS = [
  'responsible for', 'worked on', 'helped with', 'assisted in', 'handled',
  'participated in', 'tasked with', 'duties included', 'was involved in',
  'helped', 'assisted', 'served as', 'supported'
];

export function analyzeExperienceEntries(
  experience: ExperienceItem[],
  fullText: string,
  careerLevel?: CareerLevel
): ExperienceAnalysisResult {
  const signals: string[] = [];
  const deductions: string[] = [];
  const weakBullets: Array<{ bullet: string; issue: string; suggestedFix?: string }> = [];

  const entryCount = experience.length;
  let totalBullets = 0;
  let strongVerbCount = 0;
  let weakStarterCount = 0;
  let xyzFormulaCount = 0;

  for (const exp of experience) {
    totalBullets += exp.bullets.length;

    for (const bullet of exp.bullets) {
      const clean = bullet.trim();
      if (clean.length < 15) continue;

      // Check for strong verbs
      const firstWord = clean.split(/\s+/)[0]?.toLowerCase().replace(/[^\w]/g, '');
      if (STRONG_VERBS.includes(firstWord) || STRONG_VERBS.some((v) => new RegExp(`\\b${v}\\b`, 'i').test(clean))) {
        strongVerbCount++;
      }

      // Check for weak starters
      for (const starter of WEAK_STARTERS) {
        if (new RegExp(`^${starter}\\b`, 'i').test(clean)) {
          weakStarterCount++;
          weakBullets.push({
            bullet: clean,
            issue: `Opens with passive phrase "${starter}"`,
            suggestedFix: `Spearheaded ${clean.replace(new RegExp(`^${starter}\\s+`, 'i'), '')}, delivering [measurable outcome]`,
          });
          break;
        }
      }

      // Check Google XYZ Formula ("Accomplished [X] as measured by [Y] by doing [Z]")
      const hasMetric = /(\d+%|\$\d+|\b\d+\b\s*(?:users|requests|ms|hours|sprints|clients|teams))/i.test(clean);
      const hasAction = STRONG_VERBS.some((v) => new RegExp(`\\b${v}\\b`, 'i').test(clean));
      if (hasMetric && hasAction) {
        xyzFormulaCount++;
      }
    }
  }

  // Fallback scan if structured experience array was empty
  if (entryCount === 0) {
    for (const verb of STRONG_VERBS) {
      if (new RegExp(`\\b${verb}\\b`, 'i').test(fullText)) strongVerbCount++;
    }
    for (const starter of WEAK_STARTERS) {
      if (new RegExp(`\\b${starter}\\b`, 'i').test(fullText)) weakStarterCount++;
    }
  }

  let score = 50;

  if (entryCount >= 2) {
    score += 20;
    signals.push(`Structured career history with ${entryCount} positions.`);
  } else if (entryCount === 1) {
    score += 10;
    signals.push('Professional experience entry detected.');
  } else if (careerLevel !== 'student') {
    score -= 25;
    deductions.push('No structured professional experience entries detected.');
  } else {
    // For students, give grace base
    score += 10;
    signals.push('Entry-level profile: evaluation focuses on applied engineering contributions.');
  }

  if (strongVerbCount >= 5) {
    score += 15;
    signals.push(`Strong active leadership phrasing: found ${strongVerbCount} decisive action verbs.`);
  } else if (strongVerbCount >= 2) {
    score += 8;
  }

  if (weakStarterCount >= 3) {
    score -= 15;
    deductions.push(`Found ${weakStarterCount} passive duty-oriented starters ("responsible for", "worked on"). Rewrite using action verbs.`);
  }

  if (xyzFormulaCount >= 2) {
    score += 15;
    signals.push(`High impact density: ${xyzFormulaCount} bullet points clearly follow the Google XYZ impact formula.`);
  }

  return {
    entryCount,
    totalBullets,
    strongVerbCount,
    weakStarterCount,
    xyzFormulaCount,
    score: safeClamp(score, 15, 100),
    signals,
    deductions,
    weakBullets: weakBullets.slice(0, 5),
  };
}
