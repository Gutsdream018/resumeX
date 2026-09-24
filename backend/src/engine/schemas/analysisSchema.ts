import { z } from 'zod';
import {
  StructuredResume,
  CategoryScores,
  AtsCategoryScores,
  BulletPointImprovement,
  StructuredRecommendation,
  JobMatchResponse,
} from '../../models/resume.types.js';

import { DiagnosticOutput } from '../diagnostic/types.js';

export type CareerLevel = 'student' | 'entry' | 'mid' | 'senior' | 'executive';

export interface ScoreCategoryContribution {
  score: number;
  weight: number;
  contribution: number;
  reason: string;
  strengths: string[];
  deductions: string[];
  warnings?: string[];
}

export interface DetailedScoreBreakdown {
  atsReadability: ScoreCategoryContribution;
  keywordRelevance: ScoreCategoryContribution;
  experience: ScoreCategoryContribution;
  projects: ScoreCategoryContribution;
  formatting: ScoreCategoryContribution;
  education: ScoreCategoryContribution;
  achievements: ScoreCategoryContribution;
}

export interface KeywordCoverageDetails {
  keywordScore: number;
  coverage: number;
  requiredCoverage?: number;
  technicalCoverage?: number;
  preferredCoverage?: number;
  matched: string[];
  missing: string[];
  partial: Array<{ keyword: string; matchedWith: string }>;
  byCategory?: {
    technical: string[];
    tools: string[];
    languages: string[];
    soft: string[];
    domain: string[];
  };
}

export interface SectionQualityItem {
  score: number;
  strengths: string[];
  issues: string[];
  signals: string[];
}

export interface DetailedSectionQualities {
  summary: SectionQualityItem;
  experience: SectionQualityItem;
  projects: SectionQualityItem;
  skills: SectionQualityItem;
  education: SectionQualityItem;
  certifications: SectionQualityItem;
  achievements: SectionQualityItem;
}

export interface ComprehensiveAnalysisResult {
  status: 'completed' | 'needs_ocr' | 'error';
  resumeId: string;
  mode: 'general' | 'job-match';
  careerLevel: CareerLevel;
  confidence: number; // 0.0 to 1.0

  score: {
    overall: number;
    atsReadability: number;
    keywordRelevance: number;
    experience: number;
    projects: number;
    formatting: number;
    education: number;
    achievements: number;
    // Backwards-compatible aliases
    atsCompatibility?: number;
    ats?: number;
    keywords?: number;
  };

  breakdown: DetailedScoreBreakdown;
  keywords: KeywordCoverageDetails;
  sections: Record<string, boolean>;
  sectionQualities: DetailedSectionQualities;

  strengths: string[];
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
  detailedRecommendations: StructuredRecommendation[];

  aiAnalysis: {
    strengths: string[];
    criticalIssues: string[];
    warnings: string[];
    recommendations: StructuredRecommendation[];
    semanticStrength?: number;
    experienceQuality?: number;
    projectQuality?: number;
    summaryQuality?: number;
    museStatus: 'success' | 'fallback';
  };

  structuredResume: StructuredResume;
  canonicalResume?: any;
  critique?: any;
  diagnostic?: DiagnosticOutput;
  jobMatch: JobMatchResponse | null;

  // Frontend backwards-compatibility properties
  overall_score: number;
  category_scores: CategoryScores;
  score_grade: string;
  critical_flaws: string[];
  minor_flaws: string[];
  ats_issues: string[];
  missing_information: string[];
  missingKeywords: string[];
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
    analysis_mode: 'ai_live' | 'hybrid_engine';
    analyzed_at: string;
  };
}
