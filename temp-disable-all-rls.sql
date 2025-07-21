-- Temporarily disable RLS on all tables for development
-- WARNING: This should only be used in development environments!

-- Disable RLS on all tables
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_event_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE time_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- Note: To re-enable RLS, run the following commands:
-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE work_areas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE employee_event_status ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE work_assignments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;