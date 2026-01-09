-- Migration: Add photo_url to hrms_employees table
-- This allows employee photos to be displayed in their profile

ALTER TABLE public.hrms_employees
ADD COLUMN IF NOT EXISTS photo_url TEXT;

COMMENT ON COLUMN public.hrms_employees.photo_url IS 'URL path to employee photo in Supabase Storage';
