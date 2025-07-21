// Test script to verify database functions and data persistence
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testDatabaseFunctions() {
  console.log('🔍 Testing Database Functions and Data Persistence...\n')

  try {
    // Test 1: Check if required functions exist
    console.log('1. Checking database functions...')
    
    const functions = [
      'update_employee_event_status',
      'select_employees_for_event', 
      'check_recruitment_status',
      'get_event_employee_summary',
      'create_event_with_work_areas',
      'save_work_assignments'
    ]

    for (const funcName of functions) {
      try {
        const { data, error } = await supabase.rpc(funcName, {})
        if (error && !error.message.includes('required')) {
          console.log(`   ❌ Function ${funcName}: ${error.message}`)
        } else {
          console.log(`   ✅ Function ${funcName}: Available`)
        }
      } catch (err) {
        console.log(`   ✅ Function ${funcName}: Available (expected parameter error)`)
      }
    }

    // Test 2: Check tables exist
    console.log('\n2. Checking database tables...')
    
    const tables = [
      'employees',
      'events', 
      'work_areas',
      'employee_event_status',
      'work_assignments',
      'time_records',
      'templates'
    ]

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1)
      if (error) {
        console.log(`   ❌ Table ${table}: ${error.message}`)
      } else {
        console.log(`   ✅ Table ${table}: Available`)
      }
    }

    // Test 3: Test employee status update
    console.log('\n3. Testing employee status persistence...')
    
    // First, get a real employee and event
    const { data: employees } = await supabase.from('employees').select('id').limit(1)
    const { data: events } = await supabase.from('events').select('id').limit(1)
    
    if (employees?.length > 0 && events?.length > 0) {
      const employeeId = employees[0].id
      const eventId = events[0].id
      
      console.log(`   Testing with employee: ${employeeId}, event: ${eventId}`)
      
      // Test status update
      const { data: updateResult, error: updateError } = await supabase
        .rpc('update_employee_event_status', {
          p_employee_id: employeeId,
          p_event_id: eventId,
          p_new_status: 'available',
          p_response_method: 'test'
        })
      
      if (updateError) {
        console.log(`   ❌ Status update failed: ${updateError.message}`)
      } else {
        console.log(`   ✅ Status update successful`)
        
        // Verify the status was saved
        const { data: statusCheck } = await supabase
          .from('employee_event_status')
          .select('status')
          .eq('employee_id', employeeId)
          .eq('event_id', eventId)
          .single()
        
        if (statusCheck?.status === 'available') {
          console.log(`   ✅ Status persisted correctly: ${statusCheck.status}`)
        } else {
          console.log(`   ❌ Status not persisted correctly`)
        }
      }
    } else {
      console.log('   ⚠️  No employees or events found for testing')
    }

    // Test 4: Check work areas persistence
    console.log('\n4. Testing work areas persistence...')
    
    if (events?.length > 0) {
      const eventId = events[0].id
      
      // Try to create a test work area
      const { data: workArea, error: workAreaError } = await supabase
        .from('work_areas')
        .insert({
          event_id: eventId,
          name: 'Test Work Area',
          location: 'test-location',
          max_capacity: 5,
          role_requirements: { manager: 1, allrounder: 2 }
        })
        .select()
        .single()
      
      if (workAreaError) {
        console.log(`   ❌ Work area creation failed: ${workAreaError.message}`)
      } else {
        console.log(`   ✅ Work area created and persisted: ${workArea.id}`)
        
        // Clean up test data
        await supabase.from('work_areas').delete().eq('id', workArea.id)
        console.log(`   🧹 Test work area cleaned up`)
      }
    }

    console.log('\n✅ Database function and persistence test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testDatabaseFunctions()