-- Migration to ensure proper employee role synchronization
-- This migration adds functions and triggers to maintain role consistency

-- Create function to validate employee roles
CREATE OR REPLACE FUNCTION validate_employee_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure role is valid
    IF NEW.role NOT IN ('manager', 'allrounder', 'versorger', 'verkauf', 'essen') THEN
        RAISE EXCEPTION 'Invalid role: %. Valid roles are: manager, allrounder, versorger, verkauf, essen', NEW.role;
    END IF;
    
    -- Update skills based on role hierarchy
    CASE NEW.role
        WHEN 'manager' THEN
            NEW.skills = array_append(
                array_remove(NEW.skills, 'manager'),
                'manager'
            );
            NEW.skills = array_append(
                array_remove(NEW.skills, 'allrounder'),
                'allrounder'
            );
            NEW.skills = array_append(
                array_remove(NEW.skills, 'versorger'),
                'versorger'
            );
            NEW.skills = array_append(
                array_remove(NEW.skills, 'verkauf'),
                'verkauf'
            );
            NEW.skills = array_append(
                array_remove(NEW.skills, 'essen'),
                'essen'
            );
        WHEN 'allrounder' THEN
            NEW.skills = array_remove(NEW.skills, 'manager');
            NEW.skills = array_append(
                array_remove(NEW.skills, 'allrounder'),
                'allrounder'
            );
            NEW.skills = array_append(
                array_remove(NEW.skills, 'versorger'),
                'versorger'
            );
            NEW.skills = array_append(
                array_remove(NEW.skills, 'verkauf'),
                'verkauf'
            );
            NEW.skills = array_append(
                array_remove(NEW.skills, 'essen'),
                'essen'
            );
        WHEN 'versorger' THEN
            NEW.skills = array_remove(NEW.skills, 'manager');
            NEW.skills = array_remove(NEW.skills, 'allrounder');
            NEW.skills = array_append(
                array_remove(NEW.skills, 'versorger'),
                'versorger'
            );
            NEW.skills = array_append(
                array_remove(NEW.skills, 'verkauf'),
                'verkauf'
            );
            NEW.skills = array_append(
                array_remove(NEW.skills, 'essen'),
                'essen'
            );
        WHEN 'verkauf' THEN
            NEW.skills = array_remove(NEW.skills, 'manager');
            NEW.skills = array_remove(NEW.skills, 'allrounder');
            NEW.skills = array_remove(NEW.skills, 'versorger');
            NEW.skills = array_append(
                array_remove(NEW.skills, 'verkauf'),
                'verkauf'
            );
            NEW.skills = array_append(
                array_remove(NEW.skills, 'essen'),
                'essen'
            );
        WHEN 'essen' THEN
            NEW.skills = array_remove(NEW.skills, 'manager');
            NEW.skills = array_remove(NEW.skills, 'allrounder');
            NEW.skills = array_remove(NEW.skills, 'versorger');
            NEW.skills = array_remove(NEW.skills, 'verkauf');
            NEW.skills = array_append(
                array_remove(NEW.skills, 'essen'),
                'essen'
            );
    END CASE;
    
    -- Remove duplicates and nulls
    NEW.skills = array_remove(array_agg(DISTINCT unnest), NULL) 
    FROM unnest(NEW.skills) AS unnest;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate roles on insert/update
DROP TRIGGER IF EXISTS validate_employee_role_trigger ON employees;
CREATE TRIGGER validate_employee_role_trigger
    BEFORE INSERT OR UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION validate_employee_role();

-- Create function to sync all employee roles
CREATE OR REPLACE FUNCTION sync_all_employee_roles()
RETURNS TABLE(
    employee_id UUID,
    employee_name VARCHAR(255),
    old_role employee_role,
    new_role employee_role,
    old_skills TEXT[],
    new_skills TEXT[],
    status TEXT
) AS $$
DECLARE
    emp_record RECORD;
    updated_skills TEXT[];
