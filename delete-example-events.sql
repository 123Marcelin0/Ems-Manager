-- SQL Script to Delete Example Events and Related Data
-- Run this in your Supabase SQL Editor to clean up test/example data

-- First, delete related data to avoid foreign key constraints

-- Delete work assignments for example events
DELETE FROM work_assignments 
WHERE event_id IN (
    SELECT id FROM events 
    WHERE title LIKE '%Test%' 
    OR title LIKE '%Example%' 
    OR title LIKE '%Demo%'
    OR title = 'xdrdtzydr'
    OR description LIKE '%test%'
    OR description LIKE '%example%'
);

-- Delete employee event status for example events
DELETE FROM employee_event_status 
WHERE event_id IN (
    SELECT id FROM events 
    WHERE title LIKE '%Test%' 
    OR title LIKE '%Example%' 
    OR title LIKE '%Demo%
    OR title = 'xdrdtzydr'
    OR description LIKE '%test%'
    OR description LIKE '%example%'
);

-- Delete work areas for example events
DELETE FROM work_areas 
WHERE event_id IN (
    SELECT id FROM events 
    WHERE title LIKE '%Test%' 
    OR title LIKE '%Example%' 
    OR title LIKE '%Demo%'
    OR title = 'xdrdtzydr'
    OR description LIKE '%test%'
    OR description LIKE '%example%'
);

-- Delete time records for example events
DELETE FROM time_records 
WHERE event_id IN (
    SELECT id FROM events 
    WHERE title LIKE '%Test%' 
    OR title LIKE '%Example%' 
    OR title LIKE '%Demo%'
    OR title = 'xdrdtzydr'
    OR description LIKE '%test%'
    OR description LIKE '%example%'
);

-- Delete WhatsApp messages for example events
DELETE FROM whatsapp_messages 
WHERE event_id IN (
    SELECT id FROM events 
    WHERE title LIKE '%Test%' 
    OR title LIKE '%Example%' 
    OR title LIKE '%Demo%'
    OR title = 'xdrdtzydr'
    OR description LIKE '%test%'
    OR description LIKE '%example%'
);

-- Finally, delete the example events themselves
DELETE FROM events 
WHERE title LIKE '%Test%' 
OR title LIKE '%Example%' 
OR title LIKE '%Demo%'
OR title = 'xdrdtzydr'
OR description LIKE '%test%'
OR description LIKE '%example%'
OR status = 'draft' AND created_at < NOW() - INTERVAL '1 day'; -- Delete old draft events

-- Optional: Delete example employees (uncomment if needed)
-- DELETE FROM employees 
-- WHERE name LIKE '%Test%' 
-- OR name LIKE '%Example%' 
-- OR name LIKE '%Demo%'
-- OR phone_number LIKE '+123%'; -- Example phone numbers

-- Show remaining events count
SELECT COUNT(*) as remaining_events FROM events;

-- Show remaining employees count  
SELECT COUNT(*) as remaining_employees FROM employees;

-- Verify cleanup
SELECT 'Events' as table_name, COUNT(*) as count FROM events
UNION ALL
SELECT 'Work Areas', COUNT(*) FROM work_areas
UNION ALL
SELECT 'Work Assignments', COUNT(*) FROM work_assignments
UNION ALL
SELECT 'Employee Event Status', COUNT(*) FROM employee_event_status
UNION ALL
SELECT 'Time Records', COUNT(*) FROM time_records
UNION ALL
SELECT 'WhatsApp Messages', COUNT(*) FROM whatsapp_messages
UNION ALL
SELECT 'Employees', COUNT(*) FROM employees;