// ============================================================================
// Types for Job Discovery & Match Architecture
// ============================================================================

export type SeniorityLevel = 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive';

export interface EducationSummary {
  highestDegree: string;
  field?: string;
  institution?: string;
}

export interface ResumeProfile {
  candidateName?: string;
  skills: string[];
  titles: string[];
  yearsExperience: number;
  education: EducationSummary;
  industries: string[];
  seniority: SeniorityLevel;
  location?: string;
  rawSummary?: string;
}

export interface JobPreferences {
  targetRole: string;
  adjacentRoles?: string[];
  location: string;
  workplaceType: 'remote' | 'hybrid' | 'onsite' | 'any';
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  countryCode?: string; // e.g. 'in' for India, 'us' for United States, 'gb' for UK
}

export interface StoredResumeProfile {
  userId: string;
  resumeId: string;
  profile: ResumeProfile;
  preferences: JobPreferences;
  createdAt: string;
  updatedAt: string;
}

export type LinkStatus = 'ok' | 'redirected' | 'dead' | 'unknown';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  isRemote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  source: string;
  applyUrl: string;
  finalUrl?: string;
  applyHost?: string;
  isAts?: boolean;
  atsName?: string;
  linkStatus?: LinkStatus;
  lastCheckedAt?: string;
  postedAt: string;
  cachedAt?: string;
  limitedDescription?: boolean;
}

export interface JobFilter {
  query?: string;
  location?: string;
  countryCode?: string;
  isRemote?: boolean;
  minSalary?: number;
  maxSalary?: number;
  page?: number;
  limit?: number;
}

export interface JobProvider {
  name: string;
  search(filter: JobFilter): Promise<Job[]>;
}

export interface ScoredJobMatch {
  job: Job;
  overallScore: number;
  potentialScore?: number;
  matchedSkills: string[];
  missingRequirements: {
    mustHave: string[];
    niceToHave: string[];
  };
  recommendations: Array<{
    title: string;
    suggestedAction: string;
    targetSection: string;
    whyItMatters: string;
  }>;
  limitedDescription: boolean;
  cached?: boolean;
  seniorityTier?: 'entry' | 'mid' | 'senior' | 'lead';
  matchTier?: 'strong' | 'worth_a_shot' | 'stretch';
  isSaved?: boolean;
  isHidden?: boolean;
}

export interface TailoredResumeRecord {
  id: string;
  originalResumeId: string;
  jobId: string;
  jobTitle?: string;
  company?: string;
  content: any;
  targetRequirements?: string[];
  createdAt: string;
}

export type ApplicationStatus = 'saved' | 'tailored' | 'applied' | 'interview' | 'offer' | 'rejected';

export interface JobApplication {
  id: string;
  userId: string;
  resumeId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  applyUrl: string;
  finalUrl?: string;
  applyHost?: string;
  isAts?: boolean;
  tailoredResumeId?: string;
  status: ApplicationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobClickEvent {
  id: string;
  jobId: string;
  userId: string;
  applyUrl: string;
  timestamp: string;
}
