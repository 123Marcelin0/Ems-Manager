-- SMS Integration Schema Extensions
-- This migration adds tables and functions for comprehensive SMS communication

-- Create SMS messages table
CREATE TABLE sms_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    conversation_id UUID, -- Will reference sms_conversations after it's created
    message_sid VARCHAR(255),
    phone_number VARCHAR(20) NOT NULL,
    message_body TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'outbound',
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    delivery_status VARCHAR(50),
    sent_at TIMESTAMP DEFAULT NOW(),
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create SMS conversations table for state management
CREATE TABLE sms_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    phone_number VARCHAR(20) NOT NULL,
    current_state VARCHAR(100) NOT NULL DEFAULT 'idle',
    context_data JSONB DEFAULT '{}',
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    last_activity_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create employee registration requests table
CREATE TABLE employee_registration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) NOT NULL,
    registration_code VARCHAR(50) NOT NULL,
    employee_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'invalid')),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraint for conversation_id in sms_messages
ALTER TABLE sms_messages 
ADD CONSTRAINT fk_sms_messages_conversation 
FOREIGN KEY (conversation_id) REFERENCES sms_conversations(id) ON DELETE SET NULL;

-- Add SMS-specific columns to employees table
ALTER TABLE employees 
ADD COLUMN sms_enabled BOOLEAN DEFAULT true,
ADD COLUMN preferred_communication VARCHAR(20) DEFAULT 'sms' CHECK (preferred_communication IN ('sms', 'whatsapp', 'both'));

-- Create indexes for performance optimization
CREATE INDEX idx_sms_messages_phone_number ON sms_messages(phone_number);
CREATE INDEX idx_sms_messages_employee_id ON sms_messages(employee_id);
CREATE INDEX idx_sms_messages_event_id ON sms_messages(event_id);
CREATE INDEX idx_sms_messages_conversation_id ON sms_messages(conversation_id);
CREATE INDEX idx_sms_messages_direction ON sms_messages(direction);
CREATE INDEX idx_sms_messages_delivery_status ON sms_messages(delivery_status);
CREATE INDEX idx_sms_messages_sent_at ON sms_messages(sent_at);

CREATE INDEX idx_sms_conversations_phone_number ON sms_conversations(phone_number);
CREATE INDEX idx_sms_conversations_employee_id ON sms_conversations(employee_id);
CREATE INDEX idx_sms_conversations_current_state ON sms_conversations(current_state);
CREATE INDEX idx_sms_conversations_event_id ON sms_conversations(event_id);
CREATE INDEX idx_sms_conversations_last_activity ON sms_conversations(last_activity_at);
CREATE INDEX idx_sms_conversations_expires_at ON sms_conversations(expires_at);

CREATE INDEX idx_employee_registration_phone ON employee_registration_requests(phone_number);
CREATE INDEX idx_employee_registration_code ON employee_registration_requests(registration_code);
CREATE INDEX idx_employee_registration_status ON employee_registration_requests(status);
CREATE INDEX idx_employee_registration_created ON employee_registration_requests(created_at);

