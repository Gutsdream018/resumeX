import { CanonicalResume } from '../ingestion/types.js';
import { DiagnosticCategory, IssueSeverity } from '../diagnostic/types.js';

export interface MissingInformationField {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
  type: 'text' | 'number' | 'tech_tag';
  hint?: string;
}

export interface MissingInformationPrompt {
  id: string;
  bulletId?: string;
  sourceText: string;
  section: string;
  detectedMissing: string[]; // e.g. ['Technology stack', 'Measurable metric', 'User scale']
  fields: MissingInformationField[];
  reason: string;
}

export interface FactGuidedRewriteRequest {
  originalText: string;
  section: string;
  roleOrContext?: string;
  userFacts: Record<string, string>; // e.g. { technology: 'React, Node.js', scale: '500 users', result: '30% speedup' }
  targetTone?: 'impactful' | 'concise' | 'technical';
}

export interface FactGuidedRewriteResponse {
  originalText: string;
  suggestedRevision: string;
  verifiedFacts: string[];
  explanation: string;
  recruiterTip: string;
  affectedCategory: DiagnosticCategory;
  isValid: boolean;
  rejectionReason?: string;
}

export interface SectionHealthScore {
  section: string;
  name: string;
  score: number;
  issueCount: number;
  status: 'optimal' | 'needs_improvement' | 'critical';
}

export interface RevisionHistoryItem {
  id: string;
  timestamp: string;
  section: string;
  beforeText: string;
  afterText: string;
  reason: string;
  scoreBefore: number;
  scoreAfter: number;
  delta: number;
}

export interface ExportQualityCheckItem {
  id: string;
  title: string;
  passed: boolean;
  message: string;
  severity: IssueSeverity;
}

export interface ExportQualityReport {
  readyToExport: boolean;
  checks: ExportQualityCheckItem[];
  overallAtsScore: number;
  optimizationProgress: number; // 0 - 100%
}

export interface OptimizerRescoreResult {
  overallScore: number;
  scoreDelta: number;
  categoryScores: Record<string, number>;
  categoryDeltas: Record<string, number>;
  sectionHealth: SectionHealthScore[];
  updatedResume: CanonicalResume;
  optimizationProgress: number;
  exportQuality: ExportQualityReport;
}
