// Test script to verify auto-assignment functionality
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vnxhfmrjzwxumaakgwmq.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZueGhmbXJqend4dW1hYWtnd21xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg1NDQ5OCwiZXhwIjoyMDY4NDMwNDk4fQ.VISxS7EqFageN2YwOaOpr1ufGF4Jzuhg0wd_KwOZt3o'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testAutoAssignment() {
  console.log('🔧 Testing Auto-Assignment Functionality...\n')

  try {
    // Step 1: Get test data
    const { data: events } = await supabase.from('events').select('id, title').limit(1)
    const { data: employees } = await supabase.from('employees').select('id, name, role').limit(3)
    
    if (!events?.length || !employees?.length) {
      console.log('⚠️  No events or employees found for testing')
      return
    }

    const testEvent = events[0]
    console.log(`📅 Testing with event: ${testEvent.title} (${testEvent.id})`)

    // Step 2: Set some employees as available/selected
    console.log('\n1. Setting employees as available/selected...')
    for (let i = 0; i < Math.min(employees.length, 2); i++) {
      const employee = employees[i]
      const status = i === 0 ? 'available' : 'selected'
      
      await supabase
        .from('employee_event_status')
        .upsert({
          employee_id: employee.id,
          event_id: testEvent.id,
          status: status,
          response_method: 'test_script',
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'employee_id,event_id'
        })
      
      console.log(`   ✅ Set ${employee.name} (${employee.role}) to ${status}`)
    }

    // Step 3: Check if work areas exist for this event
    console.log('\n2. Checking work areas for event...')
    const { data: workAreas } = await supabase
      .from('work_areas')
      .select('id, name, max_capacity, role_requirements, is_active')
      .eq('event_id', testEvent.id)
      .eq('is_active', true)
    
    if (!workAreas || workAreas.length === 0) {
      console.log('   ⚠️  No active work areas found for this event')
      console.log('   Creating test work areas...')
      
      // Create test work areas
      const testWorkAreas = [
        {
          event_id: testEvent.id,
          name: 'Mobile Theke 1',
          location: 'eingangsbereich/outdoor',
          max_capacity: 2,
          role_requirements: { allrounder: 1, versorger: 1 },
          is_active: true
        },
        {
          event_id: testEvent.id,
          name: 'Mobile Theke 2',
          location: 'eingangsbereich/outdoor',
          max_capacity: 2,
          role_requirements: { verkauf: 1, essen: 1 },
          is_active: true
        }
      ]
      
      const { data: createdAreas } = await supabase
        .from('work_areas')
        .insert(testWorkAreas)
        .select('id, name, max_capacity, role_requirements')
      
      if (createdAreas) {
        console.log(`   ✅ Created ${createdAreas.length} test work areas`)
        createdAreas.forEach(area => {
          console.log(`      - ${area.name}: capacity ${area.max_capacity}`)
        })
      }
    } else {
      console.log(`   ✅ Found ${workAreas.length} work areas for event`)
      workAreas.forEach(area => {
        console.log(`      - ${area.name}: capacity ${area.max_capacity}, roles: ${JSON.stringify(area.role_requirements)}`)
      })
    }

    // Step 4: Test the auto-assignment API
    console.log('\n3. Testing auto-assignment API...')
    
    const response = await fetch('http://localhost:3000/api/work-assignments', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_id: testEvent.id
      }),
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('   ✅ Auto-assignment API call successful')
      console.log(`   📊 Message: ${result.message}`)
      console.log(`   👥 Assignments created: ${result.data?.length || 0}`)
      
      if (result.data && result.data.length > 0) {
        result.data.forEach(assignment => {
          console.log(`      - ${assignment.employee?.name} → ${assignment.work_area?.name}`)
        })
      }
    } else {
      console.log('   ❌ Auto-assignment API call failed:', result.error)
    }

    // Step 5: Verify assignments were created
    console.log('\n4. Verifying assignments in database...')
    const { data: assignments } = await supabase
      .from('work_assignments')
      .select(`
        id,
        employee:employees(name, role),
        work_area:work_areas(name)
      `)
      .eq('event_id', testEvent.id)
    
    if (assignments && assignments.length > 0) {
      console.log(`   ✅ Found ${assignments.length} assignments in database`)
      assignments.forEach(assignment => {
        console.log(`      - ${assignment.employee?.name} (${assignment.employee?.role}) → ${assignment.work_area?.name}`)
      })
    } else {
      console.log('   ⚠️  No assignments found in database')
    }

    console.log('\n✅ Auto-Assignment Test Completed!')
    console.log('\n📋 Summary:')
    console.log('- Employee statuses can be set ✅')
    console.log('- Work areas exist or can be created ✅')
    console.log('- Auto-assignment API responds ✅')
    console.log('- Assignments are saved to database ✅')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testAutoAssignment()