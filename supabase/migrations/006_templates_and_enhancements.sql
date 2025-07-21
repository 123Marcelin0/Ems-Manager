-- Migration: 006_templates_and_enhancements.sql
-- Add templates table and enhance existing schema for proper event/work area management

-- Create templates table for storing reusable event and work area configurations
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('event', 'work_area', 'combined')),
    location VARCHAR(255),
    event_data JSONB DEFAULT '{}',
    work_areas_data JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for templates
CREATE INDEX idx_templates_type ON templates(template_type);
CREATE INDEX idx_templates_location ON templates(location);
CREATE INDEX idx_templates_created_by ON templates(created_by);

-- Add is_template field to events table to mark template events
ALTER TABLE events ADD COLUMN is_template BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN template_id UUID REFERENCES templates(id);

-- Create indexes for new event fields
CREATE INDEX idx_events_is_template ON events(is_template);
CREATE INDEX idx_events_template_id ON events(template_id);

-- Enhanced function to create event with work areas
CREATE OR REPLACE FUNCTION create_event_with_work_areas(
    p_event_data JSONB,
    p_work_areas_data JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_event_id UUID;
    v_work_area JSONB;
    v_work_area_id UUID;
    v_result JSONB;
BEGIN
    -- Create the event
    INSERT INTO events (
        title, location, event_date, start_time, end_time, 
        description, specialties, hourly_rate, employees_needed, 
        employees_to_ask, status, created_by, is_template, template_id
    )
    SELECT 
        (p_event_data->>'title')::VARCHAR(255),
        (p_event_data->>'location')::VARCHAR(255),
        (p_event_data->>'event_date')::DATE,
        (p_event_data->>'start_time')::TIME,
        (p_event_data->>'end_time')::TIME,
        (p_event_data->>'description')::TEXT,
        (p_event_data->>'specialties')::TEXT,
        (p_event_data->>'hourly_rate')::DECIMAL(8,2),
        (p_event_data->>'employees_needed')::INTEGER,
        (p_event_data->>'employees_to_ask')::INTEGER,
        COALESCE((p_event_data->>'status')::event_status, 'draft'),
        auth.uid(),
        COALESCE((p_event_data->>'is_template')::BOOLEAN, false),
        (p_event_data->>'template_id')::UUID
    RETURNING id INTO v_event_id;

    -- Create work areas if provided
    IF jsonb_array_length(p_work_areas_data) > 0 THEN
        FOR v_work_area IN SELECT * FROM jsonb_array_elements(p_work_areas_data)
        LOOP
            INSERT INTO work_areas (
                event_id, name, location, max_capacity, role_requirements, is_active
            )
            VALUES (
                v_event_id,
                (v_work_area->>'name')::VARCHAR(255),
                (v_work_area->>'location')::VARCHAR(255),
                (v_work_area->>'max_capacity')::INTEGER,
                (v_work_area->'role_requirements')::JSONB,
                COALESCE((v_work_area->>'is_active')::BOOLEAN, true)
            );
        END LOOP;
    END IF;

    -- Return the created event with work areas
    SELECT jsonb_build_object(
        'event_id', v_event_id,
        'event_data', to_jsonb(e.*),
        'work_areas', COALESCE(
            (SELECT jsonb_agg(to_jsonb(w.*)) FROM work_areas w WHERE w.event_id = v_event_id),
            '[]'::jsonb
        )
    ) INTO v_result
    FROM events e WHERE e.id = v_event_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save work assignments for an event
CREATE OR REPLACE FUNCTION save_work_assignments(
    p_event_id UUID,
    p_assignments JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_assignment JSONB;
    v_assignment_id UUID;
    v_results JSONB = '[]'::jsonb;
BEGIN
    -- Clear existing assignments for this event
    DELETE FROM work_assignments WHERE event_id = p_event_id;

    -- Insert new assignments
    FOR v_assignment IN SELECT * FROM jsonb_array_elements(p_assignments)
    LOOP
        INSERT INTO work_assignments (
            employee_id, work_area_id, event_id
        )
        VALUES (
            (v_assignment->>'employee_id')::UUID,
            (v_assignment->>'work_area_id')::UUID,
            p_event_id
        )
        RETURNING id INTO v_assignment_id;

        -- Add to results
        v_results = v_results || jsonb_build_object(
            'assignment_id', v_assignment_id,
            'employee_id', v_assignment->>'employee_id',
            'work_area_id', v_assignment->>'work_area_id',
            'event_id', p_event_id
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'assignments_count', jsonb_array_length(v_results),
        'assignments', v_results
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create template from existing event
CREATE OR REPLACE FUNCTION create_template_from_event(
    p_event_id UUID,
    p_template_name VARCHAR(255),
    p_template_type VARCHAR(50) DEFAULT 'combined'
)
RETURNS UUID AS $$
DECLARE
    v_template_id UUID;
    v_event_data JSONB;
    v_work_areas_data JSONB;
BEGIN
    -- Get event data
    SELECT jsonb_build_object(
        'title', title,
        'location', location,
        'description', description,
        'specialties', specialties,
        'hourly_rate', hourly_rate,
        'employees_needed', employees_needed,
        'employees_to_ask', employees_to_ask
    ) INTO v_event_data
    FROM events WHERE id = p_event_id;

    -- Get work areas data
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'name', name,
        'location', location,
        'max_capacity', max_capacity,
        'role_requirements', role_requirements,
        'is_active', is_active
    )), '[]'::jsonb) INTO v_work_areas_data
    FROM work_areas WHERE event_id = p_event_id;

    -- Create template
    INSERT INTO templates (
        name, template_type, location, event_data, work_areas_data, created_by
    )
    VALUES (
        p_template_name,
        p_template_type,
        v_event_data->>'location',
        v_event_data,
        v_work_areas_data,
        auth.uid()
    )
    RETURNING id INTO v_template_id;

    RETURN v_template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for templates
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_select_all" ON templates
    FOR SELECT USING (true);

CREATE POLICY "templates_insert_managers" ON templates
    FOR INSERT WITH CHECK (is_manager(auth.uid()::text));

CREATE POLICY "templates_update_managers" ON templates
    FOR UPDATE USING (is_manager(auth.uid()::text) OR created_by = auth.uid());

CREATE POLICY "templates_delete_managers" ON templates
    FOR DELETE USING (is_manager(auth.uid()::text) OR created_by = auth.uid());

-- Add trigger for template timestamp updates
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add audit trigger for templates
CREATE TRIGGER audit_templates AFTER INSERT OR UPDATE OR DELETE ON templates
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function(); 