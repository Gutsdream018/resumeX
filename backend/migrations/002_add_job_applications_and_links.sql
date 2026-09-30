-- ============================================================================
-- Migration: 002_add_job_applications_and_links.sql
-- Description: Tables for Application Tracking, Click Analytics, and Link Resolution
-- ============================================================================

-- 1. Enhance Jobs Table with Final Resolved URLs and Link Status
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS final_url TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS apply_host VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_ats BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS ats_name VARCHAR(64);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS link_status VARCHAR(32) DEFAULT 'ok';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMP WITH TIME ZONE;

-- 2. Application Tracker Table
CREATE TABLE IF NOT EXISTS job_applications (
  id VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(128) NOT NULL,
  resume_id VARCHAR(128) NOT NULL,
  job_id VARCHAR(128) NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  apply_url TEXT NOT NULL,
  final_url TEXT,
  apply_host VARCHAR(255),
  is_ats BOOLEAN DEFAULT FALSE,
  tailored_resume_id VARCHAR(128),
  status VARCHAR(32) NOT NULL DEFAULT 'saved', -- 'saved', 'tailored', 'applied', 'interview', 'offer', 'rejected'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_job_application UNIQUE (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_job_applications_user ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);

-- 3. Job Click Events Analytics Table
CREATE TABLE IF NOT EXISTS job_clicks (
  id VARCHAR(128) PRIMARY KEY,
  job_id VARCHAR(128) NOT NULL,
  user_id VARCHAR(128) NOT NULL,
  apply_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_clicks_job ON job_clicks(job_id);
CREATE INDEX IF NOT EXISTS idx_job_clicks_user ON job_clicks(user_id);

-- 4. User Job Interactions (Saved & Hidden)
CREATE TABLE IF NOT EXISTS user_job_interactions (
  user_id VARCHAR(128) NOT NULL,
  job_id VARCHAR(128) NOT NULL,
  is_saved BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, job_id)
);
