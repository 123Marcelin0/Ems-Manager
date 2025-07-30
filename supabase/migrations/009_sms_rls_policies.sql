-- Row Level Security Policies for SMS Integration Tables

-- Enable RLS on new SMS tables
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_registration_requests ENABLE ROW LEVEL SECURITY;

-- SMS Messages table policies
CREATE POLICY "sms_messages_select_own" ON sms_messages
    FOR SELECT USING (
        employee_id = get_employee_id(auth.uid()::text) 
        OR is_manager(auth.uid()::text)
    );

CREATE POLICY "sms_messages_select_managers" ON sms_messages
    FOR SELECT USING (is_manager(auth.uid()::text));

CREATE POLICY "sms_messages_insert_managers" ON sms_messages
    FOR INSERT WITH CHECK (is_manager(auth.uid()::text));

CREATE POLICY "sms_messages_insert_system" ON sms_messages
    FOR INSERT WITH CHECK (true); -- Allow system inserts for webhook processing

CREATE POLICY "sms_messages_update_managers" ON sms_messages
    FOR UPDATE USING (is_manager(auth.uid()::text));

-- SMS Conversations table policies
CREATE POLICY "sms_conversations_select_own" ON sms_conversations
    FOR SELECT USING (
        employee_id = get_employee_id(auth.uid()::text) 
        OR is_manager(auth.uid()::text)
    );

CREATE POLICY "sms_conversations_select_managers" ON sms_conversations
    FOR SELECT USING (is_manager(auth.uid()::text));

CREATE POLICY "sms_conversations_insert_managers" ON sms_conversations
    FOR INSERT WITH CHECK (is_manager(auth.uid()::text));

CREATE POLICY "sms_conversations_insert_system" ON sms_conversations
    FOR INSERT WITH CHECK (true); -- Allow system inserts for webhook processing

CREATE POLICY "sms_conversations_update_managers" ON sms_conversations
    FOR UPDATE USING (is_manager(auth.uid()::text));

CREATE POLICY "sms_conversations_update_system" ON sms_conversations
    FOR UPDATE WITH CHECK (true); -- Allow system updates for state management

CREATE POLICY "sms_conversations_delete_managers" ON sms_conversations
    FOR DELETE USING (is_manager(auth.uid()::text));

-- Employee Registration Requests table policies (managers only)
CREATE POLICY "employee_registration_select_managers" ON employee_registration_requests
    FOR SELECT USING (is_manager(auth.uid()::text));

CREATE POLICY "employee_registration_insert_system" ON employee_registration_requests
    FOR INSERT WITH CHECK (true); -- Allow system inserts for registration processing

CREATE POLICY "employee_registration_update_managers" ON employee_registration_requests
    FOR UPDATE USING (is_manager(auth.uid()::text));

CREATE POLICY "employee_registration_update_system" ON employee_registration_requests
    FOR UPDATE WITH CHECK (true); -- Allow system updates for registration completion

CREATE POLICY "employee_registration_delete_managers" ON employee_registration_requests
    FOR DELETE USING (is_manager(auth.uid()::text));

-- Create helper function to check if user can access SMS conversation
CREATE OR REPLACE FUNCTION can_access_sms_conversation(conversation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    conv_employee_id UUID;
    current_user_employee_id UUID;
BEGIN
    -- Get conversation employee ID
    SELECT employee_id INTO conv_employee_id
    FROM sms_conversations
    WHERE id = conversation_id;
    
    -- If user is manager, allow access
    IF is_manager(auth.uid()::text) THEN
        RETURN true;
    END IF;
    
    -- Get current user's employee ID
    current_user_employee_id := get_employee_id(auth.uid()::text);
    
    -- Allow access if conversation belongs to current user
    RETURN conv_employee_id = current_user_employee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if phone number belongs to current user
CREATE OR REPLACE FUNCTION is_own_phone_number(phone_number VARCHAR(20))
RETURNS BOOLEAN AS $$
DECLARE
    current_user_employee_id UUID;
    phone_employee_id UUID;
BEGIN
    -- Get current user's employee ID
    current_user_employee_id := get_employee_id(auth.uid()::text);
    
    IF current_user_employee_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if phone number belongs to current user
    SELECT id INTO phone_employee_id
    FROM employees
    WHERE employees.phone_number = is_own_phone_number.phone_number
    AND employees.id = current_user_employee_id;
    
    RETURN phone_employee_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update SMS messages policies to use phone number check for unregistered users
DROP POLICY IF EXISTS "sms_messages_select_own" ON sms_messages;
CREATE POLICY "sms_messages_select_own" ON sms_messages
    FOR SELECT USING (
        employee_id = get_employee_id(auth.uid()::text) 
        OR is_own_phone_number(phone_number)
        OR is_manager(auth.uid()::text)
    );

-- Update SMS conversations policies to use phone number check
DROP POLICY IF EXISTS "sms_conversations_select_own" ON sms_conversations;
CREATE POLICY "sms_conversations_select_own" ON sms_conversations
    FOR SELECT USING (
        employee_id = get_employee_id(auth.uid()::text) 
        OR is_own_phone_number(phone_number)
        OR is_manager(auth.uid()::text)
    );

-- Grant necessary permissions for SMS functions
GRANT EXECUTE ON FUNCTION cleanup_expired_conversations() TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_sms_conversation(VARCHAR, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_conversation_state(UUID, VARCHAR, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_sms_message(VARCHAR, TEXT, VARCHAR, UUID, UUID, UUID, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION find_employee_by_phone(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION create_employee_from_registration(VARCHAR, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_sms_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_own_phone_number(VARCHAR) TO authenticated;

-- Grant permissions for service role (used by API routes)
GRANT ALL ON sms_messages TO service_role;
GRANT ALL ON sms_conversations TO service_role;
GRANT ALL ON employee_registration_requests TO service_role;

-- Create view for SMS conversation summary (for managers)
CREATE OR REPLACE VIEW sms_conversation_summary AS
SELECT 
    c.id,
    c.phone_number,
    c.current_state,
    c.last_activity_at,
    c.expires_at,
    e.name as employee_name,
    e.role as employee_role,
    ev.title as event_title,
    ev.event_date,
    (
        SELECT COUNT(*) 
        FROM sms_messages m 
        WHERE m.conversation_id = c.id
    ) as message_count,
    (
        SELECT m.message_body 
        FROM sms_messages m 
        WHERE m.conversation_id = c.id 
        ORDER BY m.sent_at DESC 
        LIMIT 1
    ) as last_message
FROM sms_conversations c
LEFT JOIN employees e ON c.employee_id = e.id
LEFT JOIN events ev ON c.event_id = ev.id
WHERE c.expires_at > NOW()
ORDER BY c.last_activity_at DESC;

-- RLS policy for the view
CREATE POLICY "sms_conversation_summary_managers" ON sms_conversation_summary
    FOR SELECT USING (is_manager(auth.uid()::text));

-- Grant access to the view
GRANT SELECT ON sms_conversation_summary TO authenticated;

COMMENT ON POLICY "sms_messages_select_own" ON sms_messages IS 'Employees can see their own SMS messages, managers can see all';
COMMENT ON POLICY "sms_conversations_select_own" ON sms_conversations IS 'Employees can see their own conversations, managers can see all';
COMMENT ON FUNCTION can_access_sms_conversation(UUID) IS 'Checks if current user can access specific SMS conversation';
COMMENT ON FUNCTION is_own_phone_number(VARCHAR) IS 'Checks if phone number belongs to current authenticated user';
COMMENT ON VIEW sms_conversation_summary IS 'Summary view of active SMS conversations for managers';