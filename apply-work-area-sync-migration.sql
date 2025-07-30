-- Apply the work area assignment synchronization migration
\i supabase/migrations/007_work_area_assignment_sync.sql

-- Test the work area assignment functions
SELECT 'Testing work area assignment functions...' as status;

-- Test get latest event function
SELECT 'Testing get_latest_event function...' as status;
SELECT * FROM get_latest_event();

-- Test sync work area assignments function
SELECT 'Testing sync_work_area_assignments function...' as status;
SELECT * FROM sync_work_area_assignments() LIMIT 5;

-- Test get work areas with assignments function (if events exist)
SELECT 'Testing get_work_areas_with_assignments function...' as status;
DO $$
DECLARE
    test_event_id UUID;
BEGIN
    -- Get a test event ID
    SELECT event_id INTO test_event_id FROM get_latest_event() LIMIT 1;
    
    IF test_event_id IS NOT NULL THEN
        RAISE NOTICE 'Testing work areas with assignments for event: %', test_event_id;
        PERFORM * FROM get_work_areas_with_assignments(test_event_id);
        RAISE NOTICE 'Work areas with assignments function tested successfully';
    ELSE
        RAISE NOTICE 'No events found for testing work areas with assignments';
    END IF;
END $$;

-- Test employee assignment functions (if employees and work areas exist)
SELECT 'Testing employee assignment functions...' as status;
DO $$
DECLARE
    test_employee_id UUID;
    test_work_area_id UUID;
    test_event_id UUID;
    assignment_result RECORD;
    removal_result RECORD;
BEGIN
    -- Get test IDs
    SELECT id INTO test_employee_id FROM employees LIMIT 1;
    SELECT event_id INTO test_event_id FROM get_latest_event() LIMIT 1;
    SELECT id INTO test_work_area_id FROM work_areas WHERE event_id = test_event_id LIMIT 1;
    
    IF test_employee_id IS NOT NULL AND test_work_area_id IS NOT NULL AND test_event_id IS NOT NULL THEN
        RAISE NOTICE 'Testing assignment for employee: %, work area: %, event: %', test_employee_id, test_work_area_id, test_event_id;
        
        -- Test assignment
        SELECT * INTO assignment_result FROM assign_employee_to_work_area(test_employee_id, test_work_area_id, test_event_id);
        RAISE NOTICE 'Assignment result: success=%, message=%', assignment_result.success, assignment_result.message;
        
        -- Test removal
        SELECT * INTO removal_result FROM remove_employee_from_work_area(test_employee_id, test_event_id);
        RAISE NOTICE 'Removal result: success=%, message=%', removal_result.success, removal_result.message;
    ELSE
        RAISE NOTICE 'Missing test data - employee: %, work_area: %, event: %', test_employee_id, test_work_area_id, test_event_id;
    END IF;
END $$;

SELECT 'Work area assignment sync migration applied successfully!' as status;
SELECT 'The following functions are now available:' as info;
SELECT '- sync_work_area_assignments()' as function_1;
SELECT '- get_work_areas_with_assignments(event_id)' as function_2;
SELECT '- assign_employee_to_work_area(employee_id, work_area_id, event_id)' as function_3;
SELECT '- remove_employee_from_work_area(employee_id, event_id)' as function_4;
SELECT '- get_latest_event()' as function_5;