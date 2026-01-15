-- =====================================================
-- OFFER LETTER DETAILS ENHANCEMENT
-- =====================================================
-- Add fields to hrms_onboarding for editable offer details

-- Add columns for offer letter customization
ALTER TABLE hrms_onboarding
ADD COLUMN IF NOT EXISTS joining_date DATE,
ADD COLUMN IF NOT EXISTS internship_period_months INTEGER DEFAULT 6,
ADD COLUMN IF NOT EXISTS custom_position VARCHAR(255),
ADD COLUMN IF NOT EXISTS offer_notes TEXT;

-- Update existing records with default values
UPDATE hrms_onboarding
SET 
    joining_date = CURRENT_DATE + INTERVAL '7 days',
    internship_period_months = 6
WHERE joining_date IS NULL;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 
    id,
    application_id,
    joining_date,
    internship_period_months,
    custom_position,
    offer_status
FROM hrms_onboarding
LIMIT 5;
