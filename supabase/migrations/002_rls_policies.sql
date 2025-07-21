-- Enable Row Level Security on all tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_event_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is a manager
CREATE OR REPLACE FUNCTION is_manager(user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM employees 
        WHERE employees.user_id = $1 
        AND role = 'manager'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get employee ID from auth user
CREATE OR REPLACE FUNCTION get_employee_id(user_id TEXT)
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM employees 
        WHERE employees.user_id = $1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Employees table policies
CREATE POLICY "employees_select_own" ON employees
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "employees_select_managers" ON employees
    FOR SELECT USING (is_manager(auth.uid()::text));

CREATE POLICY "employees_insert_managers" ON employees
    FOR INSERT WITH CHECK (is_manager(auth.uid()::text));

CREATE POLICY "employees_update_managers" ON employees
    FOR UPDATE USING (is_manager(auth.uid()::text));

CREATE POLICY "employees_delete_managers" ON employees
    FOR DELETE USING (is_manager(auth.uid()::text));

-- Events table policies
CREATE POLICY "events_select_all" ON events
    FOR SELECT USING (true); -- All authenticated users can view events

CREATE POLICY "events_insert_managers" ON events
    FOR INSERT WITH CHECK (is_manager(auth.uid()::text));

CREATE POLICY "events_update_managers" ON events
    FOR UPDATE USING (is_manager(auth.uid()::text));

CREATE POLICY "events_delete_managers" ON events
    FOR DELETE USING (is_manager(auth.uid()::text));

-- Work areas table policies
CREATE POLICY "work_areas_select_all" ON work_areas
    FOR SELECT USING (true); -- All authenticated users can view work areas

CREATE POLICY "work_areas_insert_managers" ON work_areas
    FOR INSERT WITH CHECK (is_manager(auth.uid()::text));

CREATE POLICY "work_areas_update_managers" ON work_areas
    FOR UPDATE USING (is_manager(auth.uid()::text));

CREATE POLICY "work_areas_delete_managers" ON work_areas
    FOR DELETE USING (is_manager(auth.uid()::text));

-- Employee event status table policies
CREATE POLICY "employee_event_status_select_own" ON employee_event_status
    FOR SELECT USING (
        employee_id = get_employee_id(auth.uid()::text) 
        OR is_manager(auth.uid()::text)
    );

CREATE POLICY "employee_event_status_insert_managers" ON employee_event_status
    FOR INSERT WITH CHECK (is_manager(auth.uid()::text));

CREATE POLICY "employee_event_status_update_managers" ON employee_event_status
    FOR UPDATE USING (is_manager(auth.uid()::text));

CREATE POLICY "employee_event_status_delete_managers" ON employee_event_status
    FOR DELETE USING (is_manager(auth.uid()::text));

-- Work assignments table policies
CREATE POLICY "work_assignments_select_own" ON work_assignments
    FOR SELECT USING (
        employee_id = get_employee_id(auth.uid()::text) 
        OR is_manager(auth.uid()::text)
    );

CREATE POLICY "work_assignments_insert_managers" ON work_assignments
    FOR INSERT WITH CHECK (is_manager(auth.uid()::text));

CREATE POLICY "work_assignments_update_managers" ON work_assignments
    FOR UPDATE USING (is_manager(auth.uid()::text));

CREATE POLICY "work_assignments_delete_managers" ON work_assignments
    FOR DELETE USING (is_manager(auth.uid()::text));

-- Time records table policies
CREATE POLICY "time_records_select_own" ON time_records
    FOR SELECT USING (
        employee_id = get_employee_id(auth.uid()::text) 
        OR is_manager(auth.uid()::text)
    );

CREATE POLICY "time_records_insert_managers" ON time_records
    FOR INSERT WITH CHECK (is_manager(auth.uid()::text));

CREATE POLICY "time_records_update_managers" ON time_records
    FOR UPDATE USING (is_manager(auth.uid()::text));

CREATE POLICY "time_records_delete_managers" ON time_records
    FOR DELETE USING (is_manager(auth.uid()::text));

-- WhatsApp messages table policies
CREATE POLICY "whatsapp_messages_select_own" ON whatsapp_messages
    FOR SELECT USING (
        employee_id = get_employee_id(auth.uid()::text) 
        OR is_manager(auth.uid()::text)
    );

CREATE POLICY "whatsapp_messages_insert_managers" ON whatsapp_messages
    FOR INSERT WITH CHECK (is_manager(auth.uid()::text));

CREATE POLICY "whatsapp_messages_update_managers" ON whatsapp_messages
    FOR UPDATE USING (is_manager(auth.uid()::text));

-- Audit logs table policies (managers only)
CREATE POLICY "audit_logs_select_managers" ON audit_logs
    FOR SELECT USING (is_manager(auth.uid()::text));

CREATE POLICY "audit_logs_insert_system" ON audit_logs
    FOR INSERT WITH CHECK (true); -- System can insert audit logs

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, user_id)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD), auth.uid());
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), auth.uid());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for all main tables
CREATE TRIGGER audit_employees AFTER INSERT OR UPDATE OR DELETE ON employees
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_events AFTER INSERT OR UPDATE OR DELETE ON events
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_employee_event_status AFTER INSERT OR UPDATE OR DELETE ON employee_event_status
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_time_records AFTER INSERT OR UPDATE OR DELETE ON time_records
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();