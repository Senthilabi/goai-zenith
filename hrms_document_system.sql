-- 1. Create Documents Table
CREATE TABLE IF NOT EXISTS public.hrms_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES public.internship_applications(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.hrms_employees(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL CHECK (doc_type IN ('offer_letter', 'nda', 'certificate', 'lor', 'relieving_letter')),
    file_path TEXT NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    issued_by UUID REFERENCES auth.users(id)
);

-- 2. Enable RLS
ALTER TABLE public.hrms_documents ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- HR Admins can see all documents
CREATE POLICY "hr_admin_docs_all" ON public.hrms_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM hrms_employees 
            WHERE auth_id = auth.uid() 
            AND hrms_role IN ('super_admin', 'hr_admin')
        )
    );

-- Employees can see their own documents
CREATE POLICY "employee_docs_own" ON public.hrms_documents
    FOR SELECT USING (
        employee_id IN (
            SELECT id FROM hrms_employees WHERE auth_id = auth.uid()
        )
    );

-- 4. Storage Bucket Setup (Metadata)
-- Note: Buckets are usually created via the Supabase Dashboard or API. 
-- Below are the SQL policies for the bucket 'hrms_generated_docs'

-- Allow HR Admins full control over generated docs
CREATE POLICY "hr_admin_storage_all" ON storage.objects
    FOR ALL USING (
        bucket_id = 'hrms_generated_docs' AND
        EXISTS (
            SELECT 1 FROM public.hrms_employees 
            WHERE auth_id = auth.uid() 
            AND hrms_role IN ('super_admin', 'hr_admin')
        )
    );

-- Allow Employees to read their own generated docs
-- (Assuming path structure: {employee_id}/{doc_name}.pdf)
CREATE POLICY "employee_storage_read" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'hrms_generated_docs' AND
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.hrms_employees WHERE auth_id = auth.uid()
        )
    );
