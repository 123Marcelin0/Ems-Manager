#!/usr/bin/env tsx

/**
 * Debug Data Persistence Issues
 * 
 * This script helps debug real-world data persistence problems by:
 * 1. Checking what data is actually in the database
 * 2. Testing CRUD operations
 * 3. Identifying where data is being lost
 */

// Load environment variables first
import './load-env'

import { supabaseAdmin } from '../lib/supabase'

async function debugDataPersistence() {
  console.log('🔍 Debugging data persistence issues...\n')

  try {
    // 1. Check what data exists in key tables
    console.log('1️⃣ Checking current data in database...')
    
    // Check events
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError)
    } else {
      console.log(`📅 Events in database: ${events?.length || 0}`)
      if (events && events.length > 0) {
        events.forEach(event => {
          console.log(`   - ${event.title} (${event.id}) - Status: ${event.status}`)
        })
      }
    }

    // Check employees
    const { data: employees, error: employeesError } = await supabaseAdmin
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (employeesError) {
      console.error('❌ Error fetching employees:', employeesError)
    } else {
      console.log(`👥 Employees in database: ${employees?.length || 0}`)
      if (employees && employees.length > 0) {
        employees.forEach(employee => {
          console.log(`   - ${employee.name} (${employee.id}) - Role: ${employee.role}`)
        })
      }
    }

    // Check employee event status
    const { data: statuses, error: statusesError } = await supabaseAdmin
      .from('employee_event_status')
      .select('*, employees(name), events(title)')
      .order('created_at', { ascending: false })
      .limit(10)

    if (statusesError) {
      console.error('❌ Error fetching employee statuses:', statusesError)
    } else {
      console.log(`📊 Employee event statuses in database: ${statuses?.length || 0}`)
      if (statuses && statuses.length > 0) {
        statuses.forEach(status => {
          console.log(`   - ${status.employees?.name} for ${status.events?.title}: ${status.status}`)
        })
      }
    }

    // Check work areas
    const { data: workAreas, error: workAreasError } = await supabaseAdmin
      .from('work_areas')
      .select('*, events(title)')
      .order('created_at', { ascending: false })
      .limit(5)

    if (workAreasError) {
      console.error('❌ Error fetching work areas:', workAreasError)
    } else {
      console.log(`🏢 Work areas in database: ${workAreas?.length || 0}`)
      if (workAreas && workAreas.length > 0) {
        workAreas.forEach(area => {
          console.log(`   - ${area.name} for ${area.events?.title} (Capacity: ${area.max_capacity})`)
        })
      }
    }

    // 2. Test a simple CRUD operation
    console.log('\n2️⃣ Testing CRUD operations...')
    
    // Test creating an event
    const testEvent = {
      title: 'Test Event - Debug',
      location: 'Test Location',
      event_date: '2025-08-01',
      start_time: '10:00:00',
      hourly_rate: 15.00,
      employees_needed: 5,
      employees_to_ask: 8,
      status: 'draft' as const
    }

    console.log('📝 Creating test event...')
    const { data: createdEvent, error: createError } = await supabaseAdmin
      .from('events')
      .insert([testEvent])
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating test event:', createError)
    } else {
      console.log(`✅ Test event created: ${createdEvent.id}`)
      
      // Test reading it back
      console.log('📖 Reading test event back...')
      const { data: readEvent, error: readError } = await supabaseAdmin
        .from('events')
        .select('*')
        .eq('id', createdEvent.id)
        .single()

      if (readError) {
        console.error('❌ Error reading test event:', readError)
      } else {
        console.log(`✅ Test event read back: ${readEvent.title}`)
        
        // Test updating it
        console.log('✏️ Updating test event...')
        const { data: updatedEvent, error: updateError } = await supabaseAdmin
          .from('events')
          .update({ title: 'Test Event - Updated' })
          .eq('id', createdEvent.id)
          .select()
          .single()

        if (updateError) {
          console.error('❌ Error updating test event:', updateError)
        } else {
          console.log(`✅ Test event updated: ${updatedEvent.title}`)
        }
        
        // Clean up - delete test event
        console.log('🗑️ Cleaning up test event...')
        const { error: deleteError } = await supabaseAdmin
          .from('events')
          .delete()
          .eq('id', createdEvent.id)

        if (deleteError) {
          console.error('❌ Error deleting test event:', deleteError)
        } else {
          console.log('✅ Test event deleted successfully')
        }
      }
    }

    // 3. Check RLS policies
    console.log('\n3️⃣ Checking RLS policies...')
    
    // Test with regular client (with RLS)
    const { supabase } = await import('../lib/supabase')
    
    const { data: eventsWithRLS, error: rlsError } = await supabase
      .from('events')
      .select('*')
      .limit(5)

    if (rlsError) {
      console.error('❌ RLS Error (this might be the issue!):', rlsError)
      console.log('💡 This suggests RLS policies might be blocking data access')
    } else {
      console.log(`✅ RLS check passed - can access ${eventsWithRLS?.length || 0} events with regular client`)
    }

    // 4. Check authentication status
    console.log('\n4️⃣ Checking authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('❌ Auth error:', authError)
    } else if (!user) {
      console.log('⚠️ No authenticated user found - this could be the issue!')
      console.log('💡 RLS policies require authentication to access data')
    } else {
      console.log(`✅ Authenticated user: ${user.id}`)
    }

    console.log('\n📋 DIAGNOSIS COMPLETE')
    console.log('='.repeat(50))

  } catch (error) {
    console.error('💥 Debug script failed:', error)
  }
}

// Run the debug
debugDataPersistence().catch(error => {
  console.error('Unhandled error:', error)
  process.exit(1)
})