-- Temporarily disable RLS to insert sample data
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

-- Insert sample employees
INSERT INTO employees (name, user_id, phone_number, role, skills, employment_type, is_always_needed, last_worked_date, total_hours_worked) VALUES
('Anna Schmidt', 'a.schmidt', '+491234567890', 'allrounder', ARRAY['Customer Service', 'Security'], 'part_time', false, '2024-01-15 14:30:00', 45.5),
('Max Müller', 'm.mueller', '+491234567891', 'manager', ARRAY['Leadership', 'Operations'], 'fixed', true, '2024-01-15 12:15:00', 120.0),
('Lisa Weber', 'l.weber', '+491234567892', 'versorger', ARRAY['Logistics', 'Quality Control'], 'part_time', false, '2024-01-14 16:45:00', 32.0),
('Tom Fischer', 't.fischer', '+491234567893', 'verkauf', ARRAY['Sales', 'Customer Relations'], 'part_time', false, '2024-01-15 09:20:00', 28.5),
('Sarah Klein', 's.klein', '+491234567894', 'essen', ARRAY['Food Preparation', 'Hygiene'], 'part_time', false, NULL, 0);

-- Re-enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;