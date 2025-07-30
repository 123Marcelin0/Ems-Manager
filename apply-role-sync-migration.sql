-- Apply the employee role synchronization migration
\i supabase/migrations/006_employee_role_sync.sql

-- Test the role sync function
SELECT 'Testing role sync function...' as status;
SELECT * FROM sync_all_employee_roles();

-- Test role hierarchy function
SELECT 'Testing role hierarchy function...' as status;
SELECT * FROM get_role_hierarchy();

-- Test role validation function
SELECT 'Testing role validation function...' as status;
DO $$
DECLARE
    test_employee_id UUID;
BEGIN
    -- Get a test employee ID
    SELECT id INTO test_employee_id FROM employees LIMIT 1;
    
    IF test_employee_id IS NOT NULL THEN
        RAISE NOTICE 'Testing role validation for employee: %', test_employee_id;
        RAISE NOTICE 'Can perform manager role: %', validate_work_area_assignment(test_employee_id, 'manager');
        RAISE NOTICE 'Can perform essen role: %', validate_work_area_assignment(test_employee_id, 'essen');
    ELSE
        RAISE NOTICE 'No employees found for testing';
    END IF;
END $$;

SELECT 'Role sync migration applied successfully!' as status;