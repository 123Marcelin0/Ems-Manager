import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createEventInvitationMessage } from '@/lib/twilio'

export async function POST() {
  try {
    const now = new Date()
    
    // Check for events that should transition from recruiting to planned
    await checkRecruitmentCompletion()
    
    // Check for events that should start (recruiting/planned → active)
    await checkEventStart(now)
    
    // Check for events that should complete (active → completed)
    await checkEventCompletion(now)
    
    return NextResponse.json({ success: true, message: 'Lifecycle check completed' })
  } catch (error) {
    console.error('❌ Error in lifecycle check:', error)
    return NextResponse.json(
      { error: 'Failed to perform lifecycle check' },
      { status: 500 }
    )
  }
}

// Check if recruitment is complete and transition to planned
async function checkRecruitmentCompletion() {
  try {
    // Get events in recruiting status
    const { data: recruitingEvents, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'recruiting')

    if (error) throw error

    for (const event of recruitingEvents || []) {
      // Check recruitment status
      const { data: recruitmentStatus, error: statusError } = await supabase
        .rpc('check_recruitment_status', { p_event_id: event.id })

      if (statusError) continue

      if (recruitmentStatus && recruitmentStatus.length > 0) {
        const status = recruitmentStatus[0]
        
        // If we have enough available employees, mark as planned
        if (status.employees_available >= status.employees_needed) {
          await supabase
            .from('events')
            .update({ 
              status: 'planned',
              updated_at: new Date().toISOString()
            })
            .eq('id', event.id)

          console.log('✅ Event marked as planned:', event.title)
        }
      }
    }
  } catch (error) {
    console.error('❌ Error checking recruitment completion:', error)
  }
}

// Check if events should start and mark employees as working
async function checkEventStart(now: Date) {
  try {
    // Get events that should start (within 15 minutes of start time)
    const { data: eventsToStart, error } = await supabase
      .from('events')
      .select('*')
      .in('status', ['recruiting', 'planned'])
      .gte('event_date', now.toISOString().split('T')[0])

    if (error) throw error

    for (const event of eventsToStart || []) {
      const eventDateTime = new Date(`${event.event_date}T${event.start_time}`)
      const timeUntilStart = eventDateTime.getTime() - now.getTime()
      
      // If event starts within 15 minutes, mark as active and start work sessions
      if (timeUntilStart <= 15 * 60 * 1000 && timeUntilStart > -60 * 60 * 1000) { // Within 15 min before to 1 hour after
        await startEventWorkSession(event)
      }
    }
  } catch (error) {
    console.error('❌ Error checking event start:', error)
  }
}

// Start work session for an event
async function startEventWorkSession(event: any) {
  try {
    // Update event status to active
    await supabase
      .from('events')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', event.id)

    // Get all available employees for this event
    const { data: availableEmployees, error } = await supabase
      .from('employee_event_status')
      .select(`
        *,
        employees (
          id,
          name,
          phone_number
        )
      `)
      .eq('event_id', event.id)
      .eq('status', 'available')

    if (error) throw error

    // Mark employees as working and create time records
    for (const status of availableEmployees || []) {
      const employee = status.employees
      
      // Update employee status to working
      await supabase.rpc('update_employee_event_status', {
        p_employee_id: employee.id,
        p_event_id: event.id,
        p_new_status: 'working',
        p_response_method: 'automatic'
      })

      // Create time record
      await supabase
        .from('time_records')
        .insert({
          employee_id: employee.id,
          event_id: event.id,
          sign_in_time: new Date().toISOString(),
          hourly_rate: event.hourly_rate,
          status: 'active'
        })

      console.log('👷 Employee marked as working:', employee.name, 'for event:', event.title)
    }

    console.log('🚀 Event work session started:', event.title)
  } catch (error) {
    console.error('❌ Error starting event work session:', error)
  }
}

// Check if events should complete
async function checkEventCompletion(now: Date) {
  try {
    // Get active events that ended more than 2 hours ago
    const { data: activeEvents, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'active')

    if (error) throw error

    for (const event of activeEvents || []) {
      const eventEndTime = new Date(`${event.event_date}T${event.end_time || '23:59'}`)
      const timeSinceEnd = now.getTime() - eventEndTime.getTime()
      
      // If event ended more than 2 hours ago, mark as completed
      if (timeSinceEnd > 2 * 60 * 60 * 1000) {
        await completeEvent(event)
      }
    }
  } catch (error) {
    console.error('❌ Error checking event completion:', error)
  }
}

// Complete an event
async function completeEvent(event: any) {
  try {
    // Update event status to completed
    await supabase
      .from('events')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', event.id)

    // Mark all working employees as completed
    await supabase
      .from('employee_event_status')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('event_id', event.id)
      .eq('status', 'working')

    console.log('✅ Event completed:', event.title)
  } catch (error) {
    console.error('❌ Error completing event:', error)
  }
}