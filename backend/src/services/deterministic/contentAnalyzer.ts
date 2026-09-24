import { splitLines, cleanBullet } from '../../utils/textUtils.js';

export interface ContentAnalysis {
  metricCount: number;
  strongVerbHits: number;
  weakStarterHits: number;
  pronounHits: number;
  score: number; // 0 to 100
  issues: string[];
  strengths: string[];
  weakLines: Array<{ line: string; issue: string }>;
}

const STRONG_ACTION_VERBS = [
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

export function analyzeContent(text: string): ContentAnalysis {
  const issues: string[] = [];
  const strengths: string[] = [];
  const weakLines: Array<{ line: string; issue: string }> = [];

  const lines = splitLines(text);

  // 1. Metric Density
  const metricRegex = /(\b\d+(\.\d+)?%|\$\d+[\d,]*(\.\d+)?|\b\d+k\b|\b\d+x\b|\b\d+\s*(users|clients|customers|requests|transactions|engineers|microservices|leads|teams|projects)\b)/gi;
  const metricsFound = text.match(metricRegex) || [];
  const metricCount = metricsFound.length;

  if (metricCount >= 4) {
    strengths.push(`High impact density: ${metricCount}+ quantifiable achievements detected (percentages, scale, or cost metrics).`);
  } else if (metricCount >= 1) {
    strengths.push(`Contains ${metricCount} measurable outcomes. Adding more metric depth will further strengthen recruiter interest.`);
  } else {
    issues.push('Zero quantifiable achievements detected. Bullet points lack metrics (e.g. % efficiency, scale, or revenue).');
  }

  // 2. Strong Verbs & Weak Starters
  let strongVerbHits = 0;
  for (const verb of STRONG_ACTION_VERBS) {
    if (new RegExp(`\\b${verb}\\b`, 'i').test(text)) strongVerbHits++;
  }

  let weakStarterHits = 0;
  for (const starter of WEAK_STARTERS) {
    const matches = text.match(new RegExp(`\\b${starter}\\b`, 'gi'));
    if (matches) weakStarterHits += matches.length;
  }

  if (strongVerbHits >= 5) {
    strengths.push(`Decisive leadership vocabulary: found ${strongVerbHits} strong executive action verbs.`);
  } else if (strongVerbHits >= 2) {
    strengths.push('Uses several decisive action verbs across experience descriptions.');
  }

  if (weakStarterHits >= 3) {
    issues.push(`Frequent passive phrasing: detected ${weakStarterHits} duty-oriented phrases ("responsible for", "worked on").`);
  }

  // 3. Pronouns Check (Resumes must avoid "I", "me", "my", "we")
  const personalPronounRegex = /\b(I|me|my|we|our|myself)\b/gi;
  const pronounHits = (text.match(personalPronounRegex) || []).length;
  if (pronounHits >= 2) {
    issues.push(`Found ${pronounHits} first-person pronouns ("I", "my", "we"). Standard resume format uses implied third-person action verbs.`);
  }

  // 4. Inspect individual bullet lines for specific weak lines
  for (const line of lines) {
    const clean = cleanBullet(line);
    if (clean.length < 25 || clean.length > 300) continue;
    if (/@|http|university|bachelor|education/i.test(clean)) continue;

    for (const weak of WEAK_STARTERS) {
      if (new RegExp(`^${weak}\\b`, 'i').test(clean)) {
        weakLines.push({
          line: clean,
          issue: `Opens with passive phrase "${weak}" rather than leading with a strong action verb.`,
        });
        break;
      }
    }
  }

  // Scoring
  let score = 50;
  score += Math.min(30, metricCount * 8);
  score += Math.min(20, strongVerbHits * 4);
  score -= Math.min(25, weakStarterHits * 6);
  score -= Math.min(15, pronounHits * 5);

  return {
    metricCount,
    strongVerbHits,
    weakStarterHits,
    pronounHits,
    score: Math.max(15, Math.min(100, Math.round(score))),
    issues,
    strengths,
    weakLines,
  };
}
