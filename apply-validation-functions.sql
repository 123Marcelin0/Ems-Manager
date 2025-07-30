-- Apply this SQL in your Supabase SQL Editor to enable validation functions
-- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Schema validation helper functions

-- Function to get table columns
CREATE OR REPLACE FUNCTION get_table_columns(p_table_name TEXT)
RETURNS TABLE (
    column_name TEXT,
    data_type TEXT,
    is_nullable TEXT,
    column_default TEXT,
    character_maximum_length INTEGER,
    numeric_precision INTEGER,
    numeric_scale INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::TEXT,
        c.data_type::TEXT,
        c.is_nullable::TEXT,
        c.column_default::TEXT,
        c.character_maximum_length::INTEGER,
        c.numeric_precision::INTEGER,
        c.numeric_scale::INTEGER
    FROM information_schema.columns c
    WHERE c.table_name = p_table_name
        AND c.table_schema = 'public'
    ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table constraints
CREATE OR REPLACE FUNCTION get_table_constraints(p_table_name TEXT)
RETURNS TABLE (
    constraint_name TEXT,
    constraint_type TEXT,
    table_name TEXT,
    column_name TEXT,
    foreign_table_name TEXT,
    foreign_column_name TEXT,
    check_clause TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tc.constraint_name::TEXT,
        tc.constraint_type::TEXT,
        tc.table_name::TEXT,
        kcu.column_name::TEXT,
        ccu.table_name::TEXT as foreign_table_name,
        ccu.column_name::TEXT as foreign_column_name,
        cc.check_clause::TEXT
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
        AND tc.table_schema = ccu.table_schema
    LEFT JOIN information_schema.check_constraints cc
        ON tc.constraint_name = cc.constraint_name
        AND tc.table_schema = cc.constraint_schema
    WHERE tc.table_name = p_table_name
        AND tc.table_schema = 'public'
    ORDER BY tc.constraint_type, tc.constraint_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table indexes
CREATE OR REPLACE FUNCTION get_table_indexes(p_table_name TEXT)
RETURNS TABLE (
    index_name TEXT,
    table_name TEXT,
    column_names TEXT[],
    is_unique BOOLEAN,
    index_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.relname::TEXT as index_name,
        t.relname::TEXT as table_name,
        ARRAY_AGG(a.attname ORDER BY a.attnum)::TEXT[] as column_names,
        ix.indisunique as is_unique,
        am.amname::TEXT as index_type
    FROM pg_class t
    JOIN pg_index ix ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_am am ON i.relam = am.oid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
    WHERE t.relname = p_table_name
        AND t.relkind = 'r'
        AND i.relname NOT LIKE '%_pkey'  -- Exclude primary key indexes from this list
    GROUP BY i.relname, t.relname, ix.indisunique, am.amname
    ORDER BY i.relname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table triggers
CREATE OR REPLACE FUNCTION get_table_triggers(p_table_name TEXT)
RETURNS TABLE (
    trigger_name TEXT,
    table_name TEXT,
    event_manipulation TEXT,
    action_timing TEXT,
    action_statement TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.trigger_name::TEXT,
        t.event_object_table::TEXT as table_name,
        t.event_manipulation::TEXT,
        t.action_timing::TEXT,
        t.action_statement::TEXT
    FROM information_schema.triggers t
    WHERE t.event_object_table = p_table_name
        AND t.trigger_schema = 'public'
    ORDER BY t.trigger_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find tables without primary keys
CREATE OR REPLACE FUNCTION find_tables_without_primary_key()
RETURNS TABLE (
    table_name TEXT,
    table_schema TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::TEXT,
        t.table_schema::TEXT
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints tc
            WHERE tc.table_name = t.table_name
                AND tc.table_schema = t.table_schema
                AND tc.constraint_type = 'PRIMARY KEY'
        )
    ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    -- Loop through all foreign key constraints
    FOR rec IN 
        SELECT 
            tc.table_name,
            kcu.column_name,
            ccu.table_name as foreign_table_name,
            ccu.column_name as foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
            ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
    LOOP
        -- Build dynamic query to count orphaned records
        query_text := format(
            'SELECT COUNT(*) FROM %I t1 WHERE t1.%I IS NOT NULL AND NOT EXISTS (SELECT 1 FROM %I t2 WHERE t2.%I = t1.%I)',
            rec.table_name,
            rec.column_name,
            rec.foreign_table_name,
            rec.foreign_column_name,
            rec.column_name
        );
        
        -- Execute the query
        EXECUTE query_text INTO orphaned_count;
        
        -- Return row if there are orphaned records
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

-- Function to validate JSONB structure in work_areas
CREATE OR REPLACE FUNCTION validate_work_areas_jsonb()
RETURNS TABLE (
    work_area_id UUID,
    validation_error TEXT
) AS $$
DECLARE
    rec RECORD;
    role_key TEXT;
    role_value JSONB;
BEGIN
    -- Check each work area's role_requirements JSONB
    FOR rec IN SELECT id, role_requirements FROM work_areas LOOP
        -- Check if role_requirements is a valid object
        IF jsonb_typeof(rec.role_requirements) != 'object' THEN
            work_area_id := rec.id;
            validation_error := 'role_requirements must be a JSON object';
            RETURN NEXT;
            CONTINUE;
        END IF;
        
        -- Check each role in the requirements
        FOR role_key, role_value IN SELECT * FROM jsonb_each(rec.role_requirements) LOOP
            -- Check if the role is a valid employee role
            IF role_key NOT IN ('manager', 'allrounder', 'versorger', 'verkauf', 'essen') THEN
                work_area_id := rec.id;
                validation_error := format('Invalid role "%s" in role_requirements', role_key);
                RETURN NEXT;
            END IF;
            
            -- Check if the value is a positive integer
            IF jsonb_typeof(role_value) != 'number' OR (role_value::TEXT)::INTEGER < 0 THEN
                work_area_id := rec.id;
                validation_error := format('Role "%s" must have a positive integer value', role_key);
                RETURN NEXT;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check enum value consistency
CREATE OR REPLACE FUNCTION check_enum_consistency()
RETURNS TABLE (
    table_name TEXT,
    column_name TEXT,
    invalid_value TEXT,
    record_count BIGINT
) AS $$
DECLARE
    rec RECORD;
    query_text TEXT;
    result_count BIGINT;
BEGIN
    -- Check employee roles
    query_text := 'SELECT COUNT(*) FROM employees WHERE role NOT IN (''manager'', ''allrounder'', ''versorger'', ''verkauf'', ''essen'')';
    EXECUTE query_text INTO result_count;
    IF result_count > 0 THEN
        table_name := 'employees';
        column_name := 'role';
        invalid_value := 'various invalid values';
        record_count := result_count;
        RETURN NEXT;
    END IF;
    
    -- Check employment types
    query_text := 'SELECT COUNT(*) FROM employees WHERE employment_type NOT IN (''part_time'', ''fixed'')';
    EXECUTE query_text INTO result_count;
    IF result_count > 0 THEN
        table_name := 'employees';
        column_name := 'employment_type';
        invalid_value := 'various invalid values';
        record_count := result_count;
        RETURN NEXT;
    END IF;
    
    -- Check event statuses
    query_text := 'SELECT COUNT(*) FROM events WHERE status NOT IN (''draft'', ''recruiting'', ''planned'', ''active'', ''completed'', ''cancelled'')';
    EXECUTE query_text INTO result_count;
    IF result_count > 0 THEN
        table_name := 'events';
        column_name := 'status';
        invalid_value := 'various invalid values';
        record_count := result_count;
        RETURN NEXT;
    END IF;
    
    -- Check employee event statuses
    query_text := 'SELECT COUNT(*) FROM employee_event_status WHERE status NOT IN (''not_asked'', ''asked'', ''available'', ''unavailable'', ''selected'', ''working'', ''completed'')';
    EXECUTE query_text INTO result_count;
    IF result_count > 0 THEN
        table_name := 'employee_event_status';
        column_name := 'status';
        invalid_value := 'various invalid values';
        record_count := result_count;
        RETURN NEXT;
    END IF;
    
    -- Check time record statuses
    query_text := 'SELECT COUNT(*) FROM time_records WHERE status NOT IN (''active'', ''completed'', ''cancelled'')';
    EXECUTE query_text INTO result_count;
    IF result_count > 0 THEN
        table_name := 'time_records';
        column_name := 'status';
        invalid_value := 'various invalid values';
        record_count := result_count;
        RETURN NEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to analyze index usage (requires pg_stat_user_indexes)
CREATE OR REPLACE FUNCTION analyze_index_usage()
RETURNS TABLE (
    schemaname TEXT,
    tablename TEXT,
    indexname TEXT,
    idx_scan BIGINT,
    idx_tup_read BIGINT,
    idx_tup_fetch BIGINT,
    usage_ratio NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.schemaname::TEXT,
        s.relname::TEXT as tablename,
        s.indexrelname::TEXT as indexname,
        s.idx_scan,
        s.idx_tup_read,
        s.idx_tup_fetch,
        CASE 
            WHEN s.idx_scan = 0 THEN 0
            ELSE ROUND((s.idx_tup_fetch::NUMERIC / s.idx_scan), 2)
        END as usage_ratio
    FROM pg_stat_user_indexes s
    WHERE s.schemaname = 'public'
    ORDER BY s.idx_scan DESC;
EXCEPTION
    WHEN undefined_table THEN
        -- pg_stat_user_indexes might not be available
        RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to recalculate time record totals
CREATE OR REPLACE FUNCTION recalculate_time_record(p_record_id UUID)
RETURNS VOID AS $$
DECLARE
    record_data RECORD;
    calculated_hours NUMERIC;
    calculated_payment NUMERIC;
BEGIN
    -- Get the time record
    SELECT sign_in_time, sign_out_time, hourly_rate
    INTO record_data
    FROM time_records
    WHERE id = p_record_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Time record not found: %', p_record_id;
    END IF;
    
    -- Only recalculate if sign_out_time is set
    IF record_data.sign_out_time IS NOT NULL THEN
        -- Calculate hours
        calculated_hours := EXTRACT(EPOCH FROM (record_data.sign_out_time - record_data.sign_in_time)) / 3600;
        
        -- Calculate payment
        calculated_payment := calculated_hours * record_data.hourly_rate;
        
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_table_columns(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_constraints(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_indexes(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_triggers(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION find_tables_without_primary_key() TO authenticated;
GRANT EXECUTE ON FUNCTION check_referential_integrity() TO authenticated;
GRANT EXECUTE ON FUNCTION validate_work_areas_jsonb() TO authenticated;
GRANT EXECUTE ON FUNCTION check_enum_consistency() TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_index_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_time_record(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION find_orphaned_employee_event_status() TO authenticated;
GRANT EXECUTE ON FUNCTION find_orphaned_work_assignments() TO authenticated;