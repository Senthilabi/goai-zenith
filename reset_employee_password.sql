-- RPC Function: Reset Password for Existing Employee
-- PURPOSE: Generate a new password for employees who already have Auth accounts
-- USE CASE: Password reset by HR Admin

CREATE OR REPLACE FUNCTION reset_employee_password(
    employee_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    emp_record RECORD;
    new_password TEXT;
    result JSONB;
BEGIN
    -- 1. Security Check: Ensure the caller is an Admin
    IF NOT EXISTS (
        SELECT 1 FROM public.hrms_employees 
        WHERE auth_id = auth.uid() 
        AND (hrms_role = 'super_admin' OR hrms_role = 'hr_admin')
    ) THEN
        RAISE EXCEPTION 'Access Denied: Only Admins can reset passwords.';
    END IF;

    -- 2. Get employee details
    SELECT * INTO emp_record 
    FROM public.hrms_employees 
    WHERE id = employee_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Employee not found';
    END IF;

    -- 3. Check if employee has auth account
    IF emp_record.auth_id IS NULL THEN
        RAISE EXCEPTION 'Employee does not have a login account. Use "Generate Login" instead.';
    END IF;

    -- 4. Generate new password
    new_password := 'Reset' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') || '!';

    -- 5. Update password in auth.users
    UPDATE auth.users 
    SET 
        encrypted_password = crypt(new_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = emp_record.auth_id;

    -- 6. Return success with new password
    result := jsonb_build_object(
        'success', true,
        'email', emp_record.email,
        'password', new_password,
        'employee_code', emp_record.employee_code,
        'employee_name', emp_record.first_name || ' ' || emp_record.last_name
    );

    RETURN result;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reset_employee_password(UUID) TO authenticated;
