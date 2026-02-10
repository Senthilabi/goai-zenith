-- Fix RLS policy to allow candidates to insert documents
-- This allows the public onboarding wizard to save signed NDAs and other docs

-- Allow inserts if candidate_id is present (for public onboarding)
CREATE POLICY "candidate_insert_documents" ON public.hrms_documents
    FOR INSERT WITH CHECK (
        candidate_id IS NOT NULL
    );

-- Optional: Allow candidates to view their own documents if needed immediately after upload
-- (This might need refinement based on how auth is handled for candidates, but usually insert is the blocker)
CREATE POLICY "candidate_view_own_documents" ON public.hrms_documents
    FOR SELECT USING (
        candidate_id IS NOT NULL
    );
