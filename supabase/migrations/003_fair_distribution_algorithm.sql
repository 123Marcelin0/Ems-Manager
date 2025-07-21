-- Fair Distribution Algorithm Function
CREATE OR REPLACE FUNCTION select_employees_for_event(
    p_event_id UUID,
    p_additional_count INTEGER DEFAULT 0
)
RETURNS TABLE(
    employee_id UUID,
    employee_name VARCHAR(255),
    last_worked_date TIMESTAMP,
    is_always_needed BOOLEAN,
    selection_reason VARCHAR(100)
) AS $$
DECLARE
    v_employees_to_ask INTEGER;
    v_always_needed_count INTEGER;
    v_part_time_needed INTEGER;
    v_current_asked_count INTEGER;
BEGIN
    -- Get the number of employees to ask for this event
    SELECT events.employees_to_ask INTO v_employees_to_ask
    FROM events 
    WHERE events.id = p_event_id;
    
    IF v_employees_to_ask IS NULL THEN
        RAISE EXCEPTION 'Event not found: %', p_event_id;
    END IF;
    
    -- Add additional count if specified
    v_employees_to_ask := v_employees_to_ask + p_additional_count;
    
    -- Count how many employees have already been asked
    SELECT COUNT(*) INTO v_current_asked_count
    FROM employee_event_status ees
    WHERE ees.event_id = p_event_id 
    AND ees.status != 'not_asked';
    
    -- Calculate how many more we need to ask
    v_employees_to_ask := v_employees_to_ask - v_current_asked_count;
    
    -- If we don't need to ask anyone else, return empty
    IF v_employees_to_ask <= 0 THEN
        RETURN;
    END IF;
    
    -- First, get all "always needed" employees who haven't been asked yet
    RETURN QUERY
    SELECT 
        e.id,
        e.name,
        e.last_worked_date,
        e.is_always_needed,
        'always_needed'::VARCHAR(100)
    FROM employees e
    LEFT JOIN employee_event_status ees ON e.id = ees.employee_id AND ees.event_id = p_event_id
    WHERE e.is_always_needed = true
    AND (ees.status IS NULL OR ees.status = 'not_asked')
    ORDER BY e.last_worked_date ASC NULLS FIRST;
    
    -- Count how many always needed employees we found
    GET DIAGNOSTICS v_always_needed_count = ROW_COUNT;
    
    -- Calculate how many part-time employees we still need
    v_part_time_needed := v_employees_to_ask - v_always_needed_count;
    
    -- If we still need more employees, select part-time employees by fair distribution
    IF v_part_time_needed > 0 THEN
        RETURN QUERY
        SELECT 
            e.id,
            e.name,
            e.last_worked_date,
            e.is_always_needed,
            'fair_distribution'::VARCHAR(100)
        FROM employees e
        LEFT JOIN employee_event_status ees ON e.id = ees.employee_id AND ees.event_id = p_event_id
        WHERE e.is_always_needed = false
        AND (ees.status IS NULL OR ees.status = 'not_asked')
        ORDER BY 
            e.last_worked_date ASC NULLS FIRST,  -- Prioritize those who haven't worked recently
            e.created_at ASC                     -- Then by registration date for tie-breaking
        LIMIT v_part_time_needed;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if more employees are needed for an event
CREATE OR REPLACE FUNCTION check_recruitment_status(p_event_id UUID)
RETURNS TABLE(
    employees_needed INTEGER,
    employees_asked INTEGER,
    employees_available INTEGER,
    employees_unavailable INTEGER,
    needs_more_recruitment BOOLEAN,
    suggested_additional_asks INTEGER
) AS $$
DECLARE
    v_employees_needed INTEGER;
    v_employees_asked INTEGER;
    v_employees_available INTEGER;
    v_employees_unavailable INTEGER;
    v_response_rate DECIMAL;
    v_suggested_additional INTEGER;
