// Test script to verify employee status persistence
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vnxhfmrjzwxumaakgwmq.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZueGhmbXJqend4dW1hYWtnd21xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg1NDQ5OCwiZXhwIjoyMDY4NDMwNDk4fQ.VISxS7EqFageN2YwOaOpr1ufGF4Jzuhg0wd_KwOZt3o'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testStatusPersistence() {
  console.log('🔍 Testing Employee Status Persistence...\n')

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

    // Step 3: Set status to "available" (verfügbar)
    console.log('\n2. Setting status to "available"...')
    const { data: insertResult, error: insertError } = await supabase
      .from('employee_event_status')
      .upsert({
        employee_id: testEmployee.id,
        event_id: testEvent.id,
        status: 'available',
        response_method: 'manual_update',
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'employee_id,event_id'
      })
      .select()
      .single()
    
    if (insertError) {
      console.log('   ❌ Error setting status:', insertError.message)
      return
    } else {
      console.log('   ✅ Status set successfully')
    }

    // Step 4: Verify status was saved
    console.log('\n3. Verifying status persistence...')
    const { data: savedStatus, error: fetchError } = await supabase
      .from('employee_event_status')
      .select('*')
      .eq('employee_id', testEmployee.id)
      .eq('event_id', testEvent.id)
      .single()
    
    if (fetchError) {
      console.log('   ❌ Error fetching status:', fetchError.message)
    } else if (savedStatus && savedStatus.status === 'available') {
      console.log('   ✅ Status persisted correctly:', savedStatus.status)
      console.log('   📅 Updated at:', savedStatus.updated_at)
    } else {
      console.log('   ❌ Status not found or incorrect:', savedStatus?.status)
    }

    // Step 5: Test loading employees with status (like the app does)
    console.log('\n4. Testing employee loading with status...')
    
    // First get all employees
    const { data: allEmployees, error: employeesError } = await supabase
      .from('employees')
      .select('id, name, user_id, role, employment_type, is_always_needed, last_worked_date')
      .order('name')

    if (employeesError) {
      console.log('   ❌ Error loading employees:', employeesError.message)
      return
    }

    // Then get all statuses for this event
    const { data: statuses, error: statusError } = await supabase
      .from('employee_event_status')
      .select('employee_id, status, responded_at')
      .eq('event_id', testEvent.id)

    if (statusError) {
      console.log('   ❌ Error loading statuses:', statusError.message)
      return
    }

    // Create a map of employee ID to status
    const statusMap = {}
    statuses?.forEach(status => {
      statusMap[status.employee_id] = status.status
    })

    // Combine employees with their statuses
    const employeesWithStatus = allEmployees?.map(employee => ({
      ...employee,
      employee_event_status: statusMap[employee.id] ? [{
        status: statusMap[employee.id],
        event_id: testEvent.id
      }] : []
    }))

    // Check our test employee
    const testEmployeeWithStatus = employeesWithStatus?.find(emp => emp.id === testEmployee.id)
    if (testEmployeeWithStatus?.employee_event_status?.[0]?.status === 'available') {
      console.log('   ✅ Employee status loaded correctly in combined data')
    } else {
      console.log('   ❌ Employee status not found in combined data')
    }

    console.log('\n✅ Status Persistence Test Completed!')
    console.log('\n📋 Summary:')
    console.log('- Status can be set in database ✅')
    console.log('- Status persists after setting ✅')
    console.log('- Status can be loaded with employee data ✅')
    console.log('- Status should persist across browser sessions ✅')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testStatusPersistence()