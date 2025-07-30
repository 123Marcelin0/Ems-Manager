#!/usr/bin/env tsx

/**
 * Test Work Areas Loading for Übersicht Page
 * 
 * This script tests that work areas are loading correctly for the overview page
 */

// Load environment variables first
import './load-env'

import { supabaseAdmin } from '../lib/supabase'

async function testWorkAreasLoading() {
  console.log('🧪 Testing work areas loading for Übersicht page...\n')

  try {
    // 1. Get the current event
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError)
      return
    }

    if (!events || events.length === 0) {
      console.log('⚠️ No events found - creating a test event...')
      
      const { data: newEvent, error: createError } = await supabaseAdmin
        .from('events')
        .insert({
          title: 'Test Event for Übersicht',
          location: 'Test Location',
          event_date: '2025-08-01',
          start_time: '10:00:00',
          hourly_rate: 15.00,
          employees_needed: 5,
          employees_to_ask: 8,
          status: 'draft'
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Error creating test event:', createError)
        return
      }

      console.log('✅ Created test event:', newEvent.title)
      events.push(newEvent)
    }

    const currentEvent = events[0]
    console.log(`📅 Using event: ${currentEvent.title} (${currentEvent.id})`)

    // 2. Check work areas for this event
    const { data: workAreas, error: workAreasError } = await supabaseAdmin
      .from('work_areas')
      .select('*')
      .eq('event_id', currentEvent.id)
      .eq('is_active', true)

    if (workAreasError) {
      console.error('❌ Error fetching work areas:', workAreasError)
      return
    }

    console.log(`🏢 Found ${workAreas?.length || 0} active work areas for this event`)
    
    if (workAreas && workAreas.length > 0) {
      workAreas.forEach(area => {
        console.log(`   - ${area.name} (Capacity: ${area.max_capacity}, Location: ${area.location})`)
        console.log(`     Role requirements:`, area.role_requirements)
      })
    } else {
      console.log('⚠️ No work areas found - this might be why Übersicht is not working')
      console.log('💡 Try creating work areas in the Arbeitsbereiche section first')
    }

    // 3. Check work assignments
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('work_assignments')
      .select(`
        id,
        employee_id,
        work_area_id,
        event_id,
        assigned_at,
        employee:employees(id, name, role),
        work_area:work_areas(id, name, location)
      `)
      .eq('event_id', currentEvent.id)

    if (assignmentsError) {
      console.error('❌ Error fetching work assignments:', assignmentsError)
      return
    }

    console.log(`👥 Found ${assignments?.length || 0} work assignments for this event`)
    
    if (assignments && assignments.length > 0) {
      assignments.forEach(assignment => {
        console.log(`   - ${assignment.employee?.name} assigned to ${assignment.work_area?.name}`)
      })
    }

    // 4. Check employees
    const { data: employees, error: employeesError } = await supabaseAdmin
      .from('employees')
      .select('id, name, role, employment_type, is_always_needed')
      .limit(10)

    if (employeesError) {
      console.error('❌ Error fetching employees:', employeesError)
      return
    }

    console.log(`👤 Found ${employees?.length || 0} employees in database`)
    
    if (employees && employees.length > 0) {
      employees.forEach(emp => {
        console.log(`   - ${emp.name} (${emp.role}, ${emp.employment_type})`)
      })
    }

    // 5. Test the work areas API endpoint
    console.log('\n🔗 Testing work areas API endpoint...')
    
    try {
      const response = await fetch(`http://localhost:3000/api/work-areas?eventId=${currentEvent.id}`)
      const result = await response.json()
      
      if (result.success) {
        console.log(`✅ API returned ${result.data?.length || 0} work areas`)
      } else {
        console.log(`❌ API error: ${result.error}`)
      }
    } catch (apiError) {
      console.log(`⚠️ Could not test API (app might not be running): ${apiError}`)
    }

    console.log('\n📋 SUMMARY FOR ÜBERSICHT PAGE:')
    console.log('='.repeat(50))
    console.log(`Event: ${currentEvent.title}`)
    console.log(`Work Areas: ${workAreas?.length || 0}`)
    console.log(`Assignments: ${assignments?.length || 0}`)
    console.log(`Employees: ${employees?.length || 0}`)
    
    if ((workAreas?.length || 0) === 0) {
      console.log('\n💡 RECOMMENDATION:')
      console.log('The Übersicht page needs work areas to display properly.')
      console.log('1. Go to Arbeitsbereiche section')
      console.log('2. Create some work areas for your event')
      console.log('3. Then the Übersicht page should show them correctly')
    } else {
      console.log('\n✅ Work areas are available - Übersicht should work!')
    }

  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

// Run the test
testWorkAreasLoading().catch(error => {
  console.error('Unhandled error:', error)
  process.exit(1)
})