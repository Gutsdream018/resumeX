export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
}

export interface EducationItem {
  institution: string;
  degree: string;
  field?: string;
  graduationDate?: string;
  gpa?: string;
  highlights?: string[];
}

export interface ExperienceItem {
  company: string;
  role: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  bullets: string[];
}

export interface ProjectItem {
  name: string;
  description?: string;
  technologies: string[];
  bullets: string[];
}

export interface SkillsStructure {
  technical: string[];
  soft: string[];
  tools: string[];
  languages: string[];
}

export interface StructuredResume {
  contact: ContactInfo;
  summary: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  skills: SkillsStructure;
  certifications: string[];
  achievements: string[];
  other: string[];
}

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

export interface AtsCategoryScores {
  atsCompatibility: number;
  keywordRelevance: number;
  experience: number;
  projects: number;
  formatting: number;
  education: number;
  achievements: number;
}

export interface BulletPointImprovement {
  original: string;
  problem: string;
  improved: string;
  why_better: string;
}

export interface StructuredRecommendation {
  section: string;
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  explanation: string;
  currentText: string;
  suggestedText: string;
}

export interface KeywordMatchResult {
  matched: string[];
  missing: string[];
  partialMatches: Array<{ keyword: string; matchedWith: string }>;
  matchPercentage: number;
}

export interface JobMatchResponse {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  missingKeywords?: string[];
  recommendations: string[];
  breakdown?: {
    skillMatch: number;
    experienceRelevance: number;
    keywordMatch: number;
    educationRelevance: number;
  };
}

export interface FinalAnalysisObject {
  status?: string;
  resumeId: string;
  score: {
    overall: number;
    atsCompatibility: number;
    keywordRelevance: number;
    experience: number;
    projects: number;
    formatting: number;
    education: number;
    achievements: number;
    ats?: number;
    keywords?: number;
  };
  strengths: string[];
  criticalIssues: string[];
  warnings: string[];
  missingKeywords: string[];
  sections: Record<string, boolean>;
  recommendations: string[];
  detailedRecommendations?: StructuredRecommendation[];
  aiAnalysis?: {
    strengths?: string[];
    criticalIssues?: string[];
    warnings?: string[];
    recommendations?: StructuredRecommendation[];
    museStatus?: 'success' | 'fallback';
  };
  structuredResume: StructuredResume;
  jobMatch: JobMatchResponse | null;

  // Frontend backwards-compatibility fields
  overall_score: number;
  category_scores: CategoryScores;
  score_grade: string;
  critical_flaws: string[];
  minor_flaws: string[];
  ats_issues: string[];
  missing_information: string[];
  bullet_point_improvements: BulletPointImprovement[];
  professionalism_summary: string;
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
    analysis_mode: 'ai_live' | 'heuristic_engine';
    analyzed_at: string;
  };
}
