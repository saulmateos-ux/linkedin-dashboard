-- Migration: Add profile background information
-- Date: 2025-10-26
-- Description: Store LinkedIn profile backgrounds including work experience, education, skills, certifications

-- ============================================================================
-- 1. ADD COLUMNS TO PROFILES TABLE
-- ============================================================================

-- Contact information
ALTER TABLE profiles
ADD COLUMN email TEXT,
ADD COLUMN phone TEXT,
ADD COLUMN location TEXT;

-- Profile details
ALTER TABLE profiles
ADD COLUMN summary TEXT,
ADD COLUMN skills JSONB DEFAULT '[]'::jsonb,
ADD COLUMN languages JSONB DEFAULT '[]'::jsonb,
ADD COLUMN certifications JSONB DEFAULT '[]'::jsonb,
ADD COLUMN honors_awards JSONB DEFAULT '[]'::jsonb;

-- Metadata
ALTER TABLE profiles
ADD COLUMN profile_scraped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN profile_data_version INTEGER DEFAULT 1;

-- Comments
COMMENT ON COLUMN profiles.email IS 'Primary email address extracted from LinkedIn profile';
COMMENT ON COLUMN profiles.phone IS 'Phone number if available';
COMMENT ON COLUMN profiles.location IS 'Current location (city, country)';
COMMENT ON COLUMN profiles.summary IS 'LinkedIn About/Summary section';
COMMENT ON COLUMN profiles.skills IS 'Array of skills as JSON objects: [{"name": "TypeScript", "endorsements": 45}]';
COMMENT ON COLUMN profiles.languages IS 'Array of languages as JSON objects: [{"name": "English", "proficiency": "Native"}]';
COMMENT ON COLUMN profiles.certifications IS 'Array of certifications as JSON objects: [{"name": "AWS Certified", "issuer": "Amazon", "issued_date": "2024-01"}]';
COMMENT ON COLUMN profiles.honors_awards IS 'Array of honors and awards';
COMMENT ON COLUMN profiles.profile_scraped_at IS 'Timestamp when profile background was last scraped';
COMMENT ON COLUMN profiles.profile_data_version IS 'Version number for tracking profile data updates';

-- ============================================================================
-- 2. CREATE WORK EXPERIENCE TABLE
-- ============================================================================

CREATE TABLE profile_experiences (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Company information
  company_name TEXT NOT NULL,
  company_url TEXT,
  company_logo_url TEXT,

  -- Position details
  title TEXT NOT NULL,
  employment_type TEXT, -- Full-time, Part-time, Contract, etc.
  location TEXT,

  -- Dates
  start_date TEXT, -- Store as text to handle formats like "Jan 2024" or "2024"
  end_date TEXT,   -- NULL if current position
  is_current BOOLEAN DEFAULT false,

  -- Details
  description TEXT,
  duration_months INTEGER, -- Calculated duration

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_profile_experiences_profile_id ON profile_experiences(profile_id);
CREATE INDEX idx_profile_experiences_company_name ON profile_experiences(company_name);
CREATE INDEX idx_profile_experiences_is_current ON profile_experiences(is_current);

-- Comments
COMMENT ON TABLE profile_experiences IS 'Work experience history for LinkedIn profiles';
COMMENT ON COLUMN profile_experiences.start_date IS 'Start date as text (e.g., "Jan 2024", "2024")';
COMMENT ON COLUMN profile_experiences.end_date IS 'End date as text, NULL if current position';
COMMENT ON COLUMN profile_experiences.is_current IS 'True if this is the current position';
COMMENT ON COLUMN profile_experiences.duration_months IS 'Total duration in months (calculated from dates)';

-- ============================================================================
-- 3. CREATE EDUCATION TABLE
-- ============================================================================

CREATE TABLE profile_education (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- School information
  school_name TEXT NOT NULL,
  school_url TEXT,
  school_logo_url TEXT,

  -- Degree details
  degree TEXT, -- e.g., "Bachelor of Science", "Master's", "MBA"
  field_of_study TEXT, -- e.g., "Computer Science", "Business Administration"

  -- Dates
  start_year TEXT, -- Store as text to handle various formats
  end_year TEXT,   -- NULL if currently enrolled

  -- Additional details
  grade TEXT, -- GPA or grade achieved
  activities TEXT, -- Clubs, sports, etc.
  description TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_profile_education_profile_id ON profile_education(profile_id);
CREATE INDEX idx_profile_education_school_name ON profile_education(school_name);

-- Comments
COMMENT ON TABLE profile_education IS 'Education history for LinkedIn profiles';
COMMENT ON COLUMN profile_education.start_year IS 'Start year as text';
COMMENT ON COLUMN profile_education.end_year IS 'End year as text, NULL if currently enrolled';

-- ============================================================================
-- 4. CREATE VIEWS FOR EASIER QUERYING
-- ============================================================================

-- View for complete profile data with latest experience
CREATE VIEW profile_complete AS
SELECT
  p.*,
  pe.company_name as current_company,
  pe.title as current_title,
  pe.location as current_location,
  (SELECT COUNT(*) FROM profile_experiences WHERE profile_id = p.id) as experience_count,
  (SELECT COUNT(*) FROM profile_education WHERE profile_id = p.id) as education_count
FROM profiles p
LEFT JOIN profile_experiences pe ON p.id = pe.profile_id AND pe.is_current = true;

COMMENT ON VIEW profile_complete IS 'Complete profile view with current position and counts';

-- ============================================================================
-- 5. VERIFICATION QUERIES
-- ============================================================================

-- Uncomment to verify after migration:

-- Check new columns
-- SELECT id, display_name, email, location,
--        jsonb_array_length(skills) as skill_count,
--        profile_scraped_at
-- FROM profiles
-- LIMIT 10;

-- Check tables exist
-- SELECT table_name, table_type
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('profile_experiences', 'profile_education');

-- Check view
-- SELECT * FROM profile_complete LIMIT 5;

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

-- To rollback this migration, run:
/*
DROP VIEW IF EXISTS profile_complete;
DROP TABLE IF EXISTS profile_education CASCADE;
DROP TABLE IF EXISTS profile_experiences CASCADE;

ALTER TABLE profiles
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS phone,
DROP COLUMN IF EXISTS location,
DROP COLUMN IF EXISTS summary,
DROP COLUMN IF EXISTS skills,
DROP COLUMN IF EXISTS languages,
DROP COLUMN IF EXISTS certifications,
DROP COLUMN IF EXISTS honors_awards,
DROP COLUMN IF EXISTS profile_scraped_at,
DROP COLUMN IF EXISTS profile_data_version;
*/