BEGIN
    -- Loop through all employees
    FOR emp_record IN 
        SELECT id, name, role, skills FROM employees ORDER BY name
    LOOP
        -- Calculate new skills based on role
        CASE emp_record.role
            WHEN 'manager' THEN
                updated_skills = ARRAY['manager', 'allrounder', 'versorger', 'verkauf', 'essen'];
            WHEN 'allrounder' THEN
                updated_skills = ARRAY['allrounder', 'versorger', 'verkauf', 'essen'];
            WHEN 'versorger' THEN
                updated_skills = ARRAY['versorger', 'verkauf', 'essen'];
            WHEN 'verkauf' THEN
                updated_skills = ARRAY['verkauf', 'essen'];
            WHEN 'essen' THEN
                updated_skills = ARRAY['essen'];
            ELSE
                updated_skills = ARRAY['essen'];
        END CASE;
        
        -- Add non-role skills back
        updated_skills = updated_skills || 
            (SELECT array_agg(skill) FROM unnest(emp_record.skills) AS skill 
             WHERE skill NOT IN ('manager', 'allrounder', 'versorger', 'verkauf', 'essen'));
        
        -- Remove nulls and duplicates
        updated_skills = array_remove(array_agg(DISTINCT unnest), NULL) 
        FROM unnest(updated_skills) AS unnest;
        
        -- Update employee if skills changed
        IF updated_skills != emp_record.skills OR updated_skills IS NULL THEN
            UPDATE employees 
            SET skills = updated_skills, updated_at = NOW()
            WHERE id = emp_record.id;
            
            -- Return result
            employee_id := emp_record.id;
            employee_name := emp_record.name;
            old_role := emp_record.role;
            new_role := emp_record.role;
            old_skills := emp_record.skills;
            new_skills := updated_skills;
            status := 'updated';
            RETURN NEXT;
        ELSE
            -- Return unchanged result
            employee_id := emp_record.id;
            employee_name := emp_record.name;
            old_role := emp_record.role;
            new_role := emp_record.role;
            old_skills := emp_record.skills;
            new_skills := emp_record.skills;
            status := 'unchanged';
            RETURN NEXT;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create function to get role hierarchy information
CREATE OR REPLACE FUNCTION get_role_hierarchy()
RETURNS TABLE(
    role_name employee_role,
    role_label TEXT,
    role_description TEXT,
    can_perform employee_role[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'manager'::employee_role as role_name,
        'Manager' as role_label,
        'Kann alle Rollen ausführen' as role_description,
        ARRAY['manager', 'allrounder', 'versorger', 'verkauf', 'essen']::employee_role[] as can_perform
    UNION ALL
    SELECT 
        'allrounder'::employee_role,
        'Allrounder',
        'Kann Versorger, Verkauf und Essen ausführen',
        ARRAY['allrounder', 'versorger', 'verkauf', 'essen']::employee_role[]
    UNION ALL
    SELECT 
        'versorger'::employee_role,
        'Versorger',
        'Kann Verkauf und Essen ausführen',
        ARRAY['versorger', 'verkauf', 'essen']::employee_role[]
    UNION ALL
    SELECT 
        'verkauf'::employee_role,
        'Verkauf',
        'Kann Essen ausführen',
        ARRAY['verkauf', 'essen']::employee_role[]
    UNION ALL
    SELECT 
        'essen'::employee_role,
        'Essen',
        'Basis-Rolle',
        ARRAY['essen']::employee_role[];
END;
$$ LANGUAGE plpgsql;

-- Create function to validate work area role assignments
CREATE OR REPLACE FUNCTION validate_work_area_assignment(
    p_employee_id UUID,
    p_required_role employee_role
)
RETURNS BOOLEAN AS $$
DECLARE
    employee_role employee_role;
    can_perform_roles employee_role[];
BEGIN
    -- Get employee's role
    SELECT role INTO employee_role
    FROM employees
    WHERE id = p_employee_id;
    
    IF employee_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get roles this employee can perform
    SELECT can_perform INTO can_perform_roles
    FROM get_role_hierarchy()
    WHERE role_name = employee_role;
    
    -- Check if employee can perform required role
    RETURN p_required_role = ANY(can_perform_roles);
END;
$$ LANGUAGE plpgsql;

-- Create index for better performance on role queries
CREATE INDEX IF NOT EXISTS idx_employees_role_skills ON employees USING GIN (skills);

-- Add comment to document the role hierarchy
COMMENT ON TYPE employee_role IS 'Employee role hierarchy: manager > allrounder > versorger > verkauf > essen. Higher roles can perform all lower role functions.';

-- Add comments to functions
COMMENT ON FUNCTION validate_employee_role() IS 'Trigger function to automatically update employee skills based on role hierarchy';
COMMENT ON FUNCTION sync_all_employee_roles() IS 'Function to synchronize all employee roles and skills according to hierarchy';
COMMENT ON FUNCTION get_role_hierarchy() IS 'Function to get role hierarchy information with permissions';
COMMENT ON FUNCTION validate_work_area_assignment(UUID, employee_role) IS 'Function to validate if an employee can be assigned to a role in a work area';