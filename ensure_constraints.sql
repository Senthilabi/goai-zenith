-- SQL Script: Safely Ensure Unique Constraints Exist
-- PURPOSE: Verify and add unique constraints for email and phone without erroring if they already exist.

DO $$
BEGIN
    -- 1. Check and Add Email Constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_application_email') THEN
        ALTER TABLE public.internship_applications ADD CONSTRAINT unique_application_email UNIQUE (email);
        RAISE NOTICE 'Added unique_application_email constraint.';
    ELSE
        RAISE NOTICE 'Constraint unique_application_email already exists. Skipping.';
    END IF;

    -- 2. Check and Add Phone Constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_application_phone') THEN
        ALTER TABLE public.internship_applications ADD CONSTRAINT unique_application_phone UNIQUE (phone);
        RAISE NOTICE 'Added unique_application_phone constraint.';
    ELSE
        RAISE NOTICE 'Constraint unique_application_phone already exists. Skipping.';
    END IF;
END $$;
