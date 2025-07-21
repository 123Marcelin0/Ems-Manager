-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums
CREATE TYPE employee_role AS ENUM ('manager', 'allrounder', 'versorger', 'verkauf', 'essen');
CREATE TYPE employment_type AS ENUM ('part_time', 'fixed');
CREATE TYPE event_status AS ENUM ('draft', 'recruiting', 'planned', 'active', 'completed', 'cancelled');
CREATE TYPE employee_event_status_enum AS ENUM ('not_asked', 'asked', 'available', 'unavailable', 'selected', 'working', 'completed');
CREATE TYPE time_record_status AS ENUM ('active', 'completed', 'cancelled');

-- Create employees table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    user_id VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    role employee_role NOT NULL,
    skills TEXT[] DEFAULT '{}',
    employment_type employment_type DEFAULT 'part_time',
    is_always_needed BOOLEAN DEFAULT false,
    last_worked_date TIMESTAMP,
    total_hours_worked DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    description TEXT,
    specialties TEXT,
    hourly_rate DECIMAL(8,2) NOT NULL,
    employees_needed INTEGER NOT NULL,
    employees_to_ask INTEGER NOT NULL,
    status event_status DEFAULT 'draft',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create work_areas table
CREATE TABLE work_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    max_capacity INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    role_requirements JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create employee_event_status table
CREATE TABLE employee_event_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    status employee_event_status_enum NOT NULL DEFAULT 'not_asked',
    asked_at TIMESTAMP,
    responded_at TIMESTAMP,
    response_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(employee_id, event_id)
);

-- Create work_assignments table
CREATE TABLE work_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    work_area_id UUID REFERENCES work_areas(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(employee_id, event_id)
);

-- Create time_records table
CREATE TABLE time_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id),
    event_id UUID REFERENCES events(id),
    work_area_id UUID REFERENCES work_areas(id),
    sign_in_time TIMESTAMP NOT NULL,
    sign_out_time TIMESTAMP,
    total_hours DECIMAL(5,2),
    hourly_rate DECIMAL(8,2) NOT NULL,
    total_payment DECIMAL(10,2),
    status time_record_status DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create whatsapp_messages table
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id),
    event_id UUID REFERENCES events(id),
    message_sid VARCHAR(255),
    phone_number VARCHAR(20) NOT NULL,
    message_body TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'invitation',
    delivery_status VARCHAR(50),
    sent_at TIMESTAMP DEFAULT NOW(),
    delivered_at TIMESTAMP,
    response_received_at TIMESTAMP,
    response_body TEXT
);

-- Create audit_logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_employees_last_worked_date ON employees(last_worked_date ASC NULLS FIRST);
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_employees_always_needed ON employees(is_always_needed);

CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_created_by ON events(created_by);

CREATE INDEX idx_employee_event_status_employee ON employee_event_status(employee_id);
CREATE INDEX idx_employee_event_status_event ON employee_event_status(event_id);
CREATE INDEX idx_employee_event_status_status ON employee_event_status(status);

CREATE INDEX idx_work_areas_event ON work_areas(event_id);
CREATE INDEX idx_work_assignments_employee ON work_assignments(employee_id);
CREATE INDEX idx_work_assignments_event ON work_assignments(event_id);

CREATE INDEX idx_time_records_employee ON time_records(employee_id);
CREATE INDEX idx_time_records_event ON time_records(event_id);
CREATE INDEX idx_time_records_status ON time_records(status);

CREATE INDEX idx_whatsapp_messages_employee ON whatsapp_messages(employee_id);
CREATE INDEX idx_whatsapp_messages_event ON whatsapp_messages(event_id);
CREATE INDEX idx_whatsapp_messages_delivery_status ON whatsapp_messages(delivery_status);

CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_event_status_updated_at BEFORE UPDATE ON employee_event_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_records_updated_at BEFORE UPDATE ON time_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for automatic time calculation
CREATE OR REPLACE FUNCTION calculate_time_record_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Only calculate if sign_out_time is set
    IF NEW.sign_out_time IS NOT NULL THEN
        -- Calculate total hours
        NEW.total_hours = EXTRACT(EPOCH FROM (NEW.sign_out_time - NEW.sign_in_time)) / 3600;
        -- Calculate total payment
        NEW.total_payment = NEW.total_hours * NEW.hourly_rate;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_time_totals BEFORE INSERT OR UPDATE ON time_records
    FOR EACH ROW EXECUTE FUNCTION calculate_time_record_totals();

-- Create trigger to update employee work history
CREATE OR REPLACE FUNCTION update_employee_work_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update when time record is completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE employees 
        SET 
            last_worked_date = NEW.sign_out_time,
            total_hours_worked = total_hours_worked + COALESCE(NEW.total_hours, 0)
        WHERE id = NEW.employee_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_work_history AFTER UPDATE ON time_records
    FOR EACH ROW EXECUTE FUNCTION update_employee_work_history();