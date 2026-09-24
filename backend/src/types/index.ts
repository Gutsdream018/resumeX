export interface CategoryScores {
  ats: number;             // ATS Compatibility — 20%
  content: number;         // Content Quality — 15%
  skills: number;          // Skills Relevance — 15%
  experience: number;      // Work Experience — 15%
  impact: number;          // Achievements / Measurable Impact — 15%
  formatting: number;      // Formatting & Structure — 10%
  grammar: number;         // Grammar & Language — 5%
  professionalism: number; // Professionalism — 5%
}

export interface BulletPointImprovement {
  original: string;
  problem: string;
  improved: string;
  why_better: string;
}

export interface ResumeAnalysisResult {
  overall_score: number;
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

export interface RawAIResponse {
  overall_score?: number;
  category_scores: CategoryScores;
  strengths: string[];
  critical_flaws: string[];
  minor_flaws: string[];
  ats_issues: string[];
  missing_information: string[];
  recommendations: string[];
  bullet_point_improvements: BulletPointImprovement[];
  professionalism_summary?: string;
}

export interface SampleResume {
  id: string;
  title: string;
  role: string;
  experience_level: string;
  expected_score_range: string;
  description: string;
  content: string;
}

// Future-ready Job Description matching interfaces
export interface JobMatchRequest {
  resume_text: string;
  job_description: string;
}

export interface JobMatchResult {
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  missing_keywords: string[];
  relevant_experience_highlights: string[];
  alignment_recommendations: string[];
}
