const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const sampleEmployees = [
  {
    name: 'Anna Schmidt',
    user_id: 'a.schmidt',
    phone_number: '+491234567890',
    role: 'allrounder',
    skills: ['Customer Service', 'Security'],
    employment_type: 'part_time',
    is_always_needed: false,
    last_worked_date: '2024-01-15T14:30:00',
    total_hours_worked: 45.5
  },
  {
    name: 'Max Müller',
    user_id: 'm.mueller',
    phone_number: '+491234567891',
    role: 'manager',
    skills: ['Leadership', 'Operations'],
    employment_type: 'fixed',
    is_always_needed: true,
    last_worked_date: '2024-01-15T12:15:00',
    total_hours_worked: 120.0
  },
  {
    name: 'Lisa Weber',
    user_id: 'l.weber',
    phone_number: '+491234567892',
    role: 'versorger',
    skills: ['Logistics', 'Quality Control'],
    employment_type: 'part_time',
    is_always_needed: false,
    last_worked_date: '2024-01-14T16:45:00',
    total_hours_worked: 32.0
  },
  {
    name: 'Tom Fischer',
    user_id: 't.fischer',
    phone_number: '+491234567893',
    role: 'verkauf',
    skills: ['Sales', 'Customer Relations'],
    employment_type: 'part_time',
    is_always_needed: false,
    last_worked_date: '2024-01-15T09:20:00',
    total_hours_worked: 28.5
  },
  {
    name: 'Sarah Klein',
    user_id: 's.klein',
    phone_number: '+491234567894',
    role: 'essen',
    skills: ['Food Preparation', 'Hygiene'],
    employment_type: 'part_time',
    is_always_needed: false,
    last_worked_date: null,
    total_hours_worked: 0
  }
];

async function addSampleEmployees() {
  console.log('Adding sample employees...');
  
  try {
    const { data, error } = await supabase
      .from('employees')
      .insert(sampleEmployees)
      .select();
    
    if (error) {
      console.error('Error adding employees:', error);
    } else {
      console.log('✅ Successfully added', data.length, 'employees');
      data.forEach(emp => {
        console.log(`   - ${emp.name} (${emp.role})`);
      });
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

addSampleEmployees();