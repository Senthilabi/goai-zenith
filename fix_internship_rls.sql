/*
  FIX: Allow anonymous users to submit internship applications
  Run this if you're getting permission errors
*/

-- Drop the existing insert policy
drop policy if exists "Anyone can submit applications" on public.internship_applications;

-- Create a new policy that explicitly allows anonymous users
create policy "Anyone can submit applications"
  on public.internship_applications for insert
  with check (true);

-- Verify the policy is active
select * from pg_policies where tablename = 'internship_applications';
