-- Migration: Enhanced Employee Profiles
-- Adding standard HR fields to hrms_employees

ALTER TABLE public.hrms_employees
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS residential_address TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add comments for clarity
COMMENT ON COLUMN public.hrms_employees.gender IS 'Employee gender (typically set by Admin)';
COMMENT ON COLUMN public.hrms_employees.phone_number IS 'Primary contact number';
COMMENT ON COLUMN public.hrms_employees.emergency_contact_name IS 'Name of person to contact in emergency';
COMMENT ON COLUMN public.hrms_employees.emergency_contact_phone IS 'Phone of person to contact in emergency';
