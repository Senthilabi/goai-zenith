-- SQL Script to Prevent Duplicate Applications
-- Run this in your Supabase SQL Editor

-- 1. Add Unique Constraint for Email
-- This ensures that no two applications can have the same email address.
ALTER TABLE public.internship_applications
ADD CONSTRAINT unique_application_email UNIQUE (email);

-- 2. Add Unique Constraint for Phone (Optional, but recommended)
-- This ensures that no two applications can have the same phone number.
ALTER TABLE public.internship_applications
ADD CONSTRAINT unique_application_phone UNIQUE (phone);
