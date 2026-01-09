/*
  UPDATE INTERNSHIP APPLICATIONS TABLE
  Run this to add missing columns for LinkedIn and Portfolio URLs
*/

-- Add linkedin_url if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'internship_applications' and column_name = 'linkedin_url') then
    alter table public.internship_applications add column linkedin_url text;
  end if;
end $$;

-- Add portfolio_url if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'internship_applications' and column_name = 'portfolio_url') then
    alter table public.internship_applications add column portfolio_url text;
  end if;
end $$;

-- Verify columns
select column_name, data_type 
from information_schema.columns 
where table_name = 'internship_applications';
