/*
  MASTER FIX: INTERNSHIP PERMISSIONS
  Run this in the Supabase SQL Editor to fix ALL permission errors for the career page.
*/

-- 1. FIX TABLE PERMISSIONS (internship_applications)
-- Enable RLS just in case
alter table public.internship_applications enable row level security;

-- Drop existing policies to start fresh
drop policy if exists "Anyone can submit applications" on public.internship_applications;
drop policy if exists "HR can view all applications" on public.internship_applications;
drop policy if exists "HR can manage applications" on public.internship_applications;

-- Allow ANYONE (including unauthenticated users) to submit
create policy "Anyone can submit applications"
  on public.internship_applications for insert
  to anon, authenticated
  with check (true);

-- Allow HR Admins to VIEW applications
create policy "HR can view all applications"
  on public.internship_applications for select
  to authenticated
  using (
    exists (
      select 1 from public.hrms_employees 
      where auth_id = auth.uid() 
      and hrms_role in ('hr_admin', 'super_admin')
    )
  );

-- Allow HR Admins to UPDATE/DELETE applications
create policy "HR can manage applications"
  on public.internship_applications for all
  to authenticated
  using (
    exists (
      select 1 from public.hrms_employees 
      where auth_id = auth.uid() 
      and hrms_role in ('hr_admin', 'super_admin')
    )
  );

-- 2. FIX STORAGE PERMISSIONS (resumes bucket)
-- Create bucket if it doesn't exist (idempotent)
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- Drop existing policies
drop policy if exists "Anyone can upload resumes" on storage.objects;
drop policy if exists "HR can view all resumes" on storage.objects;
drop policy if exists "HR can delete resumes" on storage.objects;

-- Allow ANYONE to upload PDF/Docs to 'resumes' bucket
create policy "Anyone can upload resumes"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'resumes');

-- Allow HR Admins to VIEW/DOWNLOAD files
create policy "HR can view all resumes"
on storage.objects for select
to authenticated
using (
  bucket_id = 'resumes' and
  exists (
    select 1 from public.hrms_employees 
    where auth_id = auth.uid() 
    and hrms_role in ('hr_admin', 'super_admin')
  )
);