BEGIN
    -- Get event requirements
    SELECT events.employees_needed INTO v_employees_needed
    FROM events 
    WHERE events.id = p_event_id;
    
    -- Count current status
    SELECT 
        COUNT(*) FILTER (WHERE ees.status IN ('asked', 'available', 'unavailable')),
        COUNT(*) FILTER (WHERE ees.status = 'available'),
        COUNT(*) FILTER (WHERE ees.status = 'unavailable')
    INTO v_employees_asked, v_employees_available, v_employees_unavailable
    FROM employee_event_status ees
    WHERE ees.event_id = p_event_id;
    
    -- Calculate if we need more recruitment
    -- We need more if available employees < needed employees
    -- and we haven't asked enough to account for typical response rates
    
    IF v_employees_asked > 0 THEN
        v_response_rate := v_employees_available::DECIMAL / v_employees_asked::DECIMAL;
    ELSE
        v_response_rate := 0.6; -- Assume 60% response rate if no data
    END IF;
    
    -- Calculate suggested additional asks
    -- We want to have at least 20% buffer above needed employees
    v_suggested_additional := GREATEST(0, 
        CEIL((v_employees_needed * 1.2 - v_employees_available) / GREATEST(v_response_rate, 0.3)) - 
        (v_employees_asked - v_employees_available - v_employees_unavailable)
    );
    
    RETURN QUERY SELECT 
        v_employees_needed,
        v_employees_asked,
        v_employees_available,
        v_employees_unavailable,
        (v_employees_available < v_employees_needed AND v_suggested_additional > 0),
        v_suggested_additional;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically update employee event status
CREATE OR REPLACE FUNCTION update_employee_event_status(
    p_employee_id UUID,
    p_event_id UUID,
    p_new_status employee_event_status_enum,
    p_response_method VARCHAR(50) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated BOOLEAN := false;
BEGIN
    -- Insert or update employee event status
    INSERT INTO employee_event_status (
        employee_id, 
        event_id, 
        status, 
        asked_at,
        responded_at,
        response_method
    ) VALUES (
        p_employee_id,
        p_event_id,
        p_new_status,
        CASE WHEN p_new_status = 'asked' THEN NOW() ELSE NULL END,
        CASE WHEN p_new_status IN ('available', 'unavailable') THEN NOW() ELSE NULL END,
        p_response_method
    )
    ON CONFLICT (employee_id, event_id) 
    DO UPDATE SET 
        status = p_new_status,
        asked_at = CASE 
            WHEN p_new_status = 'asked' AND employee_event_status.asked_at IS NULL 
            THEN NOW() 
            ELSE employee_event_status.asked_at 
        END,
        responded_at = CASE 
            WHEN p_new_status IN ('available', 'unavailable') 
            THEN NOW() 
            ELSE employee_event_status.responded_at 
        END,
        response_method = COALESCE(p_response_method, employee_event_status.response_method),
        updated_at = NOW();
    
    v_updated := true;
    RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get employee selection summary for an event
CREATE OR REPLACE FUNCTION get_event_employee_summary(p_event_id UUID)
RETURNS TABLE(
    total_employees INTEGER,
    always_needed_count INTEGER,
    part_time_count INTEGER,
    not_asked_count INTEGER,
    asked_count INTEGER,
    available_count INTEGER,
    unavailable_count INTEGER,
    selected_count INTEGER,
    working_count INTEGER,
    completed_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_employees,
        COUNT(*) FILTER (WHERE e.is_always_needed = true)::INTEGER as always_needed_count,
        COUNT(*) FILTER (WHERE e.is_always_needed = false)::INTEGER as part_time_count,
        COUNT(*) FILTER (WHERE ees.status IS NULL OR ees.status = 'not_asked')::INTEGER as not_asked_count,
        COUNT(*) FILTER (WHERE ees.status = 'asked')::INTEGER as asked_count,
        COUNT(*) FILTER (WHERE ees.status = 'available')::INTEGER as available_count,
        COUNT(*) FILTER (WHERE ees.status = 'unavailable')::INTEGER as unavailable_count,
        COUNT(*) FILTER (WHERE ees.status = 'selected')::INTEGER as selected_count,
        COUNT(*) FILTER (WHERE ees.status = 'working')::INTEGER as working_count,
        COUNT(*) FILTER (WHERE ees.status = 'completed')::INTEGER as completed_count
    FROM employees e
    LEFT JOIN employee_event_status ees ON e.id = ees.employee_id AND ees.event_id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;