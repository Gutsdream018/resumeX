-- ============================================================================
-- Migration: 001_create_job_discovery_tables.sql
-- Description: Core tables for ResumeX Job Match & Discovery Feature
-- ============================================================================

-- 1. Resume Profiles & Search Preferences
CREATE TABLE IF NOT EXISTS resume_profiles (
  user_id VARCHAR(128) NOT NULL,
  resume_id VARCHAR(128) NOT NULL,
  profile_json JSON NOT NULL,
  preferences JSON NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, resume_id)
);

CREATE INDEX IF NOT EXISTS idx_resume_profiles_user ON resume_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_profiles_resume ON resume_profiles(resume_id);

-- 2. Cached Unified Jobs
CREATE TABLE IF NOT EXISTS jobs (
  id VARCHAR(128) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  is_remote BOOLEAN DEFAULT FALSE,
  salary_min NUMERIC(12, 2),
  salary_max NUMERIC(12, 2),
  description TEXT NOT NULL,
  source VARCHAR(64) NOT NULL,
  apply_url TEXT NOT NULL,
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  normalized_key VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_jobs_normalized_key ON jobs(normalized_key);
CREATE INDEX IF NOT EXISTS idx_jobs_cached_at ON jobs(cached_at);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at DESC);

-- 3. Precomputed Job Matches
CREATE TABLE IF NOT EXISTS job_matches (
  id VARCHAR(128) PRIMARY KEY,
  resume_version VARCHAR(128) NOT NULL,
  job_id VARCHAR(128) NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL,
  matched_skills JSON NOT NULL,
  missing_requirements JSON NOT NULL,
  recommendations JSON NOT NULL,
  limited_description BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_resume_job UNIQUE (resume_version, job_id)
);

CREATE INDEX IF NOT EXISTS idx_job_matches_resume ON job_matches(resume_version);
CREATE INDEX IF NOT EXISTS idx_job_matches_score ON job_matches(overall_score DESC);

-- 4. Tailored Resume Variants
CREATE TABLE IF NOT EXISTS tailored_resumes (
  id VARCHAR(128) PRIMARY KEY,
  original_resume_id VARCHAR(128) NOT NULL,
  job_id VARCHAR(128) NOT NULL,
  job_title VARCHAR(255),
  company VARCHAR(255),
  content JSON NOT NULL,
  target_requirements JSON,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tailored_resumes_orig ON tailored_resumes(original_resume_id);
