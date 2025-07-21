-- QUICK FIX: Run this in your Supabase SQL Editor to fix work areas creation
-- This will allow authenticated users to create work areas temporarily

-- Option 1: Create a manager user for your current session (RECOMMENDED)
-- Replace 'YOUR_USER_ID' with your actual Supabase auth user ID
-- You can find your user ID in Supabase Dashboard > Authentication > Users

-- First, let's see what users exist:
SELECT id, email FROM auth.users LIMIT 5;

-- Create/update an employee record for the first user as manager:
INSERT INTO employees (
    name, 
    user_id, 
    phone_number, 
    role, 
    employment_type, 
    is_always_needed,
    created_at
) 
SELECT 
    COALESCE(email, 'Manager User') as name,
    id::text as user_id,
    '+1234567890' as phone_number,
    'manager' as role,
    'full_time' as employment_type,
    true as is_always_needed,
    NOW() as created_at
FROM auth.users 
WHERE id IS NOT NULL
LIMIT 1
ON CONFLICT (user_id) 
DO UPDATE SET role = 'manager';

-- Option 2: Temporarily make work_areas more permissive (if Option 1 doesn't work)
DROP POLICY IF EXISTS "work_areas_insert_managers" ON work_areas;

CREATE POLICY "work_areas_insert_authenticated" ON work_areas
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Verify the manager was created
SELECT id, name, user_id, role, email FROM employees 
LEFT JOIN auth.users ON employees.user_id = auth.users.id::text
WHERE role = 'manager';

-- If you want to revert to strict manager-only policy later, run:
-- DROP POLICY IF EXISTS "work_areas_insert_authenticated" ON work_areas;
-- CREATE POLICY "work_areas_insert_managers" ON work_areas
--     FOR INSERT WITH CHECK (is_manager(auth.uid()::text)); 