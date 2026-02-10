-- =====================================================
-- MedJob Supabase Database Schema
-- Version: 1.0.0
-- Date: 2026-02-08
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- 1. Jobs Table
-- Stores all NCHD job listings scraped from HSE, Rezoomo, and hospital sites
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Info
  title TEXT NOT NULL,
  grade TEXT NOT NULL CHECK (grade IN ('SHO', 'REGISTRAR', 'SPECIALIST_REGISTRAR')),
  specialty TEXT NOT NULL,
  scheme_type TEXT NOT NULL CHECK (scheme_type IN ('TRAINING_BST', 'TRAINING_HST', 'NON_TRAINING_SERVICE', 'STAND_ALONE')),

  -- Hospital/Location
  hospital_id TEXT NOT NULL,
  hospital_name TEXT NOT NULL,
  hospital_group TEXT NOT NULL CHECK (hospital_group IN ('IEHG', 'DMHG', 'RCSI', 'SAOLTA', 'SSWHG', 'MWHG', 'UL')),
  county TEXT NOT NULL,

  -- Job Details
  start_date DATE NOT NULL,
  duration_months INTEGER,
  rotational_detail TEXT,
  contract_type TEXT,

  -- Application Details
  application_deadline TIMESTAMPTZ NOT NULL,
  application_url TEXT,
  job_spec_pdf_url TEXT,

  -- Contacts
  informal_enquiries_email TEXT,
  informal_enquiries_name TEXT,
  clinical_lead TEXT,
  medical_manpower_email TEXT,
  informal_contact_email TEXT,

  -- Hospital Tier & Match Probability
  historical_centile_tier TEXT CHECK (historical_centile_tier IN ('TOP_TIER', 'MID_TIER', 'SAFETY_NET')),

  -- Source tracking
  source TEXT NOT NULL CHECK (source IN ('NRS', 'REZOOMO', 'DIRECT_HOSPITAL')),
  external_id TEXT, -- For deduplication with external sources

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_scraped_at TIMESTAMPTZ,

  -- Search optimization (full-text search vector)
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(hospital_name, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(county, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(clinical_lead, '')), 'D')
  ) STORED,

  -- Unique constraint for deduplication
  CONSTRAINT unique_job_posting UNIQUE (title, hospital_name, application_deadline)
);

-- 2. User Profiles Table
-- Extends Supabase auth.users with additional profile information
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),

  -- User metadata
  centile INTEGER CHECK (centile >= 0 AND centile <= 100),
  current_grade TEXT CHECK (current_grade IN ('INTERN', 'SHO', 'REGISTRAR', 'SPECIALIST_REGISTRAR')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Applications Table
-- Tracks user application status for each job
CREATE TABLE IF NOT EXISTS user_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'NOT_APPLIED' CHECK (
    status IN ('NOT_APPLIED', 'APPLIED', 'INTERVIEW_OFFERED', 'SHORTLISTED', 'REJECTED', 'ACCEPTED')
  ),

  notes TEXT,
  interview_date TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one application per user per job
  CONSTRAINT unique_user_job_application UNIQUE (user_id, job_id)
);

-- 4. User Favorites Table
-- Stores user's saved/favorited jobs
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one favorite per user per job
  CONSTRAINT unique_user_favorite UNIQUE (user_id, job_id)
);

-- 5. User Preferences Table
-- Stores user filter preferences and notification settings
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Filter preferences
  preferred_specialties TEXT[], -- Array of specialty types
  preferred_hospital_groups TEXT[], -- Array of hospital groups
  preferred_counties TEXT[], -- Array of counties
  preferred_scheme_types TEXT[], -- Array of scheme types

  -- Notification preferences
  deadline_reminder_hours INTEGER[] DEFAULT ARRAY[168, 48, 24], -- 7 days, 2 days, 1 day
  email_notifications BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Scraping Logs Table
