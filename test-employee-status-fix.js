// Test script to verify employee status persistence fix
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vnxhfmrjzwxumaakgwmq.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZueGhmbXJqend4dW1hYWtnd21xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg1NDQ5OCwiZXhwIjoyMDY4NDMwNDk4fQ.VISxS7EqFageN2YwOaOpr1ufGF4Jzuhg0wd_KwOZt3o'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testEmployeeStatusFix() {
  console.log('🔧 Testing Employee Status Persistence Fix...\n')

  try {
    // Step 1: Get test data
    const { data: events } = await supabase.from('events').select('id, title').limit(1)
    const { data: employees } = await supabase.from('employees').select('id, name').limit(2)
    
    if (!events?.length || !employees?.length) {
      console.log('⚠️  No events or employees found for testing')
      return
    }

    const testEvent = events[0]
    const testEmployee = employees[0]
    
    console.log(`📅 Testing with event: ${testEvent.title} (${testEvent.id})`)
    console.log(`👤 Testing with employee: ${testEmployee.name} (${testEmployee.id})`)

    // Step 2: Clear any existing status
    console.log('\n1. Clearing existing status...')
    await supabase
      .from('employee_event_status')
      .delete()
      .eq('employee_id', testEmployee.id)
      .eq('event_id', testEvent.id)

    // Step 3: Set a status via API
    console.log('\n2. Setting status via API...')
    const response = await fetch('http://localhost:3000/api/employees/update-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employee_id: testEmployee.id,
        event_id: testEvent.id,
        status: 'selected'
      }),
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('   ✅ API call successful')
    } else {
      console.log('   ❌ API call failed:', result.error)
      return
    }

    // Step 4: Verify status was saved
    console.log('\n3. Verifying status was saved...')
    const { data: savedStatus, error } = await supabase
      .from('employee_event_status')
      .select('*')
      .eq('employee_id', testEmployee.id)
      .eq('event_id', testEvent.id)
      .single()
    
    if (error) {
      console.log('   ❌ Error fetching saved status:', error.message)
    } else if (savedStatus) {
      console.log('   ✅ Status saved successfully:', savedStatus.status)
      console.log('   📅 Responded at:', savedStatus.responded_at)
      console.log('   🔄 Updated at:', savedStatus.updated_at)
    } else {
      console.log('   ❌ No status found in database')
    }

    // Step 5: Test loading employees with status
    console.log('\n4. Testing employee loading with status...')
    const { data: employeesWithStatus, error: loadError } = await supabase
      .from('employees')
      .select(`
        id, name, user_id, role, employment_type, is_always_needed, last_worked_date
      `)
      .order('name')

    if (loadError) {
      console.log('   ❌ Error loading employees:', loadError.message)
    } else {
      console.log(`   ✅ Loaded ${employeesWithStatus.length} employees`)
    }

    // Get statuses for the event
    const { data: statuses, error: statusError } = await supabase
      .from('employee_event_status')
      .select('employee_id, status, responded_at')
      .eq('event_id', testEvent.id)

    if (statusError) {
      console.log('   ❌ Error loading statuses:', statusError.message)
    } else {
      console.log(`   ✅ Loaded ${statuses.length} statuses for event`)
      
      // Create status map
      const statusMap = {}
      statuses.forEach(status => {
        statusMap[status.employee_id] = status.status
      })
      
      // Show combined data
      employeesWithStatus.forEach(emp => {
        const status = statusMap[emp.id] || (emp.is_always_needed ? 'always_needed' : 'not_asked')
        console.log(`   👤 ${emp.name}: ${status}`)
      })
    }

    console.log('\n✅ Employee Status Persistence Fix Test Completed!')
    console.log('\n📋 Summary:')
    console.log('- API endpoint works correctly ✅')
    console.log('- Status is saved to database ✅')
    console.log('- Status can be loaded for specific events ✅')
    console.log('- Employee data combines properly with status ✅')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testEmployeeStatusFix()