CREATE INDEX idx_employees_sms_enabled ON employees(sms_enabled);
CREATE INDEX idx_employees_preferred_communication ON employees(preferred_communication);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_sms_messages_updated_at BEFORE UPDATE ON sms_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_conversations_updated_at BEFORE UPDATE ON sms_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_registration_updated_at BEFORE UPDATE ON employee_registration_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired conversations
CREATE OR REPLACE FUNCTION cleanup_expired_conversations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired conversations and their associated messages
    WITH deleted_conversations AS (
        DELETE FROM sms_conversations 
        WHERE expires_at < NOW() 
        AND current_state IN ('idle', 'registration_code_received', 'awaiting_name')
        RETURNING id
    )
    DELETE FROM sms_messages 
    WHERE conversation_id IN (SELECT id FROM deleted_conversations);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Also clean up old registration requests (older than 7 days)
    DELETE FROM employee_registration_requests 
    WHERE created_at < NOW() - INTERVAL '7 days' 
    AND status IN ('expired', 'invalid');
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create conversation
CREATE OR REPLACE FUNCTION get_or_create_sms_conversation(
    p_phone_number VARCHAR(20),
    p_employee_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
    existing_employee_id UUID;
BEGIN
    -- Try to find existing active conversation
    SELECT id, employee_id INTO conversation_id, existing_employee_id
    FROM sms_conversations 
    WHERE phone_number = p_phone_number 
    AND expires_at > NOW()
    ORDER BY last_activity_at DESC 
    LIMIT 1;
    
    IF conversation_id IS NOT NULL THEN
        -- Update last activity and extend expiration
        UPDATE sms_conversations 
        SET 
            last_activity_at = NOW(),
            expires_at = NOW() + INTERVAL '24 hours',
            employee_id = COALESCE(p_employee_id, existing_employee_id)
        WHERE id = conversation_id;
        
        RETURN conversation_id;
    ELSE
        -- Create new conversation
        INSERT INTO sms_conversations (phone_number, employee_id, last_activity_at, expires_at)
        VALUES (p_phone_number, p_employee_id, NOW(), NOW() + INTERVAL '24 hours')
        RETURNING id INTO conversation_id;
        
        RETURN conversation_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update conversation state
CREATE OR REPLACE FUNCTION update_conversation_state(
    p_conversation_id UUID,
    p_new_state VARCHAR(100),
    p_context_data JSONB DEFAULT NULL,
    p_event_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE sms_conversations 
    SET 
        current_state = p_new_state,
        context_data = COALESCE(p_context_data, context_data),
        event_id = COALESCE(p_event_id, event_id),
        last_activity_at = NOW(),
        expires_at = NOW() + INTERVAL '24 hours',
        updated_at = NOW()
    WHERE id = p_conversation_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to log SMS message
CREATE OR REPLACE FUNCTION log_sms_message(
    p_phone_number VARCHAR(20),
    p_message_body TEXT,
    p_direction VARCHAR(20),
    p_employee_id UUID DEFAULT NULL,
    p_event_id UUID DEFAULT NULL,
    p_conversation_id UUID DEFAULT NULL,
    p_message_sid VARCHAR(255) DEFAULT NULL,
    p_message_type VARCHAR(50) DEFAULT 'general'
)
RETURNS UUID AS $$
DECLARE
    message_id UUID;
BEGIN
    INSERT INTO sms_messages (
        phone_number,
        message_body,
        direction,
        employee_id,
        event_id,
        conversation_id,
        message_sid,
        message_type
    ) VALUES (
        p_phone_number,
        p_message_body,
        p_direction,
        p_employee_id,
        p_event_id,
        p_conversation_id,
        p_message_sid,
        p_message_type
    ) RETURNING id INTO message_id;
    
    RETURN message_id;
END;
$$ LANGUAGE plpgsql;

-- Function to find employee by phone number
CREATE OR REPLACE FUNCTION find_employee_by_phone(p_phone_number VARCHAR(20))
RETURNS TABLE(
    employee_id UUID,
    employee_name VARCHAR(255),
    employee_role employee_role,
    sms_enabled BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.name,
        e.role,
        e.sms_enabled
    FROM employees e
    WHERE e.phone_number = p_phone_number
    AND e.sms_enabled = true;
END;
$$ LANGUAGE plpgsql;

-- Function to create employee from registration
CREATE OR REPLACE FUNCTION create_employee_from_registration(
    p_phone_number VARCHAR(20),
    p_name VARCHAR(255),
    p_registration_code VARCHAR(50)
)
RETURNS UUID AS $$
DECLARE
    new_employee_id UUID;
    user_id_value VARCHAR(100);
BEGIN
    -- Generate a unique user_id for the employee
    user_id_value := 'sms_' || LOWER(REPLACE(p_name, ' ', '_')) || '_' || EXTRACT(EPOCH FROM NOW())::TEXT;
    
    -- Create the employee record
    INSERT INTO employees (
        name,
        user_id,
        phone_number,
        role,
        employment_type,
        sms_enabled,
        preferred_communication
    ) VALUES (
        p_name,
        user_id_value,
        p_phone_number,
        'allrounder', -- Default role for SMS registrations
        'part_time',  -- Default employment type
        true,
        'sms'
    ) RETURNING id INTO new_employee_id;
    
    -- Update the registration request
    UPDATE employee_registration_requests 
    SET 
        status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE phone_number = p_phone_number 
    AND registration_code = p_registration_code
    AND status = 'pending';
    
    RETURN new_employee_id;
END;
$$ LANGUAGE plpgsql;

-- Add audit triggers for new tables
CREATE TRIGGER audit_sms_messages AFTER INSERT OR UPDATE OR DELETE ON sms_messages
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_sms_conversations AFTER INSERT OR UPDATE OR DELETE ON sms_conversations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_employee_registration_requests AFTER INSERT OR UPDATE OR DELETE ON employee_registration_requests
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create a scheduled job to clean up expired conversations (if pg_cron is available)
-- This would typically be set up separately in production
-- SELECT cron.schedule('cleanup-expired-conversations', '0 */6 * * *', 'SELECT cleanup_expired_conversations();');

COMMENT ON TABLE sms_messages IS 'Stores all SMS messages sent and received through the system';
COMMENT ON TABLE sms_conversations IS 'Manages conversation state and context for SMS interactions';
COMMENT ON TABLE employee_registration_requests IS 'Tracks employee self-registration requests via SMS';
COMMENT ON FUNCTION cleanup_expired_conversations() IS 'Removes expired conversations and associated messages';
COMMENT ON FUNCTION get_or_create_sms_conversation(VARCHAR, UUID) IS 'Gets existing or creates new SMS conversation';
COMMENT ON FUNCTION update_conversation_state(UUID, VARCHAR, JSONB, UUID) IS 'Updates conversation state and context';
COMMENT ON FUNCTION log_sms_message(VARCHAR, TEXT, VARCHAR, UUID, UUID, UUID, VARCHAR, VARCHAR) IS 'Logs SMS message to database';
COMMENT ON FUNCTION find_employee_by_phone(VARCHAR) IS 'Finds employee record by phone number';
COMMENT ON FUNCTION create_employee_from_registration(VARCHAR, VARCHAR, VARCHAR) IS 'Creates employee from SMS registration';