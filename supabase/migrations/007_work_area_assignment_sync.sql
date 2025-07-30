-- Migration to enhance work area assignment synchronization
-- This migration adds functions and triggers to maintain work area assignment consistency

-- Create function to sync work area assignments
CREATE OR REPLACE FUNCTION sync_work_area_assignments()
RETURNS TABLE(
    assignment_id UUID,
    employee_name VARCHAR(255),
    work_area_name VARCHAR(255),
    event_title VARCHAR(255),
    status TEXT
) AS $$
DECLARE
    assignment_record RECORD;
BEGIN
    -- Loop through all work assignments
    FOR assignment_record IN 
        SELECT 
            wa.id as assignment_id,
            e.name as employee_name,
            w.name as work_area_name,
            ev.title as event_title,
            wa.assigned_at
        FROM work_assignments wa
        JOIN employees e ON wa.employee_id = e.id
        JOIN work_areas w ON wa.work_area_id = w.id
        JOIN events ev ON wa.event_id = ev.id
        ORDER BY wa.assigned_at DESC
    LOOP
        -- Return assignment info
        assignment_id := assignment_record.assignment_id;
        employee_name := assignment_record.employee_name;
        work_area_name := assignment_record.work_area_name;
        event_title := assignment_record.event_title;
        status := 'active';
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create function to get work areas with assignments for an event
CREATE OR REPLACE FUNCTION get_work_areas_with_assignments(p_event_id UUID)
RETURNS TABLE(
    work_area_id UUID,
    work_area_name VARCHAR(255),
    location VARCHAR(255),
    max_capacity INTEGER,
    is_active BOOLEAN,
    role_requirements JSONB,
    assigned_employees JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id as work_area_id,
        w.name as work_area_name,
        w.location,
        w.max_capacity,
        w.is_active,
        w.role_requirements,
        COALESCE(
            json_agg(
                json_build_object(
                    'id', e.id,
                    'name', e.name,
                    'role', e.role,
                    'user_id', e.user_id
                )
            ) FILTER (WHERE e.id IS NOT NULL),
            '[]'::json
        )::jsonb as assigned_employees
    FROM work_areas w
    LEFT JOIN work_assignments wa ON w.id = wa.work_area_id AND wa.event_id = p_event_id
    LEFT JOIN employees e ON wa.employee_id = e.id
    WHERE w.event_id = p_event_id
    GROUP BY w.id, w.name, w.location, w.max_capacity, w.is_active, w.role_requirements
    ORDER BY w.name;
END;
$$ LANGUAGE plpgsql;

-- Create function to assign employee to work area
CREATE OR REPLACE FUNCTION assign_employee_to_work_area(
    p_employee_id UUID,
    p_work_area_id UUID,
    p_event_id UUID
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    assignment_id UUID
) AS $$
DECLARE
    existing_assignment_id UUID;
    new_assignment_id UUID;
    work_area_capacity INTEGER;
    current_assignments INTEGER;
BEGIN
    -- Check if employee is already assigned to a work area for this event
    SELECT id INTO existing_assignment_id
    FROM work_assignments
    WHERE employee_id = p_employee_id AND event_id = p_event_id;
    
    -- Get work area capacity
    SELECT max_capacity INTO work_area_capacity
    FROM work_areas
    WHERE id = p_work_area_id;
    
    -- Count current assignments for this work area
    SELECT COUNT(*) INTO current_assignments
    FROM work_assignments
    WHERE work_area_id = p_work_area_id AND event_id = p_event_id;
    
    -- Check capacity
    IF current_assignments >= work_area_capacity THEN
        success := FALSE;
        message := 'Work area is at full capacity';
        assignment_id := NULL;
        RETURN NEXT;
        RETURN;
    END IF;
    
    IF existing_assignment_id IS NOT NULL THEN
        -- Update existing assignment
        UPDATE work_assignments
        SET work_area_id = p_work_area_id, assigned_at = NOW()
        WHERE id = existing_assignment_id;
        
        assignment_id := existing_assignment_id;
        success := TRUE;
        message := 'Employee assignment updated successfully';
    ELSE
        -- Create new assignment
        INSERT INTO work_assignments (employee_id, work_area_id, event_id, assigned_at)
        VALUES (p_employee_id, p_work_area_id, p_event_id, NOW())
        RETURNING id INTO new_assignment_id;
        
        assignment_id := new_assignment_id;
        success := TRUE;
        message := 'Employee assigned successfully';
    END IF;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Create function to remove employee from work area
CREATE OR REPLACE FUNCTION remove_employee_from_work_area(
    p_employee_id UUID,
    p_event_id UUID
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete the assignment
    DELETE FROM work_assignments
    WHERE employee_id = p_employee_id AND event_id = p_event_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    IF deleted_count > 0 THEN
        success := TRUE;
        message := 'Employee removed from work area successfully';
    ELSE
        success := FALSE;
        message := 'No assignment found for this employee';
    END IF;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Create function to get latest event
CREATE OR REPLACE FUNCTION get_latest_event()
RETURNS TABLE(
    event_id UUID,
    title VARCHAR(255),
    event_date DATE,
    employees_needed INTEGER,
    employees_to_ask INTEGER,
    status event_status
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id as event_id,
        e.title,
        e.event_date,
        e.employees_needed,
        e.employees_to_ask,
        e.status
    FROM events e
    ORDER BY e.event_date DESC, e.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update employee event status when assigned to work area
CREATE OR REPLACE FUNCTION update_employee_status_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Set employee status to 'selected' when assigned to work area
        INSERT INTO employee_event_status (employee_id, event_id, status, updated_at)
        VALUES (NEW.employee_id, NEW.event_id, 'selected', NOW())
        ON CONFLICT (employee_id, event_id)
        DO UPDATE SET status = 'selected', updated_at = NOW();
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Set employee status back to 'available' when removed from work area
        UPDATE employee_event_status
        SET status = 'available', updated_at = NOW()
        WHERE employee_id = OLD.employee_id AND event_id = OLD.event_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for work assignments
DROP TRIGGER IF EXISTS update_employee_status_on_assignment_trigger ON work_assignments;
CREATE TRIGGER update_employee_status_on_assignment_trigger
    AFTER INSERT OR DELETE ON work_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_employee_status_on_assignment();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_work_assignments_event_employee ON work_assignments(event_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_work_assignments_work_area ON work_assignments(work_area_id);
CREATE INDEX IF NOT EXISTS idx_work_assignments_assigned_at ON work_assignments(assigned_at DESC);

-- Add comments to document the functions
COMMENT ON FUNCTION sync_work_area_assignments() IS 'Function to get all work area assignments with employee and work area details';
COMMENT ON FUNCTION get_work_areas_with_assignments(UUID) IS 'Function to get work areas with their assigned employees for a specific event';
COMMENT ON FUNCTION assign_employee_to_work_area(UUID, UUID, UUID) IS 'Function to assign an employee to a work area with capacity checking';
COMMENT ON FUNCTION remove_employee_from_work_area(UUID, UUID) IS 'Function to remove an employee from their work area assignment';
COMMENT ON FUNCTION get_latest_event() IS 'Function to get the most recent event by date';
COMMENT ON FUNCTION update_employee_status_on_assignment() IS 'Trigger function to update employee event status when work area assignments change';