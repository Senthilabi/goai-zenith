-- SQL Script: Cleanup Duplicates & Add Constraints
-- PURPOSE: Remove existing duplicate applications so that unique constraints can be applied.

-- 1. DELETE DUPLICATES (Keep ONLY the most recent application per email)
-- This deletes all records where a newer record exists with the same email.
DELETE FROM public.internship_applications
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (partition BY email ORDER BY created_at DESC) as row_num
        FROM public.internship_applications
    ) t
    WHERE t.row_num > 1
);

-- 2. DELETE DUPLICATES (Keep ONLY the most recent application per phone)
-- This deletes all records where a newer record exists with the same phone.
DELETE FROM public.internship_applications
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (partition BY phone ORDER BY created_at DESC) as row_num
        FROM public.internship_applications
    ) t
    WHERE t.row_num > 1
);

-- 3. Now that duplicates are gone, APPLY THE CONSTRAINTS
ALTER TABLE public.internship_applications
ADD CONSTRAINT unique_application_email UNIQUE (email);

ALTER TABLE public.internship_applications
ADD CONSTRAINT unique_application_phone UNIQUE (phone);

-- Confirmation
SELECT 'Duplicates removed and unique constraints applied successfully.' as status;
