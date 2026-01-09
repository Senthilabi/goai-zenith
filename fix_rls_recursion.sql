/*
  FIX: INFINITE RECURSION IN RLS POLICIES
  
  Problem: The policy "Admins can view all profiles" queries 'hrms_employees' to check the role.
           Querying 'hrms_employees' triggers the policy again -> Infinite Loop.
  
  Solution: Use a SECURITY DEFINER function to fetch the role. 
            SECURITY DEFINER functions bypass RLS, breaking the loop.
*/

-- 1. Create the helper function
CREATE OR REPLACE FUNCTION public.get_hrms_role()
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT hrms_role 
    FROM public.hrms_employees 
    WHERE auth_id = auth.uid() 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing problematic policies on 'hrms_employees'
DROP POLICY IF EXISTS "HRMS: Admins can view all profiles" ON public.hrms_employees;
DROP POLICY IF EXISTS "HRMS: Admins can insert/update profiles" ON public.hrms_employees;

-- 3. Re-create policies using the safe function
CREATE POLICY "HRMS: Admins can view all profiles"
  ON public.hrms_employees FOR SELECT USING (
    get_hrms_role() IN ('super_admin', 'hr_admin')
  );

CREATE POLICY "HRMS: Admins can insert/update profiles"
  ON public.hrms_employees FOR ALL USING (
    get_hrms_role() IN ('super_admin', 'hr_admin')
  );

-- 4. Fix other tables to use the function for better performance/safety too

-- hrms_attendance
DROP POLICY IF EXISTS "HRMS: Admins view all attendance" ON public.hrms_attendance;
CREATE POLICY "HRMS: Admins view all attendance"
  ON public.hrms_attendance FOR SELECT USING (
    get_hrms_role() IN ('super_admin', 'hr_admin')
  );

-- hrms_leave_requests
DROP POLICY IF EXISTS "HRMS: Admins view all leaves" ON public.hrms_leave_requests;
CREATE POLICY "HRMS: Admins view all leaves"
  ON public.hrms_leave_requests FOR SELECT USING (
    get_hrms_role() IN ('super_admin', 'hr_admin')
  );

DROP POLICY IF EXISTS "HRMS: Admins manage leaves" ON public.hrms_leave_requests;
CREATE POLICY "HRMS: Admins manage leaves"
  ON public.hrms_leave_requests FOR UPDATE USING (
    get_hrms_role() IN ('super_admin', 'hr_admin')
  );

-- internship_applications (Also had the same issue)
DROP POLICY IF EXISTS "HR can view all applications" ON public.internship_applications;
CREATE POLICY "HR can view all applications"
  ON public.internship_applications FOR SELECT USING (
    get_hrms_role() IN ('super_admin', 'hr_admin')
  );

DROP POLICY IF EXISTS "HR can manage applications" ON public.internship_applications;
CREATE POLICY "HR can manage applications"
  ON public.internship_applications FOR ALL USING (
    get_hrms_role() IN ('super_admin', 'hr_admin')
  );
