-- Add offer_body, letter_type, and duration_unit columns to hrms_onboarding table
ALTER TABLE hrms_onboarding ADD COLUMN IF NOT EXISTS offer_body TEXT;
ALTER TABLE hrms_onboarding ADD COLUMN IF NOT EXISTS letter_type TEXT DEFAULT 'internship';
ALTER TABLE hrms_onboarding ADD COLUMN IF NOT EXISTS duration_unit TEXT DEFAULT 'months';
