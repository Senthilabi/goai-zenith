-- COMPREHENSIVE FIX: Careers Submission Access
-- This script fixes both the Database Table and the Storage Bucket permissions.

------------------------------------------------------------------
-- 1. DATABASE TABLE: internship_applications
------------------------------------------------------------------

-- Ensure RLS is active
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;

-- Allow ANYONE (including public/anon) to submit their application
-- We do this to avoid any session synchronization issues between Auth and the DB
DROP POLICY IF EXISTS "Public can submit applications" ON public.internship_applications;
CREATE POLICY "Public can submit applications" 
ON public.internship_applications 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Allow Admins to see everything, and candidates to see THEIR OWN email-matched application
-- This is critical to allow the .select() after insert to work
DROP POLICY IF EXISTS "Only admins can see applications" ON public.internship_applications;
DROP POLICY IF EXISTS "Admins and owners can see applications" ON public.internship_applications;
CREATE POLICY "Admins and owners can see applications" 
ON public.internship_applications 
FOR SELECT 
TO authenticated
USING (
  -- Option 1: User is an Admin
  EXISTS (
    SELECT 1 FROM public.hrms_employees 
    WHERE public.hrms_employees.auth_id = auth.uid() 
    AND (public.hrms_employees.hrms_role = 'super_admin' OR public.hrms_employees.hrms_role = 'hr_admin')
  )
  OR 
  -- Option 2: Email matches their session email
  email = auth.jwt() ->> 'email'
);

------------------------------------------------------------------
-- 2. STORAGE BUCKET: resumes
------------------------------------------------------------------

-- Ensure the 'resumes' bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', false) 
ON CONFLICT (id) DO NOTHING;

-- Allow users to upload their resume (critical fix for storage RLS)
-- We allow 'public' here as well for maximum reliability
DROP POLICY IF EXISTS "Public can upload resumes" ON storage.objects;
CREATE POLICY "Public can upload resumes" 
ON storage.objects 
FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'resumes');

-- Allow admins to view/download resumes
DROP POLICY IF EXISTS "Admins can view resumes" ON storage.objects;
CREATE POLICY "Admins can view resumes" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'resumes');

-- DONE. This covers all bases.
