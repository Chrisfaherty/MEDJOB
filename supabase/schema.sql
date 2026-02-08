-- MedMatch-IE Database Schema
-- For Irish Medical Interns transitioning to SHO/Registrar roles

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Job Grades enum
CREATE TYPE nchd_grade AS ENUM (
  'SHO',
  'REGISTRAR',
  'SPECIALIST_REGISTRAR'
);

-- Specialties enum
CREATE TYPE specialty_type AS ENUM (
  'GENERAL_MEDICINE',
  'GENERAL_SURGERY',
  'EMERGENCY_MEDICINE',
  'ANAESTHETICS',
  'PAEDIATRICS',
  'OBSTETRICS_GYNAECOLOGY',
  'PSYCHIATRY',
  'RADIOLOGY',
  'PATHOLOGY',
  'ORTHOPAEDICS',
  'CARDIOLOGY',
  'RESPIRATORY',
  'GASTROENTEROLOGY',
  'ENDOCRINOLOGY',
  'NEUROLOGY',
  'DERMATOLOGY',
  'ONCOLOGY',
  'UROLOGY',
  'ENT',
  'OPHTHALMOLOGY',
  'OTHER'
);

-- Scheme type enum
CREATE TYPE scheme_type AS ENUM (
  'TRAINING_BST',
  'TRAINING_HST',
  'NON_TRAINING_SERVICE',
  'STAND_ALONE'
);

-- Hospital Group enum
CREATE TYPE hospital_group AS ENUM (
  'IEHG',
  'DMHG',
  'RCSI',
  'SAOLTA',
  'SSWHG',
  'MWHG',
  'UL'
);

-- Application status enum
CREATE TYPE application_status AS ENUM (
  'NOT_APPLIED',
  'APPLIED',
  'INTERVIEW_OFFERED',
  'SHORTLISTED',
  'REJECTED',
  'ACCEPTED'
);

-- Jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Info
  title TEXT NOT NULL,
  grade nchd_grade NOT NULL,
  specialty specialty_type NOT NULL,
  scheme_type scheme_type NOT NULL,

  -- Hospital/Location
  hospital_id TEXT NOT NULL,
  hospital_name TEXT NOT NULL,
  hospital_group hospital_group NOT NULL,
  county TEXT NOT NULL,

  -- Job Details
  start_date DATE NOT NULL DEFAULT '2026-07-13',
  duration_months INTEGER,
  rotational_detail TEXT,
  contract_type TEXT,

  -- Application Details
  application_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  application_url TEXT,
  job_spec_pdf_url TEXT,

  -- Contacts
  informal_enquiries_email TEXT,
  informal_enquiries_name TEXT,
  clinical_lead TEXT,

  -- Source
  source TEXT NOT NULL, -- 'NRS', 'REZOOMO', 'DIRECT_HOSPITAL'
  external_id TEXT,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_scraped_at TIMESTAMP WITH TIME ZONE,

  -- Full text search
  search_vector tsvector,

  CONSTRAINT unique_external_job UNIQUE (source, external_id)
);

-- User Applications table
CREATE TABLE user_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- Will integrate with Supabase Auth later

  status application_status DEFAULT 'NOT_APPLIED',
  notes TEXT,
  interview_date TIMESTAMP WITH TIME ZONE,

  applied_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_application UNIQUE (job_id, user_id)
);

-- User Preferences table
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY,

  -- Filter preferences
  preferred_specialties specialty_type[],
  preferred_hospital_groups hospital_group[],
  preferred_counties TEXT[],
  preferred_scheme_types scheme_type[],

  -- Notification preferences
  deadline_reminder_hours INTEGER[] DEFAULT ARRAY[48, 24, 2], -- Hours before deadline
  email_notifications BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scraping Log table
CREATE TABLE scraping_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL,
  status TEXT NOT NULL, -- 'SUCCESS', 'FAILURE', 'PARTIAL'
  jobs_found INTEGER,
  jobs_new INTEGER,
  jobs_updated INTEGER,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER
);

-- Indexes for performance
CREATE INDEX idx_jobs_deadline ON jobs(application_deadline);
CREATE INDEX idx_jobs_hospital_group ON jobs(hospital_group);
CREATE INDEX idx_jobs_specialty ON jobs(specialty);
CREATE INDEX idx_jobs_grade ON jobs(grade);
CREATE INDEX idx_jobs_active ON jobs(is_active);
CREATE INDEX idx_user_applications_user ON user_applications(user_id);
CREATE INDEX idx_user_applications_job ON user_applications(job_id);
CREATE INDEX idx_user_applications_status ON user_applications(status);

-- Full-text search index
CREATE INDEX idx_jobs_search ON jobs USING GIN(search_vector);

-- Function to update search vector
CREATE OR REPLACE FUNCTION jobs_search_vector_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.hospital_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.rotational_detail, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.clinical_lead, '')), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Trigger to automatically update search vector
CREATE TRIGGER jobs_search_vector_update
  BEFORE INSERT OR UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION jobs_search_vector_trigger();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_applications_updated_at BEFORE UPDATE ON user_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for upcoming deadlines (jobs closing within 7 days)
CREATE OR REPLACE VIEW upcoming_deadlines AS
SELECT
  j.*,
  EXTRACT(EPOCH FROM (j.application_deadline - NOW())) / 3600 AS hours_until_deadline,
  ua.status AS user_status,
  ua.user_id
FROM jobs j
LEFT JOIN user_applications ua ON j.id = ua.job_id
WHERE
  j.is_active = true
  AND j.application_deadline > NOW()
  AND j.application_deadline < NOW() + INTERVAL '7 days'
ORDER BY j.application_deadline ASC;

-- Sample data for development (July 2026 rotation)
INSERT INTO jobs (
  title, grade, specialty, scheme_type,
  hospital_id, hospital_name, hospital_group, county,
  start_date, duration_months, rotational_detail,
  application_deadline, application_url, source, external_id
) VALUES
(
  'Medical SHO - 6 Month Rotation (Cardiology/Respiratory)',
  'SHO',
  'GENERAL_MEDICINE',
  'NON_TRAINING_SERVICE',
  'mater',
  'Mater Misericordiae University Hospital',
  'IEHG',
  'Dublin',
  '2026-07-13',
  6,
  '3 months Cardiology, 3 months Respiratory Medicine',
  '2026-04-15 17:00:00+00',
  'https://www.rezoomo.com/job/12345',
  'REZOOMO',
  'REZOOMO-12345'
),
(
  'Basic Specialist Training in Emergency Medicine',
  'SHO',
  'EMERGENCY_MEDICINE',
  'TRAINING_BST',
  'beaumont',
  'Beaumont Hospital',
  'RCSI',
  'Dublin',
  '2026-07-13',
  24,
  'Structured 2-year BST rotation including ED, ICU, Anaesthetics',
  '2026-03-31 17:00:00+00',
  'https://www.nrs.hse.ie/campaigns/emergency-medicine-bst-2026',
  'NRS',
  'NRS-EM-BST-2026'
);

-- Grant permissions (adjust based on your RLS policies)
-- ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_applications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
