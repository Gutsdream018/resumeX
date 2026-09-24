export interface CategoryScores {
  ats: number;
  content: number;
  skills: number;
  experience: number;
  impact: number;
  formatting: number;
  grammar: number;
  professionalism: number;
}

export interface BulletPointImprovement {
  original: string;
  problem: string;
  improved: string;
  why_better: string;
}

export interface CritiqueIssue {
  id: string;
  type: string;
  section: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
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

export interface CritiqueEngineOutput {
  issues: CritiqueIssue[];
  revisions: CritiqueRevision[];
  evidenceMap: Record<string, any>;
  recruiterTips: string[];
}

export interface PriorityIssue {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  sourceText?: string;
  section: string;
  evidence: string[];
  affectedScore: string;
  scoreImpact: {
    category: string;
    direction: 'negative' | 'neutral';
    estimatedDeficit: number;
  };
  reason: string;
  recommendation: string;
  requiresUserInput: boolean;
  priorityScore: number;
  confidence: number;
  targetTab: string;
}

export interface ScoreContributionItem {
  category: string;
  name: string;
  score: number;
  weight: number;
  weightPercentage: number;
  contribution: number;
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
  severity: 'critical' | 'high' | 'medium' | 'low';
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

export interface ScoreDeltaResult {
  beforeScore: number;
  afterScore: number;
  delta: number;
  categoryDeltas: Record<string, number>;
  updatedResume: any;
  resolvedIssueId: string;
}

export interface ResumeAnalysisResult {
  resumeId?: string;
  overall_score: number;
  score?: {
    overall: number;
    atsReadability?: number;
    keywordRelevance?: number;
    experience?: number;
    projects?: number;
    formatting?: number;
    education?: number;
    achievements?: number;
    atsCompatibility?: number;
    ats?: number;
    keywords?: number;
  };
  category_scores: CategoryScores;
  score_grade: string;
  strengths: string[];
  critical_flaws: string[];
  minor_flaws: string[];
  ats_issues: string[];
  missing_information: string[];
  recommendations: string[];
  bullet_point_improvements: BulletPointImprovement[];
  professionalism_summary: string;
  structuredResume?: any;
  canonicalResume?: any;
  critique?: CritiqueEngineOutput;
  diagnostic?: DiagnosticOutput;
  metadata: {
    word_count: number;
    char_count: number;
    file_type?: string;
    extraction_method?: 'native_text' | 'ocr_image' | 'ocr_scanned_pdf';
    preserved_document?: {
      mime_type: string;
      original_name?: string;
      preview_data_url?: string;
    };
    raw_text?: string;
    analysis_mode: 'ai_live' | 'heuristic_engine' | string;
    analyzed_at: string;
  };
}

export interface SectionHealthScore {
  section: string;
  name: string;
  score: number;
  issueCount: number;
  status: 'optimal' | 'needs_improvement' | 'critical';
}

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
  detectedMissing: string[];
  fields: MissingInformationField[];
  reason: string;
}

export interface FactGuidedRewriteResponse {
  originalText: string;
  suggestedRevision: string;
  verifiedFacts: string[];
  explanation: string;
  recruiterTip: string;
  affectedCategory: string;
  isValid: boolean;
  rejectionReason?: string;
}

export interface ExportQualityCheckItem {
  id: string;
  title: string;
  passed: boolean;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface ExportQualityReport {
  readyToExport: boolean;
  checks: ExportQualityCheckItem[];
  overallAtsScore: number;
  optimizationProgress: number;
}

export interface OptimizerRescoreResult {
  overallScore: number;
  scoreDelta: number;
  categoryScores: Record<string, number>;
  categoryDeltas: Record<string, number>;
  sectionHealth: SectionHealthScore[];
  updatedResume: any;
  optimizationProgress: number;
  exportQuality: ExportQualityReport;
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

export interface SampleResume {
  id: string;
  title: string;
  role: string;
  experience_level: string;
  expected_score_range: string;
  description: string;
  content?: string;
}

export type AnalysisStep =
  | 'idle'
  | 'extracting'
  | 'structure'
  | 'ats'
  | 'experience'
  | 'improvements'
  | 'generating'
  | 'completed';

export interface CanonicalContact {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface CanonicalExperience {
  title: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  bullets: string[];
  technologies?: string[];
}

export interface CanonicalProject {
  name: string;
  description?: string;
  technologies?: string[] | string;
  bullets?: string[];
  link?: string;
  role?: string;
}

export interface CanonicalEducation {
  institution: string;
  degree: string;
  graduationDate?: string;
  gpa?: string;
  location?: string;
}

export interface CanonicalSkills {
  technical?: string[];
  frameworks?: string[];
  databases?: string[];
  tools?: string[];
  soft?: string[];
}

export interface CanonicalResume {
  contact: CanonicalContact;
  summary?: string;
  experience?: CanonicalExperience[];
  internships?: CanonicalExperience[];
  projects?: CanonicalProject[];
  skills: CanonicalSkills;
  education?: CanonicalEducation[];
  certifications?: (string | { name: string; issuer?: string })[];
  achievements?: string[];
}
