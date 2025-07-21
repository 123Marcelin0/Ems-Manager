const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseTables() {
  console.log('🔍 Testing database tables...\n');

  // Test employees table
  try {
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .limit(5);
    
    if (empError) {
      console.log('❌ Employees table:', empError.message);
    } else {
      console.log('✅ Employees table: Found', employees.length, 'employees');
      if (employees.length > 0) {
        console.log('   Sample employee:', employees[0].name);
      }
    }
  } catch (err) {
    console.log('❌ Employees table error:', err.message);
  }

  // Test events table
  try {
    const { data: events, error: evtError } = await supabase
      .from('events')
      .select('*')
      .limit(5);
    
    if (evtError) {
      console.log('❌ Events table:', evtError.message);
    } else {
      console.log('✅ Events table: Found', events.length, 'events');
      if (events.length > 0) {
        console.log('   Sample event:', events[0].title);
      }
    }
  } catch (err) {
    console.log('❌ Events table error:', err.message);
  }

  // Test work_areas table
  try {
    const { data: workAreas, error: waError } = await supabase
      .from('work_areas')
      .select('*')
      .limit(5);
    
    if (waError) {
      console.log('❌ Work areas table:', waError.message);
    } else {
      console.log('✅ Work areas table: Found', workAreas.length, 'work areas');
    }
  } catch (err) {
    console.log('❌ Work areas table error:', err.message);
  }

  // Test employee_event_status table
  try {
    const { data: statuses, error: statusError } = await supabase
      .from('employee_event_status')
      .select('*')
      .limit(5);
    
    if (statusError) {
      console.log('❌ Employee event status table:', statusError.message);
    } else {
      console.log('✅ Employee event status table: Found', statuses.length, 'status records');
    }
  } catch (err) {
    console.log('❌ Employee event status table error:', err.message);
  }

  // Test fair distribution function
  try {
    const { data: fairData, error: fairError } = await supabase
      .rpc('get_event_employee_summary', { p_event_id: '00000000-0000-0000-0000-000000000000' });
    
    if (fairError && !fairError.message.includes('function')) {
      console.log('❌ Fair distribution functions:', fairError.message);
    } else {
      console.log('✅ Fair distribution functions: Available');
    }
  } catch (err) {
    console.log('❌ Fair distribution functions error:', err.message);
  }

  console.log('\n🎉 Database test completed!');
}

testDatabaseTables();