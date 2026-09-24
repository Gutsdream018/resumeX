import { safeClamp } from '../scoring/scoreNormalizer.js';

export interface AchievementAnalysisResult {
  metricCount: number;
  percentageMetrics: number;
  financialMetrics: number;
  scaleMetrics: number;
  latencyThroughputMetrics: number;
  hasCertificationsOrAwards: boolean;
  score: number;
  signals: string[];
  deductions: string[];
}

export function analyzeAchievements(
  fullText: string,
  certificationsCount: number = 0,
  achievementsCount: number = 0
): AchievementAnalysisResult {
  const signals: string[] = [];
  const deductions: string[] = [];

  const percentageMatches = fullText.match(/\b\d+(\.\d+)?%/g) || [];
  const financialMatches = fullText.match(/\$\d+[\d,]*(?:\.\d+)?(?:\s*(?:k|m|b|million|billion))?/gi) || [];
  const scaleMatches = fullText.match(/\b\d+\s*(?:k|m|b|million|billion|thousand)?\s*(?:users|clients|customers|requests|queries|devices|records|engineers|teams|servers|nodes)\b/gi) || [];
  const latencyMatches = fullText.match(/\b\d+\s*(?:ms|milliseconds|seconds|fps|x|times)\b/gi) || [];

  const percentageMetrics = percentageMatches.length;
  const financialMetrics = financialMatches.length;
  const scaleMetrics = scaleMatches.length;
  const latencyThroughputMetrics = latencyMatches.length;

  const metricCount = percentageMetrics + financialMetrics + scaleMetrics + latencyThroughputMetrics;
  const hasCertificationsOrAwards = certificationsCount > 0 || achievementsCount > 0 || /(?:certified|aws\s+certified|award|winner|honor|patent|publication)\b/i.test(fullText);

  let score = 35;

  if (metricCount >= 4) {
    score += 45;
    signals.push(`Outstanding metric density: detected ${metricCount} quantifiable outcomes (percentages, scale, or cost metrics).`);
  } else if (metricCount >= 2) {
    score += 30;
    signals.push(`Solid impact quantification: found ${metricCount} measurable outcomes.`);
  } else if (metricCount === 1) {
    score += 15;
    signals.push('Contains 1 quantifiable outcome. Adding 2-3 additional metrics across key roles will boost impact.');
  } else {
    deductions.push('Zero quantifiable achievements detected. Highlighting metrics (% improvements, scale, latency cuts) increases interview callbacks.');
  }

  if (hasCertificationsOrAwards) {
    score += 20;
    signals.push('Recognized certifications, honors, or published achievements present.');
  }

  return {
    metricCount,
    percentageMetrics,
    financialMetrics,
    scaleMetrics,
    latencyThroughputMetrics,
    hasCertificationsOrAwards,
    score: safeClamp(score, 15, 100),
    signals,
    deductions,
  };
}
