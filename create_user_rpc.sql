-- Enable pgcrypto if not already enabled
create extension if not exists pgcrypto;

-- FUNCTION: create_user_for_employee
-- PURPOSE: Allows an Admin to create a Supabase Auth user without logging themselves out.
-- SECURITY: SECURITY DEFINER (Runs with high privileges).Restricted to Admins via Check.

CREATE OR REPLACE FUNCTION create_user_for_employee(
    new_email TEXT,
    new_password TEXT,
    new_employee_code TEXT,
    new_first_name TEXT,
    new_last_name TEXT,
    new_designation TEXT,
    new_photo_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
    result JSONB;
BEGIN
    -- 1. Security Check: Ensure the caller is an Admin (hrms_role = 'super_admin' or 'hr_admin')
    IF NOT EXISTS (
        SELECT 1 FROM public.hrms_employees 
        WHERE auth_id = auth.uid() 
        AND (hrms_role = 'super_admin' OR hrms_role = 'hr_admin')
    ) THEN
        RAISE EXCEPTION 'Access Denied: Only Admins can create users.';
    END IF;

    -- 2. Create the User in auth.users
    -- We manually insert into the internal auth schema. This is a common pattern for "Admin prevents user creation".
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', -- Default instance_id
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        new_email,
        crypt(new_password, gen_salt('bf')), -- Encrypt password
        now(), -- Auto-confirm email
        NULL,
        NULL,
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', new_first_name || ' ' || new_last_name),
        now(),
        now(),
        '',
        '',
        '',
        ''
    ) RETURNING id INTO new_user_id;

    -- 3. Insert into hrms_employees (or update if exists, but here we assume new)
    INSERT INTO public.hrms_employees (
        auth_id,
        first_name,
        last_name,
        email,
        employee_code,
        designation,
        department,
        status,
        hrms_role,
        joining_date,
        photo_url
    ) VALUES (
        new_user_id,
        new_first_name,
        new_last_name,
        new_email,
        new_employee_code,
        new_designation,
        'Engineering', -- Default for now
        'active',
        'employee',
        CURRENT_DATE,
        new_photo_url
    );

    -- 4. Return success
    result := jsonb_build_object(
        'success', true,
        'user_id', new_user_id,
        'email', new_email
    );

    RETURN result;

EXCEPTION WHEN OTHERS THEN
    -- Return error as JSON
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