-- Tracks scraper runs for monitoring and debugging
CREATE TABLE IF NOT EXISTS scraping_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FAILURE', 'PARTIAL')),

  -- Statistics
  jobs_found INTEGER,
  jobs_new INTEGER,
  jobs_updated INTEGER,

  -- Error tracking
  error_message TEXT,

  -- Timing
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Jobs table indexes
CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_jobs_deadline ON jobs(application_deadline) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_jobs_specialty ON jobs(specialty) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_jobs_hospital_group ON jobs(hospital_group) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_jobs_county ON jobs(county) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_jobs_source_external ON jobs(source, external_id);
CREATE INDEX IF NOT EXISTS idx_jobs_search_vector ON jobs USING GIN(search_vector);

-- User applications indexes
CREATE INDEX IF NOT EXISTS idx_user_applications_user ON user_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_applications_job ON user_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_user_applications_status ON user_applications(status);

-- User favorites indexes
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_job ON user_favorites(job_id);

-- Scraping logs indexes
CREATE INDEX IF NOT EXISTS idx_scraping_logs_source ON scraping_logs(source);
CREATE INDEX IF NOT EXISTS idx_scraping_logs_started ON scraping_logs(started_at DESC);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_applications_updated_at ON user_applications;
CREATE TRIGGER update_user_applications_updated_at
  BEFORE UPDATE ON user_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    CASE
      WHEN NEW.email IN ('admin@medjob.ie', 'chrismactom@gmail.com') THEN 'admin'
      ELSE 'user'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_logs ENABLE ROW LEVEL SECURITY;

-- ========== JOBS POLICIES ==========

-- Anyone can view active jobs
DROP POLICY IF EXISTS "Anyone can view active jobs" ON jobs;
CREATE POLICY "Anyone can view active jobs"
  ON jobs FOR SELECT
  USING (is_active = true);

-- Only admins can insert jobs
DROP POLICY IF EXISTS "Admins can insert jobs" ON jobs;
CREATE POLICY "Admins can insert jobs"
  ON jobs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Only admins can update jobs
DROP POLICY IF EXISTS "Admins can update jobs" ON jobs;
CREATE POLICY "Admins can update jobs"
  ON jobs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Only admins can delete jobs (soft delete by setting is_active = false)
DROP POLICY IF EXISTS "Admins can delete jobs" ON jobs;
CREATE POLICY "Admins can delete jobs"
  ON jobs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ========== USER PROFILES POLICIES ==========

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles AS up
      WHERE up.id = auth.uid()
      AND up.role = 'admin'
    )
  );

-- Users can update their own profile (except role)
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      -- Either not changing role, or user is admin
      (role = (SELECT role FROM user_profiles WHERE id = auth.uid()))
      OR
      EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- Admins can update any profile
DROP POLICY IF EXISTS "Admins can update any profile" ON user_profiles;
CREATE POLICY "Admins can update any profile"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles AS up
      WHERE up.id = auth.uid()
      AND up.role = 'admin'
    )
  );

-- Admins can delete users
DROP POLICY IF EXISTS "Admins can delete users" ON user_profiles;
CREATE POLICY "Admins can delete users"
  ON user_profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles AS up
      WHERE up.id = auth.uid()
      AND up.role = 'admin'
    )
  );

-- ========== USER APPLICATIONS POLICIES ==========

-- Users can view their own applications
DROP POLICY IF EXISTS "Users can view own applications" ON user_applications;
CREATE POLICY "Users can view own applications"
  ON user_applications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own applications
DROP POLICY IF EXISTS "Users can insert own applications" ON user_applications;
CREATE POLICY "Users can insert own applications"
  ON user_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own applications
DROP POLICY IF EXISTS "Users can update own applications" ON user_applications;
CREATE POLICY "Users can update own applications"
  ON user_applications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own applications
DROP POLICY IF EXISTS "Users can delete own applications" ON user_applications;
CREATE POLICY "Users can delete own applications"
  ON user_applications FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all applications
