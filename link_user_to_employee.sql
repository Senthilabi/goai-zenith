/* 
  Link your current user to an HRMS employee record
  This allows you to use the Clock In/Out feature
*/

-- Check if you already have an employee record
SELECT * FROM public.hrms_employees WHERE auth_id = auth.uid();

-- If the above returns no rows, run this to create your employee record:
INSERT INTO public.hrms_employees (
  auth_id, 
  first_name, 
  last_name, 
  email, 
  hrms_role, 
  employee_code, 
  designation,
  department,
  status
)
SELECT 
  id, 
  'Test', 
  'Employee', 
  email, 
  'super_admin',  -- Make yourself an admin
  'EMP-' || substring(id::text, 1, 8),
  'Developer',
  'Engineering',
  'active'
FROM auth.users
WHERE id = auth.uid()
AND NOT EXISTS (
  SELECT 1 FROM public.hrms_employees WHERE auth_id = auth.uid()
);

-- Verify it was created
SELECT * FROM public.hrms_employees WHERE auth_id = auth.uid();
