/*
  HRMS ONBOARDING UPDATES
  Description: Add columns for document verification
*/

alter table public.hrms_onboarding 
add column if not exists photo_url text,
add column if not exists id_proof_url text,
add column if not exists certificates_url text; -- store as comma-separated or just one archive link for now

-- Create storage bucket for onboarding docs if not exists
insert into storage.buckets (id, name, public)
values ('onboarding_docs', 'onboarding_docs', true)
on conflict (id) do nothing;

-- Allow public upload to this bucket (for the wizard)
create policy "Onboarding Docs: Public Upload"
on storage.objects for insert
with check ( bucket_id = 'onboarding_docs' );

create policy "Onboarding Docs: Public Read"
on storage.objects for select
using ( bucket_id = 'onboarding_docs' );
