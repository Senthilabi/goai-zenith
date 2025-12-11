/* 
  HRMS SEPARATE MODULE SCHEMA 
  Prefix: hrms_ 
  Description: Completely isolated tables for the new HRMS system.
*/

/* 1. HRMS EMPLOYEES (Master Data) */
create table if not exists public.hrms_employees (
  id uuid default gen_random_uuid() primary key,
  auth_id uuid references auth.users(id) on delete set null, -- Linked when user registers
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

-- Policies
create policy "HRMS: Employees can view their own profile" 
  on public.hrms_employees for select using (auth.uid() = auth_id);

create policy "HRMS: Admins can view all profiles"
  on public.hrms_employees for select using (
    exists (select 1 from public.hrms_employees where auth_id = auth.uid() and hrms_role in ('super_admin', 'hr_admin'))
  );

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
create policy "HRMS: Users view own attendance" 
  on public.hrms_attendance for select using (auth.uid() = employee_id);

create policy "HRMS: Admins view all attendance"
  on public.hrms_attendance for select using (
    exists (select 1 from public.hrms_employees where id = auth.uid() and hrms_role in ('super_admin', 'hr_admin'))
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
create policy "HRMS: Users view own leaves" 
  on public.hrms_leave_requests for select using (auth.uid() = employee_id);

create policy "HRMS: Admins view all leaves"
  on public.hrms_leave_requests for select using (
    exists (select 1 from public.hrms_employees where id = auth.uid() and hrms_role in ('super_admin', 'hr_admin'))
  );
