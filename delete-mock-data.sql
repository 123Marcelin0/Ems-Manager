-- ===================================
-- DELETE EVENT DATA (KEEP EMPLOYEES AS EXAMPLES)
-- ===================================
-- This script will remove event-related data while keeping employees intact
-- Run these commands in your Supabase SQL editor or database client

-- Start transaction to ensure data consistency
BEGIN;

-- Delete event-related data first (to avoid foreign key constraint errors)

-- 1. Delete employee event status records (relationships between employees and events)
DELETE FROM employee_event_status;

-- 2. Delete work assignments (correct table name)
DELETE FROM work_assignments WHERE work_area_id IS NOT NULL;

-- 3. Delete work areas (event-specific configurations)
DELETE FROM work_areas;

-- 4. Delete templates (correct table name)
DELETE FROM templates;

-- 5. Delete time records (event-specific work logs)
DELETE FROM time_records;

-- 6. Delete WhatsApp messages (event-specific communications)
DELETE FROM whatsapp_messages;

-- 7. Delete audit logs related to events (optional - cleanup event-related logs)
DELETE FROM audit_logs WHERE table_name IN ('events', 'work_areas', 'work_assignments', 'employee_event_status');

-- 8. Delete events (this will cascade to related records if foreign keys are set up properly)
DELETE FROM events;

-- 9. KEEP EMPLOYEES - They will remain as examples for Mitteilungen and Rollen pages
-- DELETE FROM employees; -- ❌ COMMENTED OUT - Keep employees as examples

-- 10. Reset any auto-incrementing sequences for deleted data only
-- Uncomment these if you have SERIAL/auto-increment columns
-- ALTER SEQUENCE events_id_seq RESTART WITH 1;
-- ALTER SEQUENCE work_areas_id_seq RESTART WITH 1;
-- ALTER SEQUENCE employee_event_status_id_seq RESTART WITH 1;
-- ALTER SEQUENCE work_assignments_id_seq RESTART WITH 1;

-- Commit the transaction
COMMIT;

-- ===================================
-- VERIFICATION QUERIES
-- ===================================
-- Run these to verify event data has been deleted but employees remain

SELECT 'employees' as table_name, COUNT(*) as record_count FROM employees
UNION ALL
SELECT 'events', COUNT(*) FROM events
UNION ALL
SELECT 'work_areas', COUNT(*) FROM work_areas
UNION ALL
SELECT 'employee_event_status', COUNT(*) FROM employee_event_status
UNION ALL
SELECT 'work_assignments', COUNT(*) FROM work_assignments
UNION ALL
SELECT 'templates', COUNT(*) FROM templates
UNION ALL
SELECT 'time_records', COUNT(*) FROM time_records
UNION ALL
SELECT 'whatsapp_messages', COUNT(*) FROM whatsapp_messages
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs;

-- ===================================
-- EXPECTED RESULTS AFTER CLEANUP
-- ===================================
-- employees: Should have records (kept as examples)
-- events: Should be 0 (deleted)
-- work_areas: Should be 0 (deleted)  
-- employee_event_status: Should be 0 (deleted)
-- work_assignments: Should be 0 (deleted)
-- templates: Should be 0 (deleted)
-- time_records: Should be 0 (deleted)
-- whatsapp_messages: Should be 0 (deleted)
-- audit_logs: Should have fewer records (event-related logs deleted)

-- ===================================
-- OPTIONAL: RESET EMPLOYEE EVENT RELATIONSHIPS
-- ===================================
-- If you want to also reset employee work history while keeping the employees:
-- (This is optional - uncomment if needed)

/*
UPDATE employees SET 
  last_worked_date = NULL,
  total_hours_worked = 0,
  updated_at = NOW()
WHERE id IS NOT NULL;
*/ 