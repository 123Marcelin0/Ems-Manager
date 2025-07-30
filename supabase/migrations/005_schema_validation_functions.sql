-- Schema validation and utility functions

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_table_columns(TEXT);
DROP FUNCTION IF EXISTS get_table_constraints(TEXT);
DROP FUNCTION IF EXISTS get_table_indexes(TEXT);
DROP FUNCTION IF EXISTS get_table_triggers(TEXT);
DROP FUNCTION IF EXISTS find_tables_without_primary_keys();
DROP FUNCTION IF EXISTS check_referential_integrity();
DROP FUNCTION IF EXISTS validate_work_area_jsonb();
DROP FUNCTION IF EXISTS check_enum_consistency();
DROP FUNCTION IF EXISTS analyze_index_usage();
DROP FUNCTION IF EXISTS recalculate_time_record(UUID);
DROP FUNCTION IF EXISTS find_orphaned_employee_event_status();
DROP FUNCTION IF EXISTS find_orphaned_work_assignments();

-- Function to get table columns with detailed information
CREATE OR REPLACE FUNCTION get_table_columns(table_name_param TEXT)
RETURNS TABLE (
    column_name TEXT,
    data_type TEXT,
    is_nullable TEXT,
    column_default TEXT,
    ordinal_position INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::TEXT,
        c.data_type::TEXT,
        c.is_nullable::TEXT,
        c.column_default::TEXT,
        c.ordinal_position::INTEGER
    FROM information_schema.columns c
    WHERE c.table_name = table_name_param
        AND c.table_schema = 'public'
    ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_table_columns(TEXT) TO authenticated;

-- Function to get table constraints
CREATE OR REPLACE FUNCTION get_table_constraints(table_name_param TEXT)
RETURNS TABLE (
    constraint_name TEXT,
    constraint_type TEXT,
    column_name TEXT,
    foreign_table_name TEXT,
    foreign_column_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tc.constraint_name::TEXT,
        tc.constraint_type::TEXT,
        kcu.column_name::TEXT,
        ccu.table_name::TEXT as foreign_table_name,
        ccu.column_name::TEXT as foreign_column_name
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
        AND tc.table_schema = ccu.table_schema
    WHERE tc.table_name = table_name_param
        AND tc.table_schema = 'public'
    ORDER BY tc.constraint_type, tc.constraint_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_table_constraints(TEXT) TO authenticated;

-- Function to get table indexes
CREATE OR REPLACE FUNCTION get_table_indexes(table_name_param TEXT)
RETURNS TABLE (
    index_name TEXT,
    table_name TEXT,
    is_unique BOOLEAN,
    index_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.relname::TEXT as index_name,
        t.relname::TEXT as table_name,
        ix.indisunique as is_unique,
        am.amname::TEXT as index_type
    FROM pg_class t
    JOIN pg_index ix ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_am am ON i.relam = am.oid
    WHERE t.relname = table_name_param
        AND t.relkind = 'r'
    GROUP BY i.relname, t.relname, ix.indisunique, am.amname
    ORDER BY i.relname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_table_indexes(TEXT) TO authenticated;

-- Function to get table triggers
CREATE OR REPLACE FUNCTION get_table_triggers(table_name_param TEXT)
RETURNS TABLE (
    trigger_name TEXT,
    event_manipulation TEXT,
    action_timing TEXT,
    action_statement TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.trigger_name::TEXT,
        t.event_manipulation::TEXT,
        t.action_timing::TEXT,
        t.action_statement::TEXT
    FROM information_schema.triggers t
    WHERE t.event_object_table = table_name_param
        AND t.trigger_schema = 'public'
    ORDER BY t.trigger_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_table_triggers(TEXT) TO authenticated;

-- Function to find tables without primary keys
CREATE OR REPLACE FUNCTION find_tables_without_primary_keys()
RETURNS TABLE (
    table_name TEXT,
    table_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::TEXT,
        t.table_type::TEXT
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints tc
            WHERE tc.table_name = t.table_name
                AND tc.table_schema = 'public'
                AND tc.constraint_type = 'PRIMARY KEY'
        )
    ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION find_tables_without_primary_keys() TO authenticated;

-- Function to check referential integrity
CREATE OR REPLACE FUNCTION check_referential_integrity()
RETURNS TABLE (
    table_name TEXT,
    column_name TEXT,
    foreign_table TEXT,
    foreign_column TEXT,
    orphaned_count BIGINT
) AS $$
DECLARE
    rec RECORD;
    query_text TEXT;
    orphaned_count BIGINT;
BEGIN
    FOR rec IN
        SELECT 
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
            ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
    LOOP
        query_text := format(
            'SELECT COUNT(*) FROM %I t1 LEFT JOIN %I t2 ON t1.%I = t2.%I WHERE t1.%I IS NOT NULL AND t2.%I IS NULL',
            rec.table_name,
            rec.foreign_table_name,
            rec.column_name,
            rec.foreign_column_name,
            rec.column_name,
            rec.foreign_column_name
        );
        
        EXECUTE query_text INTO orphaned_count;
        
        IF orphaned_count > 0 THEN
            table_name := rec.table_name;
            column_name := rec.column_name;
            foreign_table := rec.foreign_table_name;
            foreign_column := rec.foreign_column_name;
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_referential_integrity() TO authenticated;

-- Function to validate JSONB structure in work_areas
CREATE OR REPLACE FUNCTION validate_work_area_jsonb()
RETURNS TABLE (
    id UUID,
    field_name TEXT,
    issue TEXT
) AS $$
DECLARE
    rec RECORD;
    required_fields TEXT[] := ARRAY['name', 'description', 'capacity'];
    field TEXT;
BEGIN
    FOR rec IN SELECT wa.id, wa.details FROM work_areas wa WHERE wa.details IS NOT NULL
    LOOP
        -- Check if details is valid JSON
        BEGIN
            PERFORM rec.details::jsonb;
        EXCEPTION WHEN OTHERS THEN
            id := rec.id;
            field_name := 'details';
            issue := 'Invalid JSON structure';
            RETURN NEXT;
            CONTINUE;
        END;
        
        -- Check for required fields
        FOREACH field IN ARRAY required_fields
        LOOP
            IF NOT (rec.details ? field) THEN
                id := rec.id;
                field_name := field;
                issue := 'Missing required field';
                RETURN NEXT;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION validate_work_area_jsonb() TO authenticated;

-- Function to check enum value consistency
CREATE OR REPLACE FUNCTION check_enum_consistency()
RETURNS TABLE (
    table_name TEXT,
    column_name TEXT,
    invalid_value TEXT,
    count BIGINT
) AS $$
DECLARE
    valid_statuses TEXT[] := ARRAY['pending', 'confirmed', 'cancelled', 'completed'];
    valid_priorities TEXT[] := ARRAY['low', 'medium', 'high', 'urgent'];
BEGIN
    -- Check event status values
    FOR table_name, column_name, invalid_value, count IN
        SELECT 
            'events'::TEXT,
            'status'::TEXT,
            e.status::TEXT,
            COUNT(*)::BIGINT
        FROM events e
        WHERE e.status IS NOT NULL 
            AND NOT (e.status = ANY(valid_statuses))
        GROUP BY e.status
    LOOP
        RETURN NEXT;
    END LOOP;
    
    -- Check event priority values
    FOR table_name, column_name, invalid_value, count IN
        SELECT 
            'events'::TEXT,
            'priority'::TEXT,
            e.priority::TEXT,
            COUNT(*)::BIGINT
        FROM events e
        WHERE e.priority IS NOT NULL 
            AND NOT (e.priority = ANY(valid_priorities))
        GROUP BY e.priority
    LOOP
        RETURN NEXT;
    END LOOP;
    
    -- Add more enum checks as needed
    IF NOT FOUND THEN
        RETURN;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_enum_consistency() TO authenticated;

-- Function to analyze index usage (requires pg_stat_user_indexes)
CREATE OR REPLACE FUNCTION analyze_index_usage()
RETURNS TABLE (
    schemaname TEXT,
    tablename TEXT,
    indexname TEXT,
    idx_tup_read BIGINT,
    idx_tup_fetch BIGINT,
    usage_ratio NUMERIC
) AS $$
BEGIN
    BEGIN
        RETURN QUERY
        SELECT 
            psi.schemaname::TEXT,
            psi.tablename::TEXT,
            psi.indexname::TEXT,
            psi.idx_tup_read,
            psi.idx_tup_fetch,
            CASE 
                WHEN psi.idx_tup_read > 0 
                THEN ROUND((psi.idx_tup_fetch::NUMERIC / psi.idx_tup_read::NUMERIC) * 100, 2)
                ELSE 0
            END as usage_ratio
        FROM pg_stat_user_indexes psi
        WHERE psi.schemaname = 'public'
        ORDER BY usage_ratio DESC;
    EXCEPTION WHEN OTHERS THEN
        -- pg_stat_user_indexes might not be available
        RETURN;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_table_columns(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_constraints(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_indexes(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_triggers(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION find_tables_without_primary_keys() TO authenticated;
GRANT EXECUTE ON FUNCTION check_referential_integrity() TO authenticated;
GRANT EXECUTE ON FUNCTION validate_work_area_jsonb() TO authenticated;
GRANT EXECUTE ON FUNCTION check_enum_consistency() TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_index_usage() TO authenticated;

-- Function to recalculate time record totals
CREATE OR REPLACE FUNCTION recalculate_time_record(p_record_id UUID)
RETURNS VOID AS $$
DECLARE
    record_data RECORD;
    calculated_hours NUMERIC;
    calculated_payment NUMERIC;
BEGIN
    -- Get the time record
    SELECT * INTO record_data 
    FROM time_records 
    WHERE id = p_record_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Time record not found: %', p_record_id;
    END IF;
    
    -- Calculate hours worked
    IF record_data.start_time IS NOT NULL AND record_data.end_time IS NOT NULL THEN
        calculated_hours := EXTRACT(EPOCH FROM (record_data.end_time - record_data.start_time)) / 3600.0;
        
        -- Calculate payment based on hourly rate
        IF record_data.hourly_rate IS NOT NULL THEN
            calculated_payment := calculated_hours * record_data.hourly_rate;
        ELSE
            calculated_payment := 0;
        END IF;
        
        -- Update the record
        UPDATE time_records 
        SET 
            total_hours = calculated_hours,
            total_payment = calculated_payment,
            updated_at = NOW()
        WHERE id = p_record_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION recalculate_time_record(UUID) TO authenticated;

-- Function to find orphaned employee event status records
CREATE OR REPLACE FUNCTION find_orphaned_employee_event_status()
RETURNS TABLE (
    id UUID,
    employee_id UUID,
    event_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ees.id,
        ees.employee_id,
        ees.event_id
    FROM employee_event_status ees
    LEFT JOIN events e ON ees.event_id = e.id
    WHERE e.id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find orphaned work assignments
CREATE OR REPLACE FUNCTION find_orphaned_work_assignments()
RETURNS TABLE (
    id UUID,
    work_area_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wa.id,
        wa.work_area_id
    FROM work_assignments wa
    LEFT JOIN work_areas w ON wa.work_area_id = w.id
    WHERE w.id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION find_orphaned_employee_event_status() TO authenticated;
GRANT EXECUTE ON FUNCTION find_orphaned_work_assignments() TO authenticated;