DROP POLICY IF EXISTS "Admins can view all applications" ON user_applications;
CREATE POLICY "Admins can view all applications"
  ON user_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ========== USER FAVORITES POLICIES ==========

-- Users can view their own favorites
DROP POLICY IF EXISTS "Users can view own favorites" ON user_favorites;
CREATE POLICY "Users can view own favorites"
  ON user_favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own favorites
DROP POLICY IF EXISTS "Users can insert own favorites" ON user_favorites;
CREATE POLICY "Users can insert own favorites"
  ON user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
DROP POLICY IF EXISTS "Users can delete own favorites" ON user_favorites;
CREATE POLICY "Users can delete own favorites"
  ON user_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ========== USER PREFERENCES POLICIES ==========

-- Users can view their own preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- ========== SCRAPING LOGS POLICIES ==========

-- Admins can view all scraping logs
DROP POLICY IF EXISTS "Admins can view scraping logs" ON scraping_logs;
CREATE POLICY "Admins can view scraping logs"
  ON scraping_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Admins can insert scraping logs
DROP POLICY IF EXISTS "Admins can insert scraping logs" ON scraping_logs;
CREATE POLICY "Admins can insert scraping logs"
  ON scraping_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- =====================================================
-- HELPER FUNCTIONS FOR APPLICATION LAYER
-- =====================================================

-- Function to get jobs with user application status
CREATE OR REPLACE FUNCTION get_jobs_with_user_status(p_user_id UUID)
RETURNS TABLE (
  job_data JSONB,
  application_status TEXT,
  is_favorite BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_jsonb(j.*) AS job_data,
    ua.status AS application_status,
    EXISTS(SELECT 1 FROM user_favorites uf WHERE uf.user_id = p_user_id AND uf.job_id = j.id) AS is_favorite
  FROM jobs j
  LEFT JOIN user_applications ua ON ua.job_id = j.id AND ua.user_id = p_user_id
  WHERE j.is_active = true
  ORDER BY j.application_deadline ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get application statistics for a user
CREATE OR REPLACE FUNCTION get_application_stats(p_user_id UUID)
RETURNS TABLE (
  total BIGINT,
  applied BIGINT,
  interview BIGINT,
  shortlisted BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'APPLIED') AS applied,
    COUNT(*) FILTER (WHERE status = 'INTERVIEW_OFFERED') AS interview,
    COUNT(*) FILTER (WHERE status = 'SHORTLISTED') AS shortlisted
  FROM user_applications
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE jobs IS 'Stores all NCHD job listings scraped from various sources';
COMMENT ON TABLE user_profiles IS 'Extended user profile information beyond Supabase auth.users';
COMMENT ON TABLE user_applications IS 'Tracks user application status for each job';
COMMENT ON TABLE user_favorites IS 'User saved/favorited jobs';
COMMENT ON TABLE user_preferences IS 'User filter preferences and notification settings';
COMMENT ON TABLE scraping_logs IS 'Logs all scraper runs for monitoring';

COMMENT ON COLUMN jobs.search_vector IS 'Generated full-text search vector for efficient searching';
COMMENT ON COLUMN jobs.external_id IS 'External source identifier for deduplication';
COMMENT ON COLUMN user_profiles.centile IS 'User HSE centile score (0-100)';
COMMENT ON COLUMN user_applications.status IS 'Application status: NOT_APPLIED, APPLIED, INTERVIEW_OFFERED, SHORTLISTED, REJECTED, ACCEPTED';

-- =====================================================
-- INITIAL SETUP COMPLETE
-- =====================================================

-- This schema provides:
-- ✅ Complete table structure for MedJob
-- ✅ Row Level Security policies for data protection
-- ✅ Full-text search support
-- ✅ Automatic user profile creation on signup
-- ✅ Admin role assignment for configured emails
-- ✅ Comprehensive indexes for performance
-- ✅ Helper functions for efficient queries
-- ✅ Audit timestamps with automatic updates
