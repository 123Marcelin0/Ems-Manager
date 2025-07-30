-- Disable RLS for single-user application
-- Apply this SQL in your Supabase SQL Editor to remove authentication requirements

-- Disable Row Level Security on all tables
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_event_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE time_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;

-- Optional: Drop all RLS policies (they won't be needed anymore)
DROP POLICY IF EXISTS "employees_select_own" ON employees;
DROP POLICY IF EXISTS "employees_select_managers" ON employees;
DROP POLICY IF EXISTS "employees_insert_managers" ON employees;
DROP POLICY IF EXISTS "employees_update_managers" ON employees;
DROP POLICY IF EXISTS "employees_delete_managers" ON employees;

DROP POLICY IF EXISTS "events_select_all" ON events;
DROP POLICY IF EXISTS "events_insert_managers" ON events;
DROP POLICY IF EXISTS "events_update_managers" ON events;
DROP POLICY IF EXISTS "events_delete_managers" ON events;

DROP POLICY IF EXISTS "work_areas_select_all" ON work_areas;
DROP POLICY IF EXISTS "work_areas_insert_managers" ON work_areas;
DROP POLICY IF EXISTS "work_areas_update_managers" ON work_areas;
DROP POLICY IF EXISTS "work_areas_delete_managers" ON work_areas;

DROP POLICY IF EXISTS "employee_event_status_select_own" ON employee_event_status;
DROP POLICY IF EXISTS "employee_event_status_insert_managers" ON employee_event_status;
DROP POLICY IF EXISTS "employee_event_status_update_managers" ON employee_event_status;
DROP POLICY IF EXISTS "employee_event_status_delete_managers" ON employee_event_status;

DROP POLICY IF EXISTS "work_assignments_select_own" ON work_assignments;
DROP POLICY IF EXISTS "work_assignments_insert_managers" ON work_assignments;
DROP POLICY IF EXISTS "work_assignments_update_managers" ON work_assignments;
DROP POLICY IF EXISTS "work_assignments_delete_managers" ON work_assignments;

DROP POLICY IF EXISTS "time_records_select_own" ON time_records;
DROP POLICY IF EXISTS "time_records_insert_managers" ON time_records;
DROP POLICY IF EXISTS "time_records_update_managers" ON time_records;
DROP POLICY IF EXISTS "time_records_delete_managers" ON time_records;

DROP POLICY IF EXISTS "whatsapp_messages_select_own" ON whatsapp_messages;
DROP POLICY IF EXISTS "whatsapp_messages_insert_managers" ON whatsapp_messages;
DROP POLICY IF EXISTS "whatsapp_messages_update_managers" ON whatsapp_messages;

DROP POLICY IF EXISTS "audit_logs_select_managers" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_system" ON audit_logs;

-- Drop templates table policies
DROP POLICY IF EXISTS "templates_select_all" ON templates;
DROP POLICY IF EXISTS "templates_insert_managers" ON templates;
DROP POLICY IF EXISTS "templates_update_managers" ON templates;
DROP POLICY IF EXISTS "templates_delete_managers" ON templates;

-- Optional: Drop helper functions (no longer needed)
-- Use CASCADE to drop dependent objects
DROP FUNCTION IF EXISTS is_manager(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_employee_id(TEXT) CASCADE;

-- Note: This makes your database accessible without authentication
-- Only use this for single-user applications or development environments