/*
  MIGRATION: Add Social Media Columns
  Run this in Supabase SQL Editor
*/

-- Add social media columns if they don't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'internship_applications' and column_name = 'linkedin_url') then
        alter table public.internship_applications add column linkedin_url text;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'internship_applications' and column_name = 'portfolio_url') then
        alter table public.internship_applications add column portfolio_url text;
    end if;
end $$;

-- Update the RLS policy to ensure authenticated users can still insert
-- (The previous 'fix_all_internship_access.sql' already handles this via "to anon, authenticated", so no major change needed there)
