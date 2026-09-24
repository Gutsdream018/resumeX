export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';

export type DiagnosticCategory =
  | 'atsReadability'
  | 'keywordRelevance'
  | 'experience'
  | 'projects'
  | 'formatting'
  | 'education'
  | 'achievements';

export interface PriorityIssue {
  id: string;
  title: string;
  severity: IssueSeverity;
  sourceText?: string;
  section: string;
  evidence: string[];
  affectedScore: DiagnosticCategory;
  scoreImpact: {
    category: DiagnosticCategory;
    direction: 'negative' | 'neutral';
    estimatedDeficit: number; // e.g. 15 points
  };
  reason: string;
  recommendation: string;
  requiresUserInput: boolean;
  priorityScore: number;
  confidence: number;
  targetTab: 'resume-analysis' | 'keywords' | 'experience' | 'education' | 'skills' | 'sections' | 'ats-score' | 'job-match';
}

export interface ScoreContributionItem {
  category: DiagnosticCategory;
  name: string;
  score: number;
  weight: number; // e.g. 0.20
  weightPercentage: number; // e.g. 20
  contribution: number; // e.g. 13.6
  reason: string;
  strengths: string[];
  deductions: string[];
}

export interface ResumeSignals {
  atsSignals: string[];
  contentSignals: string[];
  readabilitySignals: string[];
}

export interface ScoreExplanation {
  score: number;
  summary: string;
  deductions: string[];
  strengths: string[];
  calibratedVerdict: string;
}

export interface RecommendedFixStep {
  stepNumber: number;
  title: string;
  description: string;
  targetTab: string;
  category: string;
  severity: IssueSeverity;
}

export interface DiagnosticOutput {
  overallScore: number;
  contributions: ScoreContributionItem[];
  priorityIssues: PriorityIssue[];
  signals: ResumeSignals;
  strengths: string[];
  scoreExplanation: ScoreExplanation;
  recommendedFixOrder: RecommendedFixStep[];
  calibratedVerdict: string;
  confidence: number;
}
