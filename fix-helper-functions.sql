-- Fix helper functions for SMS integration
-- Run this BEFORE running 009_sms_rls_policies.sql

-- Helper function to check if user is a manager
CREATE OR REPLACE FUNCTION is_manager(user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM employees 
        WHERE employees.user_id = user_id 
        AND role = 'manager'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get employee ID from auth user
CREATE OR REPLACE FUNCTION get_employee_id(user_id TEXT)
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM employees 
        WHERE employees.user_id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;