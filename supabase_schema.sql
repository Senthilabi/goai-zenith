/* 1. PROFILES TABLE */
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text default 'employee',
  department text,
  designation text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone" 
  on public.profiles for select using (true);

create policy "Users can insert their own profile" 
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile" 
  on public.profiles for update using (auth.uid() = id);


/* 2. ATTENDANCE TABLE */
create table if not exists public.attendance (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date default current_date not null,
  clock_in timestamptz default now(),
  clock_out timestamptz,
  status text default 'present',
  created_at timestamptz default now()
);

alter table public.attendance enable row level security;

create policy "Users can view own attendance" 
  on public.attendance for select using (auth.uid() = user_id);

create policy "Users can insert own attendance" 
  on public.attendance for insert with check (auth.uid() = user_id);

create policy "Users can update own attendance" 
  on public.attendance for update using (auth.uid() = user_id);


/* 3. LEAVE REQUESTS TABLE */
create table if not exists public.leave_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  start_date date not null,
  end_date date not null,
  leave_type text not null,
  reason text,
  status text default 'pending',
  created_at timestamptz default now()
);

alter table public.leave_requests enable row level security;

create policy "Users can view own leaves" 
  on public.leave_requests for select using (auth.uid() = user_id);

create policy "Users can insert own leaves" 
  on public.leave_requests for insert with check (auth.uid() = user_id);


/* 5. ADMIN POLICIES (Add these to allow Admins to manage everything) */

/* Profiles */
create policy "Admins can view all profiles"
  on public.profiles for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update all profiles"
  on public.profiles for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete profiles"
  on public.profiles for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

/* Attendance */
create policy "Admins can view all attendance"
  on public.attendance for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

/* Leave Requests */
create policy "Admins can view all leave requests"
  on public.leave_requests for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update leave requests (Approve/Reject)"
  on public.leave_requests for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


/* 4. TRIGGER FOR NEW USERS */
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

/* Drop trigger if exists to avoid error on multiple runs */
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
