-- Insert sample employees
INSERT INTO employees (name, user_id, phone_number, role, skills, employment_type, is_always_needed, last_worked_date, total_hours_worked) VALUES
('Anna Schmidt', 'a.schmidt', '+491234567890', 'allrounder', ARRAY['Customer Service', 'Security'], 'part_time', false, '2024-01-15 14:30:00', 45.5),
('Max Müller', 'm.mueller', '+491234567891', 'manager', ARRAY['Leadership', 'Team Coordination'], 'fixed', true, '2024-01-15 12:15:00', 120.0),
('Lisa Weber', 'l.weber', '+491234567892', 'versorger', ARRAY['Supply Chain', 'Quality Control'], 'part_time', false, '2024-01-14 16:45:00', 32.0),
('Tom Fischer', 't.fischer', '+491234567893', 'verkauf', ARRAY['Customer Service', 'Product Knowledge'], 'part_time', false, '2024-01-15 09:20:00', 28.5),
('Sarah Klein', 's.klein', '+491234567894', 'essen', ARRAY['Food Preparation', 'Hygiene'], 'part_time', false, NULL, 0),
('Michael Berg', 'm.berg', '+491234567895', 'manager', ARRAY['Leadership', 'Team Coordination'], 'fixed', true, '2024-01-10 18:00:00', 95.0),
('Julia Hoffmann', 'j.hoffmann', '+491234567896', 'allrounder', ARRAY['Multi-tasking', 'Problem Solving'], 'part_time', false, '2024-01-12 20:30:00', 18.0),
('Peter Wagner', 'p.wagner', '+491234567897', 'versorger', ARRAY['Supply Chain', 'Inventory'], 'part_time', false, '2024-01-08 15:45:00', 52.5),
('Maria Becker', 'm.becker', '+491234567898', 'verkauf', ARRAY['Customer Service', 'Communication'], 'part_time', false, '2024-01-13 11:20:00', 35.0),
('Klaus Richter', 'k.richter', '+491234567899', 'essen', ARRAY['Cooking', 'Food Safety'], 'part_time', false, '2024-01-11 19:15:00', 41.5);

-- Insert sample events
INSERT INTO events (title, location, event_date, start_time, end_time, description, specialties, hourly_rate, employees_needed, employees_to_ask, status) VALUES
('Summer Festival 2025', 'Emslandarena', '2025-07-25', '10:00:00', '22:00:00', 'Large outdoor summer festival with multiple stages and food vendors', 'Event management, Customer service', 15.50, 10, 13, 'draft'),
('Corporate Conference', 'Emslandhalle', '2025-08-15', '08:00:00', '18:00:00', 'Business conference with networking and presentations', 'Professional service, Technical support', 18.00, 8, 10, 'draft'),
('Product Launch Event', 'Emslandarena', '2025-09-05', '14:00:00', '20:00:00', 'Product launch with demonstrations and customer interactions', 'Sales experience, Product knowledge', 16.75, 15, 19, 'draft');

-- Insert sample work areas for the first event
INSERT INTO work_areas (event_id, name, location, max_capacity, is_active, role_requirements) 
SELECT 
    e.id,
    'Main Entrance',
    'Emslandarena - Entrance',
    4,
    true,
    '{"manager": 1, "allrounder": 2, "versorger": 1}'::jsonb
FROM events e WHERE e.title = 'Summer Festival 2025';

INSERT INTO work_areas (event_id, name, location, max_capacity, is_active, role_requirements) 
SELECT 
    e.id,
    'Food Court',
    'Emslandarena - Food Area',
    6,
    true,
    '{"manager": 1, "essen": 3, "verkauf": 2}'::jsonb
FROM events e WHERE e.title = 'Summer Festival 2025';

INSERT INTO work_areas (event_id, name, location, max_capacity, is_active, role_requirements) 
SELECT 
    e.id,
    'Main Stage',
    'Emslandarena - Stage Area',
    3,
    true,
    '{"allrounder": 2, "versorger": 1}'::jsonb
FROM events e WHERE e.title = 'Summer Festival 2025';

-- Insert some sample employee event statuses to simulate recruitment process
INSERT INTO employee_event_status (employee_id, event_id, status, asked_at, responded_at, response_method)
SELECT 
    e.id,
    ev.id,
    CASE 
        WHEN e.name = 'Max Müller' THEN 'available'::employee_event_status_enum
        WHEN e.name = 'Michael Berg' THEN 'available'::employee_event_status_enum
        WHEN e.name = 'Anna Schmidt' THEN 'asked'::employee_event_status_enum
        WHEN e.name = 'Lisa Weber' THEN 'unavailable'::employee_event_status_enum
        ELSE 'not_asked'::employee_event_status_enum
    END,
    CASE 
        WHEN e.name IN ('Max Müller', 'Michael Berg', 'Anna Schmidt', 'Lisa Weber') 
        THEN NOW() - INTERVAL '2 hours'
        ELSE NULL
    END,
    CASE 
        WHEN e.name IN ('Max Müller', 'Michael Berg', 'Lisa Weber') 
        THEN NOW() - INTERVAL '1 hour'
        ELSE NULL
    END,
    CASE 
        WHEN e.name IN ('Max Müller', 'Michael Berg', 'Lisa Weber') 
        THEN 'whatsapp'
        ELSE NULL
    END
FROM employees e
CROSS JOIN events ev
WHERE ev.title = 'Summer Festival 2025';

-- Insert sample WhatsApp messages
INSERT INTO whatsapp_messages (employee_id, event_id, message_sid, phone_number, message_body, message_type, delivery_status, sent_at, delivered_at, response_received_at, response_body)
SELECT 
    e.id,
    ev.id,
    'SM' || substr(md5(random()::text), 1, 32),
    e.phone_number,
    'Hi ' || e.name || '! We have an event "' || ev.title || '" on ' || ev.event_date || '. Are you available to work? Please reply YES or NO.',
    'invitation',
    'delivered',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours' + INTERVAL '30 seconds',
    CASE 
        WHEN e.name IN ('Max Müller', 'Michael Berg') THEN NOW() - INTERVAL '1 hour'
        WHEN e.name = 'Lisa Weber' THEN NOW() - INTERVAL '1 hour'
        ELSE NULL
    END,
    CASE 
        WHEN e.name IN ('Max Müller', 'Michael Berg') THEN 'YES'
        WHEN e.name = 'Lisa Weber' THEN 'NO'
        ELSE NULL
    END
FROM employees e
CROSS JOIN events ev
WHERE ev.title = 'Summer Festival 2025'
AND e.name IN ('Max Müller', 'Michael Berg', 'Anna Schmidt', 'Lisa Weber');