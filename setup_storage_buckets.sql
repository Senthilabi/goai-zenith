-- =====================================================
-- SUPABASE STORAGE BUCKETS SETUP
-- =====================================================
-- This script creates the required storage buckets for the HRMS system
-- Run this in your Supabase SQL Editor

-- 1. Create bucket for system-generated documents (Offers, NDAs, Certificates)
INSERT INTO storage.buckets (id, name, public)
VALUES ('hrms_generated_docs', 'hrms_generated_docs', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create bucket for candidate onboarding uploads (Photos, ID Proofs, Certificates)
INSERT INTO storage.buckets (id, name, public)
VALUES ('onboarding_docs', 'onboarding_docs', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up RLS policies for hrms_generated_docs
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads to hrms_generated_docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'hrms_generated_docs');

-- Allow public read access (so HR can view via URLs)
CREATE POLICY "Allow public read access to hrms_generated_docs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'hrms_generated_docs');

-- 4. Set up RLS policies for onboarding_docs
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads to onboarding_docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'onboarding_docs');

-- Allow public read access (so candidates can upload and HR can view)
CREATE POLICY "Allow public read access to onboarding_docs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'onboarding_docs');

-- Allow anon users to upload (for public onboarding wizard)
CREATE POLICY "Allow anon uploads to onboarding_docs"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'onboarding_docs');

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this to verify buckets were created:
SELECT id, name, public FROM storage.buckets WHERE id IN ('hrms_generated_docs', 'onboarding_docs');
