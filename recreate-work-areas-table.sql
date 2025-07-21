-- SQL Script to Recreate Work Areas Table with Improved Design
-- Run this in your Supabase SQL Editor

-- Step 1: Drop existing work areas table and related data
DROP TABLE IF EXISTS work_assignments CASCADE;
DROP TABLE IF EXISTS work_areas CASCADE;

-- Step 2: Recreate work_areas table with improved structure
CREATE TABLE work_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    max_capacity INTEGER NOT NULL DEFAULT 1,
    current_assigned INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    role_requirements JSONB NOT NULL DEFAULT '{}',
    required_skills TEXT[] DEFAULT '{}',
    color_theme VARCHAR(50) DEFAULT 'blue',
    position_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Step 3: Recreate work_assignments table with improved structure
CREATE TABLE work_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    work_area_id UUID REFERENCES work_areas(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    assigned_role VARCHAR(50),
    assigned_at TIMESTAMP DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'confirmed', 'completed', 'cancelled')),
    UNIQUE(employee_id, event_id) -- One assignment per employee per event
);

-- Step 4: Create indexes for performance
CREATE INDEX idx_work_areas_event_id ON work_areas(event_id);
CREATE INDEX idx_work_areas_location ON work_areas(location);
CREATE INDEX idx_work_areas_is_active ON work_areas(is_active);
CREATE INDEX idx_work_areas_priority ON work_areas(priority);
CREATE INDEX idx_work_areas_position_order ON work_areas(position_order);

CREATE INDEX idx_work_assignments_employee_id ON work_assignments(employee_id);
CREATE INDEX idx_work_assignments_work_area_id ON work_assignments(work_area_id);
CREATE INDEX idx_work_assignments_event_id ON work_assignments(event_id);
CREATE INDEX idx_work_assignments_status ON work_assignments(status);

-- Step 5: Add triggers for automatic timestamp updates
CREATE TRIGGER update_work_areas_updated_at 
    BEFORE UPDATE ON work_areas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Add RLS policies
ALTER TABLE work_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_assignments ENABLE ROW LEVEL SECURITY;

-- Work areas policies
CREATE POLICY "work_areas_select_all" ON work_areas
    FOR SELECT USING (true);

CREATE POLICY "work_areas_insert_managers" ON work_areas
    FOR INSERT WITH CHECK (is_manager(auth.uid()::text));

CREATE POLICY "work_areas_update_managers" ON work_areas
    FOR UPDATE USING (is_manager(auth.uid()::text));

CREATE POLICY "work_areas_delete_managers" ON work_areas
    FOR DELETE USING (is_manager(auth.uid()::text));

-- Work assignments policies
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

-- Step 7: Add audit triggers
CREATE TRIGGER audit_work_areas 
    AFTER INSERT OR UPDATE OR DELETE ON work_areas
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_work_assignments 
    AFTER INSERT OR UPDATE OR DELETE ON work_assignments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Step 8: Create helper functions for work areas
CREATE OR REPLACE FUNCTION update_work_area_capacity()
RETURNS TRIGGER AS $
BEGIN
    -- Update current_assigned count when assignments change
    IF TG_OP = 'INSERT' THEN
        UPDATE work_areas 
        SET current_assigned = (
            SELECT COUNT(*) 
            FROM work_assignments 
            WHERE work_area_id = NEW.work_area_id 
            AND status = 'assigned'
        )
        WHERE id = NEW.work_area_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE work_areas 
        SET current_assigned = (
            SELECT COUNT(*) 
            FROM work_assignments 
            WHERE work_area_id = OLD.work_area_id 
            AND status = 'assigned'
        )
        WHERE id = OLD.work_area_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Update both old and new work areas if work_area_id changed
        IF OLD.work_area_id != NEW.work_area_id THEN
            UPDATE work_areas 
            SET current_assigned = (
                SELECT COUNT(*) 
                FROM work_assignments 
                WHERE work_area_id = OLD.work_area_id 
                AND status = 'assigned'
            )
            WHERE id = OLD.work_area_id;
        END IF;
        
        UPDATE work_areas 
        SET current_assigned = (
            SELECT COUNT(*) 
            FROM work_assignments 
            WHERE work_area_id = NEW.work_area_id 
            AND status = 'assigned'
        )
        WHERE id = NEW.work_area_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$ LANGUAGE plpgsql;

-- Add trigger to automatically update capacity
CREATE TRIGGER update_capacity_on_assignment_change
    AFTER INSERT OR UPDATE OR DELETE ON work_assignments
    FOR EACH ROW EXECUTE FUNCTION update_work_area_capacity();

-- Step 9: Create view for work areas with assignment details
CREATE VIEW work_areas_with_assignments AS
SELECT 
    wa.id,
    wa.event_id,
    wa.name,
    wa.location,
    wa.description,
    wa.max_capacity,
    wa.current_assigned,
    wa.is_active,
    wa.priority,
    wa.role_requirements,
    wa.required_skills,
    wa.color_theme,
    wa.position_order,
    wa.created_at,
    wa.updated_at,
    e.title as event_title,
    e.event_date,
    COALESCE(
        json_agg(
            json_build_object(
                'id', wass.id,
                'employee_id', wass.employee_id,
                'employee_name', emp.name,
                'employee_role', emp.role,
                'assigned_role', wass.assigned_role,
                'assigned_at', wass.assigned_at,
                'status', wass.status
            )
        ) FILTER (WHERE wass.id IS NOT NULL),
        '[]'::json
    ) as assignments
FROM work_areas wa
LEFT JOIN events e ON wa.event_id = e.id
LEFT JOIN work_assignments wass ON wa.id = wass.work_area_id AND wass.status = 'assigned'
LEFT JOIN employees emp ON wass.employee_id = emp.id
GROUP BY wa.id, wa.event_id, wa.name, wa.location, wa.description, wa.max_capacity, 
         wa.current_assigned, wa.is_active, wa.priority, wa.role_requirements, 
         wa.required_skills, wa.color_theme, wa.position_order, wa.created_at, 
         wa.updated_at, e.title, e.event_date;

-- Step 10: Verification queries
SELECT 'Work Areas Table' as table_name, COUNT(*) as count FROM work_areas
UNION ALL
SELECT 'Work Assignments Table', COUNT(*) FROM work_assignments
UNION ALL
SELECT 'Work Areas View', COUNT(*) FROM work_areas_with_assignments;

-- Show table structure
\d work_areas;
\d work_assignments;