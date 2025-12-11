/*
  HRMS EMPLOYEE ENHANCEMENTS - Database Updates
  Run this to add team_manager role and leave balance tracking
*/

-- 1. Add team_manager role to employees table
alter table public.hrms_employees 
  drop constraint if exists hrms_employees_hrms_role_check;

alter table public.hrms_employees 
  add constraint hrms_employees_hrms_role_check 
  check (hrms_role in ('employee', 'team_manager', 'hr_admin', 'super_admin'));

-- 2. Create leave balance table
create table if not exists public.hrms_leave_balance (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references public.hrms_employees(id) on delete cascade not null unique,
  casual_leave int default 12,
  sick_leave int default 12,
  earned_leave int default 15,
  updated_at timestamptz default now()
);

-- 3. Enable RLS on leave balance
alter table public.hrms_leave_balance enable row level security;

-- 4. Grant permissions
grant all on public.hrms_leave_balance to postgres, service_role;
grant select, update on public.hrms_leave_balance to authenticated;

-- 5. Create RLS policies for leave balance
drop policy if exists "Employees can view own leave balance" on public.hrms_leave_balance;
drop policy if exists "HR can view all leave balances" on public.hrms_leave_balance;
drop policy if exists "HR can manage all leave balances" on public.hrms_leave_balance;

create policy "Employees can view own leave balance"
  on public.hrms_leave_balance for select using (
    employee_id in (select id from public.hrms_employees where auth_id = auth.uid())
  );

create policy "HR can view all leave balances"
  on public.hrms_leave_balance for select using (
    public.get_hrms_role() in ('super_admin', 'hr_admin')
  );

create policy "HR can manage all leave balances"
  on public.hrms_leave_balance for all using (
    public.get_hrms_role() in ('super_admin', 'hr_admin')
  );

-- 6. Create default leave balances for existing employees
insert into public.hrms_leave_balance (employee_id, casual_leave, sick_leave, earned_leave)
select id, 12, 12, 15 
from public.hrms_employees
where id not in (select employee_id from public.hrms_leave_balance);

-- 7. Update get_hrms_role function to include team_manager
create or replace function public.get_hrms_role()
returns text
language sql
security definer
stable
as $$
  select hrms_role from public.hrms_employees where auth_id = auth.uid() limit 1;
$$;

-- Done! Team manager role and leave balance system ready.
