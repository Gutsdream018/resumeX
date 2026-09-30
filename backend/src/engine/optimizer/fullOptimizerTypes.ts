import { CanonicalResume } from '../ingestion/types.js';

export type FullOptimizationMode = 'ats_general' | 'tailored';

export type OptimizationSectionKey =
  | 'summary'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'education';

export interface OptimizedBullet {
  id: string;
  section: OptimizationSectionKey;
  parentContext?: string; // e.g. "Senior Software Engineer at TechFlow Systems" or "E-Commerce Microservices"
  originalText: string;
  newText: string;
  reason: string;
  evidence: string[]; // Verified resume tokens supporting this rewrite
  needsUserNumber: boolean;
  placeholders: string[]; // e.g. ["[X%]", "[N users]"]
  applied?: boolean;
}

export interface SectionOptimizationResult {
  section: OptimizationSectionKey;
  title: string;
  status: 'completed' | 'unchanged' | 'failed';
  bullets: OptimizedBullet[];
  originalText?: string;
  newText?: string;
  error?: string;
}

export type OptimizationJobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface OptimizationSharedContext {
  candidateName: string;
  candidateTitle: string;
  primaryTechnologies: string[];
  seniorityLevel: string;
  totalYearsEstimate: number;
  mode: FullOptimizationMode;
  targetJob?: {
    id?: string;
    title: string;
    company: string;
    description: string;
    supportedKeywords: string[];
    unsupportedGaps: string[];
  };
}

export interface FullOptimizationJob {
  jobId: string;
  userId: string;
  resumeId?: string;
  mode: FullOptimizationMode;
  targetJobId?: string;
  targetJobTitle?: string;
  targetCompany?: string;
  targetJobDescription?: string;
  status: OptimizationJobStatus;
  progressPercent: number;
  currentSection?: OptimizationSectionKey;
  completedSections: OptimizationSectionKey[];
  sections: Record<OptimizationSectionKey, SectionOptimizationResult>;
  allBullets: OptimizedBullet[];
  unsupportedJobGaps: string[];
  keywordsAdded: string[];
  placeholdersCount: number;
  initialAtsScore: number;
  estimatedOptimizedScore: number;
  scoreDelta: number;
  initialMatchScore?: number;
  estimatedOptimizedMatchScore?: number;
  matchScoreDelta?: number;
  originalResume: CanonicalResume;
  optimizedResume: CanonicalResume;
  error?: string;
  startedAt: number;
  finishedAt?: number;
  isCancelled?: boolean;
}

export interface FullOptimizationRequest {
  resumeId?: string;
  mode?: FullOptimizationMode;
  jobId?: string;
  canonicalResume?: CanonicalResume;
  targetJobDescription?: string;
  targetJobTitle?: string;
  targetCompany?: string;
}

export interface FullOptimizationStreamEvent {
  type:
    | 'job_started'
    | 'section_started'
    | 'section_progress'
    | 'section_completed'
    | 'score_updated'
    | 'job_completed'
    | 'job_failed'
    | 'job_cancelled';
  jobId: string;
  progressPercent: number;
  currentSection?: OptimizationSectionKey;
  sectionResult?: SectionOptimizationResult;
  stats?: {
    bulletsCount: number;
    placeholdersCount: number;
    scoreDelta: number;
    atsScore: number;
  };
  error?: string;
  data?: any;
}
