-- Additional Functions for Enhanced Employee Dashboard Functionality
-- Migration: 005_additional_functions.sql

-- Work Area Management Functions
CREATE OR REPLACE FUNCTION create_work_area_with_validation(
    p_event_id UUID,
    p_name VARCHAR(255),
    p_location VARCHAR(255),
    p_max_capacity INTEGER,
    p_role_requirements JSONB
)
RETURNS UUID AS $$
DECLARE
    v_work_area_id UUID;
    v_total_required INTEGER;
    v_event_employees_needed INTEGER;
BEGIN
    -- Get event's total employee requirement
    SELECT employees_needed INTO v_event_employees_needed
    FROM events WHERE id = p_event_id;
    
    -- Calculate total employees required by this work area
    SELECT SUM((value)::INTEGER) INTO v_total_required
    FROM jsonb_each_text(p_role_requirements);
    
    -- Create work area
    INSERT INTO work_areas (event_id, name, location, max_capacity, role_requirements)
    VALUES (p_event_id, p_name, p_location, p_max_capacity, p_role_requirements)
    RETURNING id INTO v_work_area_id;
    
    RETURN v_work_area_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process WhatsApp Response Function
CREATE OR REPLACE FUNCTION process_whatsapp_response(
    p_phone_number VARCHAR(20),
    p_message_body TEXT,
    p_message_sid VARCHAR(255)
)
RETURNS JSONB AS $$
DECLARE
    v_employee_id UUID;
    v_employee_name VARCHAR(255);
    v_response_type VARCHAR(20);
    v_events_waiting UUID[];
    v_event_id UUID;
    v_result JSONB;
BEGIN
    -- Find employee by phone number
    SELECT id, name INTO v_employee_id, v_employee_name
    FROM employees
    WHERE phone_number = p_phone_number;
    
    IF v_employee_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Employee not found'
        );
    END IF;
    
    -- Parse response (German/English)
    v_response_type := CASE 
        WHEN LOWER(p_message_body) ~ '(ja|yes|✅|kann arbeiten)' THEN 'available'
        WHEN LOWER(p_message_body) ~ '(nein|no|❌|kann nicht)' THEN 'unavailable'
        ELSE 'unclear'
    END;
    
    IF v_response_type = 'unclear' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Could not understand response',
            'employee_name', v_employee_name
        );
    END IF;
    
    -- Find events where employee was asked but hasn't responded
    SELECT ARRAY_AGG(event_id) INTO v_events_waiting
    FROM employee_event_status
    WHERE employee_id = v_employee_id
    AND status = 'asked';
    
    -- Update status for all waiting events
    FOR v_event_id IN SELECT unnest(v_events_waiting) LOOP
        PERFORM update_employee_event_status(
            v_employee_id,
            v_event_id,
            v_response_type::employee_event_status_enum,
            'whatsapp'
        );
        
        -- Log the response
        INSERT INTO whatsapp_messages (
            employee_id, event_id, message_sid, phone_number,
            message_body, message_type, response_body, response_received_at
        ) VALUES (
            v_employee_id, v_event_id, p_message_sid, p_phone_number,
            p_message_body, 'response', p_message_body, NOW()
        );
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'employee_name', v_employee_name,
        'response_type', v_response_type,
        'events_updated', array_length(v_events_waiting, 1)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Smart Time Record Management
