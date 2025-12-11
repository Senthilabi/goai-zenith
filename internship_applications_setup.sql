/*
  INTERNSHIP APPLICATIONS - Quick Fix
  Run this to enable internship application storage
*/

-- 1. Create internship applications table
create table if not exists public.internship_applications (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  email text not null,
  phone text not null,
  position text not null,
  university text not null,
  graduation_year text not null,
  skills text,
  motivation text not null,
  resume_link text,
  status text default 'new' check (status in ('new', 'reviewing', 'shortlisted', 'rejected', 'hired')),
  notes text,
  created_at timestamptz default now()
);

-- 2. Enable RLS (public can insert, only admins can view)
alter table public.internship_applications enable row level security;

-- 3. Grant permissions
grant all on public.internship_applications to postgres, service_role;
grant insert on public.internship_applications to anon, authenticated;
grant select, update, delete on public.internship_applications to authenticated;

-- 4. Create RLS policies
drop policy if exists "Anyone can submit applications" on public.internship_applications;
drop policy if exists "HR can view all applications" on public.internship_applications;
drop policy if exists "HR can manage applications" on public.internship_applications;

-- Allow public to submit applications
create policy "Anyone can submit applications"
  on public.internship_applications for insert
  to anon, authenticated
  with check (true);

-- HR can view all applications
create policy "HR can view all applications"
  on public.internship_applications for select using (
    exists (
      select 1 from public.hrms_employees 
      where auth_id = auth.uid() 
      and hrms_role in ('hr_admin', 'super_admin')
    )
  );

-- HR can manage applications
create policy "HR can manage applications"
  on public.internship_applications for all using (
    exists (
      select 1 from public.hrms_employees 
      where auth_id = auth.uid() 
      and hrms_role in ('hr_admin', 'super_admin')
    )
  );

-- 5. Create index for performance
create index if not exists idx_internship_applications_created on public.internship_applications(created_at desc);
create index if not exists idx_internship_applications_status on public.internship_applications(status);

-- Done! Internship applications ready.
