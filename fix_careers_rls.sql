-- SQL SCRIPT: Fix RLS for Internship Applications
-- PURPOSE: Allow authenticated candidates to submit their applications

-- 1. Enable RLS on the table (if not already enabled)
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;

-- 2. Create policy to allow INSERT for authenticated users
-- Candidates need to be able to create their application record.
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.internship_applications;
CREATE POLICY "Enable insert for authenticated users only" 
ON public.internship_applications 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 3. Create policy to allow SELECT for Admins/HR only
-- We don't want candidates reading other people's applications.
DROP POLICY IF EXISTS "Enable select for admins and hr" ON public.internship_applications;
CREATE POLICY "Enable select for admins and hr" 
ON public.internship_applications 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.hrms_employees 
    WHERE public.hrms_employees.auth_id = auth.uid() 
    AND (public.hrms_employees.hrms_role = 'super_admin' OR public.hrms_employees.hrms_role = 'hr_admin')
  )
);

-- 4. Enable Storage bucket access for resumes (just in case)
-- Authenticated users need to upload to the 'resumes' bucket.
-- Note: This assumes a bucket named 'resumes' exists.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', false) 
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'resumes');

-- RLS Policies updated successfully.
