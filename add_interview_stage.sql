-- Migration: Add Interview Stage to Recruitment Flow
-- This adds interview tracking columns and new status values

-- 1. Add new columns to internship_applications
ALTER TABLE public.internship_applications
ADD COLUMN IF NOT EXISTS interview_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS interview_notes TEXT;

-- 2. Update the status check constraint to include new statuses
-- First, drop the existing constraint
ALTER TABLE public.internship_applications
DROP CONSTRAINT IF EXISTS internship_applications_status_check;

-- Then add the updated constraint with new statuses
ALTER TABLE public.internship_applications
ADD CONSTRAINT internship_applications_status_check 
CHECK (status IN (
    'new', 
    'reviewing', 
    'shortlisted', 
    'interview_scheduled',
    'interviewed',
    'approved',
    'on_hold',
    'hired',
    'rejected'
));

-- 3. Add comment for documentation
COMMENT ON COLUMN public.internship_applications.interview_date IS 'Scheduled interview date and time';
COMMENT ON COLUMN public.internship_applications.interview_notes IS 'HR notes from the interview';
