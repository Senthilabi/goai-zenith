/* 
  HRMS SEPARATE MODULE SCHEMA 
  Prefix: hrms_ 
  Description: Completely isolated tables for the new HRMS system.
*/

/* 1. HRMS EMPLOYEES (Master Data) */
create table if not exists public.hrms_employees (
  id uuid default gen_random_uuid() primary key,
  auth_id uuid, -- Link to auth.users (can be null initially, linked later)
  employee_code text unique,
  first_name text not null,
  last_name text not null,
  email text not null,
  department text,
  designation text,
  joining_date date,
  hrms_role text default 'employee', -- 'super_admin', 'hr_admin', 'employee'
  status text default 'active',
  created_at timestamptz default now()
);

alter table public.hrms_employees enable row level security;

-- Policies (Drop first to avoid errors)
drop policy if exists "HRMS: Employees can view their own profile" on public.hrms_employees;
create policy "HRMS: Employees can view their own profile" 
  on public.hrms_employees for select using (auth.uid() = auth_id);

drop policy if exists "HRMS: Admins can view all profiles" on public.hrms_employees;
create policy "HRMS: Admins can view all profiles"
  on public.hrms_employees for select using (
    exists (select 1 from public.hrms_employees where auth_id = auth.uid() and hrms_role in ('super_admin', 'hr_admin'))
  );

drop policy if exists "HRMS: Admins can insert/update profiles" on public.hrms_employees;
create policy "HRMS: Admins can insert/update profiles"
  on public.hrms_employees for all using (
    exists (select 1 from public.hrms_employees where auth_id = auth.uid() and hrms_role in ('super_admin', 'hr_admin'))
  );


/* 2. HRMS ATTENDANCE */
create table if not exists public.hrms_attendance (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references public.hrms_employees(id) on delete cascade not null,
  date date default current_date not null,
  check_in timestamptz,
  check_out timestamptz,
  status text default 'present', -- present, absent, half_day
  created_at timestamptz default now()
);

alter table public.hrms_attendance enable row level security;

-- Policies
drop policy if exists "HRMS: Users view own attendance" on public.hrms_attendance;
create policy "HRMS: Users view own attendance" 
  on public.hrms_attendance for select using (
    employee_id in (select id from public.hrms_employees where auth_id = auth.uid())
  );

drop policy if exists "HRMS: Admins view all attendance" on public.hrms_attendance;
create policy "HRMS: Admins view all attendance"
  on public.hrms_attendance for select using (
    exists (select 1 from public.hrms_employees where auth_id = auth.uid() and hrms_role in ('super_admin', 'hr_admin'))
  );

drop policy if exists "HRMS: Users clock in/out" on public.hrms_attendance;
create policy "HRMS: Users clock in/out"
  on public.hrms_attendance for insert with check (
    employee_id in (select id from public.hrms_employees where auth_id = auth.uid())
  );
  
create policy "HRMS: Users update own attendance (clock out)"
  on public.hrms_attendance for update using (
    employee_id in (select id from public.hrms_employees where auth_id = auth.uid())
  );


/* 3. HRMS LEAVE REQUESTS */
create table if not exists public.hrms_leave_requests (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references public.hrms_employees(id) on delete cascade not null,
  leave_type text not null, -- 'annual', 'sick', 'casual'
  start_date date not null,
  end_date date not null,
  reason text,
  status text default 'pending', -- pending, approved, rejected
  manager_comment text,
  created_at timestamptz default now()
);

alter table public.hrms_leave_requests enable row level security;

-- Policies
drop policy if exists "HRMS: Users view own leaves" on public.hrms_leave_requests;
create policy "HRMS: Users view own leaves" 
  on public.hrms_leave_requests for select using (
    employee_id in (select id from public.hrms_employees where auth_id = auth.uid())
  );

drop policy if exists "HRMS: Users create leaves" on public.hrms_leave_requests;
create policy "HRMS: Users create leaves" 
  on public.hrms_leave_requests for insert with check (
    employee_id in (select id from public.hrms_employees where auth_id = auth.uid())
  );

drop policy if exists "HRMS: Admins view all leaves" on public.hrms_leave_requests;
create policy "HRMS: Admins view all leaves"
  on public.hrms_leave_requests for select using (
    exists (select 1 from public.hrms_employees where auth_id = auth.uid() and hrms_role in ('super_admin', 'hr_admin'))
  );

drop policy if exists "HRMS: Admins manage leaves" on public.hrms_leave_requests;
create policy "HRMS: Admins manage leaves"
  on public.hrms_leave_requests for update using (
    exists (select 1 from public.hrms_employees where auth_id = auth.uid() and hrms_role in ('super_admin', 'hr_admin'))
  );
