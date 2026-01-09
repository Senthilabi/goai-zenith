/*
  HRMS TASK MANAGEMENT SCHEMA
  Description: Tables for Task Assignment and Daily Work Logs
*/

-- 1. Tasks Table
create table if not exists public.hrms_tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  assigned_to uuid references public.hrms_employees(id) on delete set null,
  assigned_by uuid references auth.users(id) on delete set null, -- The user who created the task
  status text default 'pending' check (status in ('pending', 'ongoing', 'completed', 'reviewed')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Work Logs Table (Daily Muster)
create table if not exists public.hrms_work_logs (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.hrms_tasks(id) on delete cascade,
  employee_id uuid references public.hrms_employees(id) on delete cascade,
  log_date date default current_date,
  hours_spent numeric(4,2) check (hours_spent > 0),
  summary text not null, -- "What did you do today?"
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.hrms_tasks enable row level security;
alter table public.hrms_work_logs enable row level security;

-- -------------------------------------------------------------------------
-- RLS POLICIES FOR TASKS
-- -------------------------------------------------------------------------

-- VIEW POLICY
-- 1. Super Admins & HR Admins can view ALL tasks
create policy "Tasks: Admins view all"
  on public.hrms_tasks for select
  using (
    exists (select 1 from public.hrms_employees 
            where auth_id = auth.uid() 
            and hrms_role in ('super_admin', 'hr_admin'))
  );

-- 2. Managers can view tasks for their DEPARTMENT or created by them
create policy "Tasks: Managers view team"
  on public.hrms_tasks for select
  using (
    exists (
      select 1 from public.hrms_employees me
      join public.hrms_employees target on target.department = me.department
      where me.auth_id = auth.uid() 
      and me.hrms_role = 'team_manager'
      and target.id = hrms_tasks.assigned_to
    )
    OR assigned_by = auth.uid()
  );

-- 3. Employees/Interns can view tasks assigned TO them
create policy "Tasks: Interns view own"
  on public.hrms_tasks for select
  using (
    assigned_to in (select id from public.hrms_employees where auth_id = auth.uid())
  );

-- INSERT/UPDATE POLICY
-- 1. Admins can insert/update ANY task
create policy "Tasks: Admins manage all"
  on public.hrms_tasks for all
  using (
    exists (select 1 from public.hrms_employees 
            where auth_id = auth.uid() 
            and hrms_role in ('super_admin', 'hr_admin'))
  );

-- 2. Managers can insert/update tasks for their department
create policy "Tasks: Managers manage team"
  on public.hrms_tasks for insert
  with check (
    exists (
      select 1 from public.hrms_employees me
      join public.hrms_employees target on target.department = me.department
      where me.auth_id = auth.uid() 
      and me.hrms_role = 'team_manager'
      and target.id = assigned_to
    )
  );

-- 3. Interns can UPDATE status of their own tasks (but not title/assignment)
create policy "Tasks: Interns update status"
  on public.hrms_tasks for update
  using (
    assigned_to in (select id from public.hrms_employees where auth_id = auth.uid())
  )
  with check (
    assigned_to in (select id from public.hrms_employees where auth_id = auth.uid())
  );


-- -------------------------------------------------------------------------
-- RLS POLICIES FOR WORK LOGS
-- -------------------------------------------------------------------------

-- 1. Everyone can view their own logs
create policy "Logs: View own"
  on public.hrms_work_logs for select
  using (
    employee_id in (select id from public.hrms_employees where auth_id = auth.uid())
  );

-- 2. Admins can view all logs
create policy "Logs: Admins view all"
  on public.hrms_work_logs for select
  using (
    exists (select 1 from public.hrms_employees 
            where auth_id = auth.uid() 
            and hrms_role in ('super_admin', 'hr_admin'))
  );

-- 3. Managers can view logs of their team
create policy "Logs: Managers view team"
  on public.hrms_work_logs for select
  using (
    exists (
      select 1 from public.hrms_employees me
      join public.hrms_employees target on target.department = me.department
      where me.auth_id = auth.uid() 
      and me.hrms_role = 'team_manager'
      and target.id = hrms_work_logs.employee_id
    )
  );

-- 4. Employees can INSERT logs for themselves
create policy "Logs: Insert own"
  on public.hrms_work_logs for insert
  with check (
    employee_id in (select id from public.hrms_employees where auth_id = auth.uid())
  );
