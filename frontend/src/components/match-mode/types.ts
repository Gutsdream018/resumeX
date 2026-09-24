export type MatchStatus = 'MATCHED' | 'PARTIAL' | 'MISSING';
export type EvidenceStrength = 'strong' | 'moderate' | 'weak' | 'no_evidence';
export type RequirementImportance = 'MUST_HAVE' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface RequirementMatchItem {
  id: string;
  requirementText: string;
  category: string;
  importance: RequirementImportance;
  status: MatchStatus;
  evidenceStrength: EvidenceStrength;
  evidenceQuote?: string;
  sourceSection?: 'skills' | 'experience' | 'education' | 'certifications' | 'projects' | 'summary' | 'other';
  confidence: 'High' | 'Medium' | 'Low';
  whyItMatters: string;
  actionRecommendation?: string;
  suggestedSection?: string;
}

export interface ContradictionItem {
  id: string;
  area: 'Seniority' | 'Location' | 'Education' | 'Experience Duration' | 'Certification';
  jobExpectation: string;
  resumeEvidence: string;
  severity: 'high' | 'medium' | 'low';
  explanation: string;
}

export interface RelevantExperienceItem {
  id: string;
  title: string;
  companyOrContext: string;
  relevanceScore: number;
  matchingKeywords: string[];
  evidenceSummary: string;
}

export interface SkillMatchItem {
  id: string;
  name: string;
  status: 'matched' | 'partial' | 'missing';
  importance?: 'high' | 'medium' | 'low';
  context?: string;
  semanticNote?: string;
  evidenceInResume?: string;
}

export interface KeywordAlignmentItem {
  id: string;
  keyword: string;
  status: 'found' | 'weak' | 'missing';
  jdFrequency: number;
  resumeFrequency: number;
  whyItMatters: string;
}

export interface ExperienceAlignmentItem {
  id: string;
  requirement: string;
  resumeEvidence: string;
  matchLevel: 'strong' | 'moderate' | 'weak';
  recruiterInsight: string;
}

export interface RecruiterGapItem {
  id: string;
  title: string;
  whyItMatters: string;
  suggestedAdditions: string[];
  severity: 'critical' | 'moderate' | 'minor';
}

export interface BulletImprovementItem {
  id: string;
  targetRoleOrSkill: string;
  originalBullet: string;
  suggestedBullet: string;
  rationale: string;
}

export interface MatchBreakdownCategory {
  id: string;
  name: string;
  score: number;
  explanation: string;
  evidence: string;
}

export interface JobSummaryInfo {
  targetRole: string;
  experienceLevel: string;
  domain?: string;
  coreSkills: string[];
  keyResponsibilities: string[];
  dealbreakers?: string[];
  educationSummary?: string;
  locationRequirement?: string;
}

export interface RecommendationItem {
  id: string;
  step: number;
  title: string;
  description: string;
  impactScore: number;
  category: string;
  targetSection?: string;
  missingElement?: string;
  suggestedAction?: string;
}

export interface JobMatchData {
  jobTitle: string;
  companyName?: string;
  location?: string;
  overallScore: number;
  potentialScore: number;
  alignmentLevel: 'Strong Alignment' | 'Moderate Alignment' | 'Low Alignment';
  alignmentSummary: string;
  keyStats: {
    matchedSkillsCount: number;
    totalSkillsRequired: number;
    keywordCoveragePercent: number;
    missingMustHavesCount: number;
  };
  breakdown: MatchBreakdownCategory[];
  skills: SkillMatchItem[];
  keywords: KeywordAlignmentItem[];
  experienceAlignment: ExperienceAlignmentItem[];
  recruiterGaps: RecruiterGapItem[];
  recommendations: RecommendationItem[];
  bulletImprovements: BulletImprovementItem[];
  jobSummary: JobSummaryInfo;
  strongMatches?: RequirementMatchItem[];
  partialMatches?: RequirementMatchItem[];
  missingRequirements?: RequirementMatchItem[];
  contradictions?: ContradictionItem[];
  relevantExperiences?: RelevantExperienceItem[];
  requirementMatrix?: RequirementMatchItem[];
  signals?: {
    atsScoreComparison?: {
      atsScore: number;
      matchScore: number;
      distinctionExplanation: string;
    };
    hiringProbabilityDisclaimer?: string;
  };
  confidence?: {
    overall: 'High' | 'Medium' | 'Low';
    semanticConfidence?: number;
  };
}

export interface MatchAnalysisStage {
  id: string;
  label: string;
  icon?: string;
}
