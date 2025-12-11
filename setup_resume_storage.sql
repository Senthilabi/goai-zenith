/*
  SUPABASE STORAGE SETUP FOR RESUMES
  Run this in Supabase SQL Editor
*/

-- 1. Create storage bucket for resumes
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false);

-- 2. Set up storage policies
-- Allow anyone to upload resumes
create policy "Anyone can upload resumes"
on storage.objects for insert
with check (bucket_id = 'resumes');

-- Allow HR to view all resumes
create policy "HR can view all resumes"
on storage.objects for select
using (
  bucket_id = 'resumes' and
  exists (
    select 1 from public.hrms_employees 
    where auth_id = auth.uid() 
    and hrms_role in ('hr_admin', 'super_admin')
  )
);

-- Allow HR to delete resumes
create policy "HR can delete resumes"
on storage.objects for delete
using (
  bucket_id = 'resumes' and
  exists (
    select 1 from public.hrms_employees 
    where auth_id = auth.uid() 
    and hrms_role in ('hr_admin', 'super_admin')
  )
);