CREATE OR REPLACE FUNCTION sign_out_employee(
    p_employee_id UUID,
    p_event_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_time_record_id UUID;
    v_sign_in_time TIMESTAMP;
    v_total_hours DECIMAL(5,2);
    v_total_payment DECIMAL(10,2);
BEGIN
    -- Find active time record
    SELECT id, sign_in_time INTO v_time_record_id, v_sign_in_time
    FROM time_records
    WHERE employee_id = p_employee_id
    AND event_id = p_event_id
    AND status = 'active'
    LIMIT 1;
    
    IF v_time_record_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No active time record found'
        );
    END IF;
    
    -- Update time record with sign out
    UPDATE time_records
    SET 
        sign_out_time = NOW(),
        status = 'completed',
        notes = p_notes,
        updated_at = NOW()
    WHERE id = v_time_record_id;
    
    -- Get calculated totals
    SELECT total_hours, total_payment INTO v_total_hours, v_total_payment
    FROM time_records WHERE id = v_time_record_id;
    
    -- Update employee event status to completed
    PERFORM update_employee_event_status(
        p_employee_id,
        p_event_id,
        'completed',
        'manual_signout'
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'total_hours', v_total_hours,
        'total_payment', v_total_payment,
        'sign_in_time', v_sign_in_time,
        'sign_out_time', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dashboard Analytics Function
CREATE OR REPLACE FUNCTION get_dashboard_analytics(p_time_period VARCHAR(20) DEFAULT 'month')
RETURNS JSONB AS $$
DECLARE
    v_period_start DATE;
    v_result JSONB;
    v_total_employees INTEGER;
    v_active_events INTEGER;
    v_completed_events INTEGER;
    v_total_hours DECIMAL(10,2);
    v_avg_response_rate DECIMAL(5,2);
BEGIN
    -- Calculate period start
    v_period_start := CASE 
        WHEN p_time_period = 'week' THEN CURRENT_DATE - INTERVAL '7 days'
        WHEN p_time_period = 'month' THEN CURRENT_DATE - INTERVAL '30 days'
        WHEN p_time_period = 'year' THEN CURRENT_DATE - INTERVAL '365 days'
        ELSE CURRENT_DATE - INTERVAL '30 days'
    END;
    
    -- Get basic counts
    SELECT COUNT(*) INTO v_total_employees FROM employees;
    SELECT COUNT(*) INTO v_active_events FROM events WHERE status IN ('recruiting', 'planned', 'active');
    SELECT COUNT(*) INTO v_completed_events FROM events WHERE status = 'completed' AND event_date >= v_period_start;
    
    -- Get total hours worked
    SELECT COALESCE(SUM(total_hours), 0) INTO v_total_hours
    FROM time_records
    WHERE created_at >= v_period_start
    AND status = 'completed';
    
    -- Calculate average response rate
    WITH event_responses AS (
        SELECT 
            e.id,
            COUNT(*) FILTER (WHERE ees.status = 'asked') as asked_count,
            COUNT(*) FILTER (WHERE ees.status IN ('available', 'unavailable')) as responded_count
        FROM events e
        LEFT JOIN employee_event_status ees ON e.id = ees.event_id
        WHERE e.event_date >= v_period_start
        AND e.status != 'draft'
        GROUP BY e.id
    )
    SELECT COALESCE(AVG(
        CASE WHEN asked_count > 0 
        THEN (responded_count::DECIMAL / asked_count::DECIMAL) * 100
        ELSE 0 END
    ), 0) INTO v_avg_response_rate
    FROM event_responses;
    
    RETURN jsonb_build_object(
        'total_employees', v_total_employees,
        'active_events', v_active_events,
        'completed_events', v_completed_events,
        'total_hours_worked', v_total_hours,
        'average_response_rate', v_avg_response_rate,
        'period', p_time_period,
        'period_start', v_period_start
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced trigger for automatic recruitment
CREATE OR REPLACE FUNCTION trigger_smart_recruitment()
RETURNS TRIGGER AS $$
DECLARE
    v_recruitment_status JSONB;
BEGIN
    -- Only trigger on status changes to 'unavailable'
    IF NEW.status = 'unavailable' AND (OLD.status IS NULL OR OLD.status != 'unavailable') THEN
        -- Check if this event needs more recruitment
        SELECT to_jsonb(r.*) INTO v_recruitment_status
        FROM check_recruitment_status(NEW.event_id) r;
        
        -- If needs more recruitment, trigger additional asks
        IF (v_recruitment_status->>'needs_more_recruitment')::boolean THEN
            -- This will be handled by your API lifecycle endpoint
            -- But we can log it for monitoring
            INSERT INTO audit_logs (table_name, record_id, action, new_values, user_id)
            VALUES (
                'auto_recruitment_trigger',
                NEW.event_id,
                'NEEDS_MORE_RECRUITMENT',
                jsonb_build_object(
                    'suggested_additional_asks', v_recruitment_status->>'suggested_additional_asks',
                    'current_available', v_recruitment_status->>'employees_available',
                    'trigger_employee', NEW.employee_id
                ),
                NULL
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER smart_recruitment_trigger 
AFTER UPDATE ON employee_event_status
FOR EACH ROW EXECUTE FUNCTION trigger_smart_recruitment();

-- Employee performance view
CREATE VIEW employee_performance_summary AS
SELECT 
    e.id,
    e.name,
    e.employment_type,
    e.is_always_needed,
    e.total_hours_worked,
    e.last_worked_date,
    COUNT(DISTINCT ees.event_id) FILTER (WHERE ees.status = 'completed') as events_completed,
    COUNT(DISTINCT ees.event_id) FILTER (WHERE ees.status = 'available') as events_available,
    COUNT(DISTINCT ees.event_id) FILTER (WHERE ees.status = 'unavailable') as events_declined,
    COALESCE(AVG(tr.hourly_rate), 0) as avg_hourly_rate,
    COALESCE(SUM(tr.total_payment), 0) as total_earnings
FROM employees e
LEFT JOIN employee_event_status ees ON e.id = ees.employee_id
LEFT JOIN time_records tr ON e.id = tr.employee_id AND tr.status = 'completed'
GROUP BY e.id, e.name, e.employment_type, e.is_always_needed, e.total_hours_worked, e.last_worked_date;

-- Event status overview
CREATE VIEW event_status_overview AS
SELECT 
    e.id,
    e.title,
    e.event_date,
    e.status,
    e.employees_needed,
    e.employees_to_ask,
    COUNT(ees.id) FILTER (WHERE ees.status = 'asked') as employees_asked,
    COUNT(ees.id) FILTER (WHERE ees.status = 'available') as employees_available,
    COUNT(ees.id) FILTER (WHERE ees.status = 'unavailable') as employees_unavailable,
    COUNT(ees.id) FILTER (WHERE ees.status = 'working') as employees_working,
    COUNT(ees.id) FILTER (WHERE ees.status = 'completed') as employees_completed,
    COUNT(wa.id) as work_areas_count,
    COALESCE(SUM(tr.total_hours), 0) as total_hours_worked,
    COALESCE(SUM(tr.total_payment), 0) as total_event_cost
FROM events e
LEFT JOIN employee_event_status ees ON e.id = ees.event_id
LEFT JOIN work_areas wa ON e.id = wa.event_id
LEFT JOIN time_records tr ON e.id = tr.event_id AND tr.status = 'completed'
GROUP BY e.id, e.title, e.event_date, e.status, e.employees_needed, e.employees_to_ask;

-- Additional indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_messages_phone_date 
ON whatsapp_messages(phone_number, sent_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_records_event_status 
ON time_records(event_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_event_status_composite 
ON employee_event_status(event_id, status, asked_at);

-- Partial indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_active_recruiting 
ON events(event_date) 
WHERE status IN ('recruiting', 'planned', 'active');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_available_for_selection 
ON employees(last_worked_date ASC NULLS FIRST, created_at) 
WHERE employment_type = 'part_time'; 