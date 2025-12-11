/* 
  HRMS ATTENDANCE MODULE - Complete Setup
  Run this script to create the attendance table and set up security policies
*/

-- 1. Create the attendance table
create table if not exists public.hrms_attendance (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references public.hrms_employees(id) on delete cascade not null,
  date date default current_date not null,
  check_in timestamptz,
  check_out timestamptz,
  status text default 'present',
  created_at timestamptz default now(),
  unique(employee_id, date)  -- Prevent duplicate entries for same employee on same day
);

-- 2. Enable RLS
alter table public.hrms_attendance enable row level security;

-- 3. Grant permissions
grant all on public.hrms_attendance to postgres, service_role;
grant select, insert, update, delete on public.hrms_attendance to authenticated;

-- 4. Drop existing policies if any
drop policy if exists "Employees can view own attendance" on public.hrms_attendance;
drop policy if exists "Employees can clock in/out" on public.hrms_attendance;
drop policy if exists "Employees can update own attendance" on public.hrms_attendance;
drop policy if exists "HR can view all attendance" on public.hrms_attendance;
drop policy if exists "HR can manage all attendance" on public.hrms_attendance;

-- 5. Create policies
-- Employees can view their own attendance
create policy "Employees can view own attendance"
  on public.hrms_attendance for select using (
    employee_id in (select id from public.hrms_employees where auth_id = auth.uid())
  );

-- Employees can insert their own attendance (clock in)
create policy "Employees can clock in/out"
  on public.hrms_attendance for insert with check (
    employee_id in (select id from public.hrms_employees where auth_id = auth.uid())
  );

-- Employees can update their own attendance (clock out)
create policy "Employees can update own attendance"
  on public.hrms_attendance for update using (
    employee_id in (select id from public.hrms_employees where auth_id = auth.uid())
  );

-- HR Admins can view all attendance
create policy "HR can view all attendance"
  on public.hrms_attendance for select using (
    public.get_hrms_role() in ('super_admin', 'hr_admin')
  );

-- HR Admins can manage all attendance (insert, update, delete)
create policy "HR can manage all attendance"
  on public.hrms_attendance for all using (
    public.get_hrms_role() in ('super_admin', 'hr_admin')
  );

-- 6. Create indexes for better performance
create index if not exists idx_attendance_employee_date on public.hrms_attendance(employee_id, date);
create index if not exists idx_attendance_date on public.hrms_attendance(date);
