-- Add offer_body column to hrms_onboarding table
-- This stores the editable offer letter body text per candidate
ALTER TABLE hrms_onboarding ADD COLUMN IF NOT EXISTS offer_body TEXT;
