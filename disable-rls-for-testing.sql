-- Temporarily disable RLS for work_areas table for testing
-- Run this in your Supabase SQL Editor to allow testing

-- Create a test manager user first
INSERT INTO employees (name, user_id, phone_number, role, employment_type, is_always_needed) 
VALUES ('Test Manager', 'test-manager-12345', '+1234567890', 'manager', 'full_time', true)
ON CONFLICT (user_id) DO NOTHING;

-- Option 1: Temporarily disable RLS on work_areas table
-- ALTER TABLE work_areas DISABLE ROW LEVEL SECURITY;

-- Option 2: Add a temporary policy for testing (recommended)
CREATE POLICY "work_areas_insert_development" ON work_areas
    FOR INSERT WITH CHECK (
        is_manager(auth.uid()::text) 
        OR auth.uid()::text = 'test-manager-12345'
        OR current_setting('app.environment', true) = 'development'
    );

-- Verify the test manager was created
SELECT id, name, user_id, role FROM employees WHERE user_id = 'test-manager-12345';

-- To re-enable RLS later (if using Option 1):
-- ALTER TABLE work_areas ENABLE ROW LEVEL SECURITY;

-- To remove the temporary policy (if using Option 2):
-- DROP POLICY IF EXISTS "work_areas_insert_development" ON work_areas; 