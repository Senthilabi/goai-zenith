-- SQL SCRIPT: Link Existing Employee to Auth
-- TARGET EMAIL: Karthik.s@go-aitech.com

DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
    target_email TEXT := 'Karthik.s@go-aitech.com';
    temp_password TEXT := 'HRMS*2025'; 
BEGIN
    -- 1. Check if the Auth user already exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = target_email) THEN
        SELECT id INTO new_user_id FROM auth.users WHERE email = target_email;
    ELSE
        -- 2. Create the User in auth.users
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
            created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            target_email,
            crypt(temp_password, gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name": "Karthik Swaminathan"}',
            now(), now()
        );
    END IF;

    -- 3. Link the employee record (Standard Employee access by default)
    UPDATE public.hrms_employees
    SET auth_id = new_user_id,
        hrms_role = 'employee'  -- Set to standard employee for security
    WHERE email = target_email;

    RAISE NOTICE 'Employee record for % has been linked with Standard Access.', target_email;
END $$;
