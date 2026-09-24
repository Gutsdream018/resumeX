import {
  StructuredRecommendation,
  BulletPointImprovement,
  StructuredResume,
} from '../../models/resume.types.js';
import { MuseSemanticAnalysisResult } from '../ai/museAnalyzer.js';
import { ExperienceAnalysisResult } from '../analyzers/experienceAnalyzer.js';
import { KeywordAnalysisResult } from '../analyzers/keywordAnalyzer.js';
import { AtsReadabilityResult } from '../analyzers/atsReadabilityAnalyzer.js';
import { deduplicateStrings } from '../scoring/scoreNormalizer.js';

export interface RecommendationEngineOutput {
  formattedRecommendations: string[];
  detailedRecommendations: StructuredRecommendation[];
  bulletPointImprovements: BulletPointImprovement[];
  criticalIssues: string[];
  warnings: string[];
  strengths: string[];
}

export function generateActionableRecommendations(params: {
  structuredResume: StructuredResume;
  museResult?: MuseSemanticAnalysisResult;
  experienceResult: ExperienceAnalysisResult;
  keywordResult: KeywordAnalysisResult;
  readabilityResult: AtsReadabilityResult;
  overallScore: number;
}): RecommendationEngineOutput {
  const {
    structuredResume,
    museResult,
    experienceResult,
    keywordResult,
    readabilityResult,
  } = params;

  const detailedRecommendations: StructuredRecommendation[] = [];
  const bulletPointImprovements: BulletPointImprovement[] = [];

  // 1. Ingest Muse Recommendations (if live)
  if (museResult?.recommendations && museResult.recommendations.length > 0) {
    for (const r of museResult.recommendations) {
      if (detailedRecommendations.length >= 6) break;
      detailedRecommendations.push({
        section: r.section || 'experience',
        issue: r.issue || 'Bullet phrasing refinement',
        severity: r.severity || 'medium',
        explanation: r.explanation || 'Applying strong action verbs and metric placeholders boosts recruiter clarity.',
        currentText: r.currentText || '',
        suggestedText: r.suggestedText || '',
      });

      if (r.currentText && r.suggestedText) {
        bulletPointImprovements.push({
          original: r.currentText,
          problem: r.issue,
          improved: r.suggestedText,
          why_better: r.explanation || 'Applies the Google XYZ formula with quantifiable placeholders.',
        });
      }
    }
  }

  // 2. Rule-based Experience Bullet Rewrites (if Muse didn't populate enough)
  if (bulletPointImprovements.length < 3) {
    for (const weak of experienceResult.weakBullets) {
      if (bulletPointImprovements.length >= 4) break;
      bulletPointImprovements.push({
        original: weak.bullet,
        problem: weak.issue,
        improved: weak.suggestedFix || `Spearheaded ${weak.bullet.replace(/^([•\-\*]|\b(?:responsible for|worked on|helped with)\b)\s*/i, '')}, achieving [quantifiable metric: e.g. X% efficiency increase or Y hours saved].`,
        why_better: 'Replaces passive duty phrasing with direct leadership action verbs.',
      });

      if (detailedRecommendations.length < 6) {
        detailedRecommendations.push({
          section: 'experience',
          issue: weak.issue,
          severity: 'high',
          explanation: 'Leading with passive phrasing obscures your individual engineering impact.',
          currentText: weak.bullet,
          suggestedText: weak.suggestedFix || `Spearheaded ${weak.bullet.replace(/^([•\-\*]|\b(?:responsible for|worked on|helped with)\b)\s*/i, '')}, achieving [quantifiable outcome].`,
        });
      }
    }
  }

  // 3. Fallback scan of candidate bullets if still empty
  if (bulletPointImprovements.length === 0 && structuredResume.experience.length > 0) {
    for (const exp of structuredResume.experience) {
      for (const bullet of exp.bullets) {
        if (bulletPointImprovements.length >= 3) break;
        if (bullet.trim().length > 15) {
          bulletPointImprovements.push({
            original: bullet,
            problem: 'Missing quantifiable metrics & active verb',
            improved: `Architected and deployed ${bullet.replace(/^([•\-\*]|\b(?:responsible for|worked on|helped with)\b)\s*/i, '').replace(/\.$/, '')}, delivering measurable outcomes across [target metric: e.g. X users / Y% performance gain].`,
            why_better: 'Applies the Google XYZ framework leading with a decisive action verb.',
          });
        }
      }
    }
  }

  // 4. Missing Core Keywords Recommendation
  if (keywordResult.missing.length > 0 && detailedRecommendations.length < 6) {
    const missingStr = keywordResult.missing.slice(0, 4).join(', ');
    detailedRecommendations.push({
      section: 'skills',
      issue: `Incorporate high-priority technical keywords (${missingStr})`,
      severity: 'medium',
      explanation: 'Targeting industry-standard frameworks and infrastructure tools improves algorithmic ATS search match rates.',
      currentText: 'Skills: ' + keywordResult.matched.slice(0, 4).join(', '),
      suggestedText: `Skills: ${keywordResult.matched.slice(0, 4).join(', ')}, ${missingStr}`,
    });
  }

  // 5. Contact / Readability Recommendations
  for (const deduction of readabilityResult.deductions) {
    if (detailedRecommendations.length >= 6) break;
    if (/email/i.test(deduction)) {
      detailedRecommendations.push({
        section: 'contact',
        issue: 'Missing direct contact email',
        severity: 'critical',
        explanation: 'ATS engines cannot route interview requests without a valid email in the contact header.',
        currentText: 'Email: [Not Found]',
        suggestedText: 'Email: yourname@email.com',
      });
    } else if (/phone/i.test(deduction)) {
      detailedRecommendations.push({
        section: 'contact',
        issue: 'Missing phone number',
        severity: 'high',
        explanation: 'Direct phone contact enables recruiter screening calls.',
        currentText: 'Phone: [Not Found]',
        suggestedText: 'Phone: +1 (555) 123-4567',
      });
    }
  }

  // String formatting for top-level recommendations array
  const formattedRecommendations = detailedRecommendations.map(
    (r) => `${r.issue}: ${r.explanation || r.suggestedText}`
  );

  if (formattedRecommendations.length === 0) {
    formattedRecommendations.push(
      'Add measurable outcome metrics to your project and experience bullet points.',
      'Standardize date format across all listed positions.',
      'Incorporate relevant cloud infrastructure and containerization keywords.'
    );
  }

  // Deduplicate and aggregate strengths, critical issues, and warnings
  const strengths = deduplicateStrings([
    ...(museResult?.strengths || []),
    ...readabilityResult.signals,
    ...keywordResult.signals,
    ...experienceResult.signals,
  ]).slice(0, 8);

  const criticalIssues = deduplicateStrings([
    ...(museResult?.criticalIssues || []),
    ...readabilityResult.deductions.filter((d) => /missing|critical|empty|zero/i.test(d)),
    ...experienceResult.deductions.filter((d) => /missing|critical/i.test(d)),
  ]).slice(0, 8);

  const warnings = deduplicateStrings([
    ...(museResult?.warnings || []),
    ...readabilityResult.warnings,
    ...readabilityResult.deductions.filter((d) => !/missing|critical|empty|zero/i.test(d)),
    ...experienceResult.deductions.filter((d) => !/missing|critical/i.test(d)),
    ...keywordResult.deductions,
  ]).slice(0, 8);

  return {
    formattedRecommendations,
    detailedRecommendations,
    bulletPointImprovements: bulletPointImprovements.slice(0, 6),
    criticalIssues,
    warnings,
    strengths,
  };
}
