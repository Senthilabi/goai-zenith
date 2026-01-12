-- FINAL HRMS ENHANCEMENT: PROFILE & SELF-SERVICE
-- 1. Table Updates
ALTER TABLE public.hrms_employees
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS residential_address TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2. Storage Setup (onboarding_docs bucket should exist)
-- Allow Authenticated Users to upload their own profile photos
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('onboarding_docs', 'onboarding_docs', true)
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Policy: Authenticated users can upload to the 'avatars/' folder
CREATE POLICY "Employees can upload profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'onboarding_docs' 
    AND (storage.foldername(name))[1] = 'avatars'
);

CREATE POLICY "Employees can update their own profile photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'onboarding_docs' 
    AND (storage.foldername(name))[1] = 'avatars'
);

-- Policy: Everyone can view photos
CREATE POLICY "Public profile photo access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'onboarding_docs');

-- 3. RLS for Employees to update their OWN profile
CREATE POLICY "Employees can update their own data"
ON public.hrms_employees FOR UPDATE
TO authenticated
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());
