/* 
  HRMS COMPLETE SETUP SCRIPT
  Run this entire script in Supabase SQL Editor.
  NOTE: This will RESET the HRMS tables to ensure you have the correct structure.
*/

-- 0. CLEANUP (Drop tables if they exist to ensure fresh schema)
drop table if exists public.hrms_attendance cascade;
drop table if exists public.hrms_leave_requests cascade;
drop table if exists public.hrms_employees cascade;

-- 1. Create Tables
create table public.hrms_employees (
  id uuid default gen_random_uuid() primary key,
  auth_id uuid references auth.users(id) on delete set null,
  employee_code text unique,
  first_name text not null,
  last_name text not null,
  email text not null,
  department text,
  designation text,
  joining_date date,
  hrms_role text default 'employee',
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists public.hrms_attendance (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references public.hrms_employees(id) on delete cascade not null,
  date date default current_date not null,
  check_in timestamptz,
  check_out timestamptz,
  status text default 'present',
  created_at timestamptz default now()
);

create table if not exists public.hrms_leave_requests (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references public.hrms_employees(id) on delete cascade not null,
  leave_type text not null,
  start_date date not null,
  end_date date not null,
  reason text,
  status text default 'pending',
  manager_comment text,
  created_at timestamptz default now()
);

-- 2. Enable RLS
alter table public.hrms_employees enable row level security;
alter table public.hrms_attendance enable row level security;
alter table public.hrms_leave_requests enable row level security;

-- 3. Explicitly Grant Permissions (Fixes "Relation does not exist" for some roles)
grant all on public.hrms_employees to postgres, service_role;
grant select, insert, update, delete on public.hrms_employees to authenticated;
grant select, insert, update, delete on public.hrms_employees to anon; -- Optional, usually not needed

grant all on public.hrms_attendance to postgres, service_role;
grant select, insert, update, delete on public.hrms_attendance to authenticated;

grant all on public.hrms_leave_requests to postgres, service_role;
grant select, insert, update, delete on public.hrms_leave_requests to authenticated;

-- 4. Create Policies (Drop existing first to avoid conflicts)
drop policy if exists "HRMS: Employees can view their own profile" on public.hrms_employees;
drop policy if exists "HRMS: Admins can view all profiles" on public.hrms_employees;
drop policy if exists "HRMS: Admins can insert/update profiles" on public.hrms_employees;

-- 2.1 Helper Function to avoid Infinite Recursion (Error 42P17)
create or replace function public.get_hrms_role()
returns text as $$
begin
  return (
    select hrms_role 
    from public.hrms_employees 
    where auth_id = auth.uid() 
    limit 1
  );
end;
$$ language plpgsql security definer; -- 'security definer' allows this function to bypass RLS

-- 2.2 Re-Apply Policies using the function
create policy "HRMS: Employees can view their own profile" 
  on public.hrms_employees for select using (auth.uid() = auth_id);

create policy "HRMS: Admins can view all profiles"
  on public.hrms_employees for select using (
    public.get_hrms_role() in ('super_admin', 'hr_admin')
  );

create policy "HRMS: Admins can insert/update profiles"
  on public.hrms_employees for all using (
    public.get_hrms_role() in ('super_admin', 'hr_admin')
  );

-- 5. BOOTSTRAP: Make the latest user a Super Admin so they can access the system
-- This finds the most recently created user in Auth and adds/updates them in HRMS employees
DO $$
DECLARE
  latest_user_id uuid;
  latest_user_email text;
BEGIN
  -- Get the most recent user
  select id, email into latest_user_id, latest_user_email from auth.users order by created_at desc limit 1;

  IF latest_user_id IS NOT NULL THEN
    -- Check if this user already exists in HRMS
    IF EXISTS (SELECT 1 FROM public.hrms_employees WHERE auth_id = latest_user_id) THEN
       -- Update them to super_admin
       UPDATE public.hrms_employees SET hrms_role = 'super_admin' WHERE auth_id = latest_user_id;
    ELSE
       -- Insert new super_admin record
       INSERT INTO public.hrms_employees (auth_id, first_name, last_name, email, hrms_role, employee_code, designation)
       VALUES (latest_user_id, 'Super', 'Admin', latest_user_email, 'super_admin', 'ADMIN-001', 'System Administrator');
    END IF;
  END IF;
END $$;
