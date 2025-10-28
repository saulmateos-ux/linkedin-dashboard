-- Migration: Add company relationships to profiles
-- Date: 2025-10-25
-- Description: Allow employee profiles to be linked to company profiles

-- Add company_id column to profiles table
ALTER TABLE profiles
ADD COLUMN company_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL;

-- Create index for faster company lookups
CREATE INDEX idx_profiles_company_id ON profiles(company_id);

-- Add comment
COMMENT ON COLUMN profiles.company_id IS 'References the company profile this employee works for (only for employee profiles)';

-- Verify the migration
-- SELECT id, display_name, profile_type, is_company, company_id
-- FROM profiles
-- WHERE company_id IS NOT NULL;
