import { CanonicalResume } from '../ingestion/types.js';

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';

export type IssueCategory =
  | 'content'
  | 'structure'
  | 'ats'
  | 'quality'
  | 'skills'
  | 'experience'
  | 'projects'
  | 'summary';

export interface ResumeEvidence {
  sourceText: string;
  section: string;
  verifiedFacts: string[];
  verifiedMetrics: string[];
  verifiedTechnologies: string[];
  verifiedOutcomes: string[];
  unsupportedClaims: string[];
}

export interface CritiqueIssue {
  id: string;
  type: string;
  section: string;
  severity: IssueSeverity;
  title: string;
  sourceText: string;
  reason: string;
  roleOrContext?: string;
  evidence: string[];
  impact: {
    category: string;
    description: string;
  };
}

export interface CritiqueRevision {
  issueId: string;
  originalText: string;
  suggestedRevision: string;
  requiresUserInput: boolean;
  missingEvidence?: string[];
  verifiedFacts: string[];
  unsupportedClaims: string[];
  explanation: string;
  recruiterTip: string;
  type: 'DIRECT_REWRITE' | 'IMPROVEMENT_TEMPLATE';
}

export interface FactValidationResult {
  isValid: boolean;
  rejectionReason?: string;
  hallucinatedMetrics: string[];
  hallucinatedTechnologies: string[];
}

export interface ScoreDeltaResult {
  beforeScore: number;
  afterScore: number;
  delta: number;
  categoryDeltas: Record<string, number>;
  updatedResume: CanonicalResume;
  resolvedIssueId: string;
}

export interface RevisionHistoryItem {
  revisionId: string;
  timestamp: string;
  issueId: string;
  section: string;
  beforeText: string;
  afterText: string;
  scoreBefore: number;
  scoreAfter: number;
  delta: number;
}

export interface CritiqueEngineOutput {
  issues: CritiqueIssue[];
  revisions: CritiqueRevision[];
  evidenceMap: Record<string, ResumeEvidence>;
  recruiterTips: string[];
}
