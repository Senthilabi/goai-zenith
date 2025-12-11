/* 
  HRMS LEAVE MANAGEMENT - Database Setup
  Run this script to create the leave requests table and set up security policies
*/

-- 1. Create the leave requests table
create table if not exists public.hrms_leave_requests (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references public.hrms_employees(id) on delete cascade not null,
  leave_type text not null,
  start_date date not null,
  end_date date not null,
  reason text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  manager_comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Enable RLS
alter table public.hrms_leave_requests enable row level security;

-- 3. Grant permissions
grant all on public.hrms_leave_requests to postgres, service_role;
grant select, insert, update, delete on public.hrms_leave_requests to authenticated;

-- 4. Drop existing policies if any
drop policy if exists "Employees can view own leave requests" on public.hrms_leave_requests;
drop policy if exists "Employees can create leave requests" on public.hrms_leave_requests;
drop policy if exists "HR can view all leave requests" on public.hrms_leave_requests;
drop policy if exists "HR can manage all leave requests" on public.hrms_leave_requests;

-- 5. Create policies
-- Employees can view their own leave requests
create policy "Employees can view own leave requests"
  on public.hrms_leave_requests for select using (
    employee_id in (select id from public.hrms_employees where auth_id = auth.uid())
  );

-- Employees can create their own leave requests
create policy "Employees can create leave requests"
  on public.hrms_leave_requests for insert with check (
    employee_id in (select id from public.hrms_employees where auth_id = auth.uid())
  );

-- HR Admins can view all leave requests
create policy "HR can view all leave requests"
  on public.hrms_leave_requests for select using (
    public.get_hrms_role() in ('super_admin', 'hr_admin')
  );

-- HR Admins can manage all leave requests (approve/reject/update)
create policy "HR can manage all leave requests"
  on public.hrms_leave_requests for all using (
    public.get_hrms_role() in ('super_admin', 'hr_admin')
  );

-- 6. Create indexes for better performance
create index if not exists idx_leave_requests_employee on public.hrms_leave_requests(employee_id);
create index if not exists idx_leave_requests_status on public.hrms_leave_requests(status);
create index if not exists idx_leave_requests_dates on public.hrms_leave_requests(start_date, end_date);

-- 7. Create updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_hrms_leave_requests_updated_at on public.hrms_leave_requests;
create trigger update_hrms_leave_requests_updated_at
  before update on public.hrms_leave_requests
  for each row
  execute function update_updated_at_column();
