/* 
  Fix duplicate employee records and link to your auth account
  Run this to clean up and fix the issue
*/

-- Step 1: See all your employee records
SELECT id, auth_id, first_name, last_name, email, employee_code, hrms_role, created_at
FROM public.hrms_employees 
WHERE email = 'senthilabi@yahoo.com'
ORDER BY created_at;

-- Step 2: Update your ORIGINAL employee record to link it to your auth account
UPDATE public.hrms_employees 
SET auth_id = auth.uid(),
    hrms_role = 'super_admin'
WHERE email = 'senthilabi@yahoo.com'
AND (auth_id IS NULL OR auth_id != auth.uid());

-- Step 3: Delete duplicate records (keep the oldest one)
DELETE FROM public.hrms_employees 
WHERE email = 'senthilabi@yahoo.com'
AND id NOT IN (
  SELECT id FROM public.hrms_employees 
  WHERE email = 'senthilabi@yahoo.com'
  ORDER BY created_at ASC
  LIMIT 1
);

-- Step 4: Verify - you should see only ONE record with your auth_id
SELECT id, auth_id, first_name, last_name, email, employee_code, hrms_role 
FROM public.hrms_employees 
WHERE email = 'senthilabi@yahoo.com';
