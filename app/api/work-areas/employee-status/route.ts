import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json({
        success: false,
        error: 'Event ID is required'
      }, { status: 400 })
    }

    console.log(`🔄 API: Fetching employee statuses for work area assignment, event: ${eventId}`)

    // Get employees with their event status for work area assignment
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select(`
        id, 
        name, 
        user_id, 
        role, 
        skills, 
        employment_type, 
        is_always_needed,
        employee_event_status!inner(status, event_id)
      `)
      .eq('employee_event_status.event_id', eventId)
      .order('name')

    if (employeesError) {
      console.error('❌ Failed to fetch employees with status:', employeesError)
      return NextResponse.json({
        success: false,
        error: `Failed to fetch employees: ${employeesError.message}`
      }, { status: 500 })
    }

    // Also get employees without status (new employees)
    const { data: allEmployees, error: allEmployeesError } = await supabase
      .from('employees')
      .select('id, name, user_id, role, skills, employment_type, is_always_needed')
      .order('name')

    if (allEmployeesError) {
      console.error('❌ Failed to fetch all employees:', allEmployeesError)
      return NextResponse.json({
        success: false,
        error: `Failed to fetch all employees: ${allEmployeesError.message}`
      }, { status: 500 })
    }

    // Combine employees with and without status
    const employeesWithStatus = (allEmployees || []).map(emp => {
      const statusRecord = (employees || []).find(e => e.id === emp.id)
      const status = statusRecord?.employee_event_status?.[0]?.status || 
                   (emp.is_always_needed ? 'selected' : 'available')
      
      return {
        ...emp,
        employee_event_status: [{ status, event_id: eventId }]
      }
    })

    console.log(`✅ Fetched ${employeesWithStatus.length} employees with work area statuses`)

    return NextResponse.json({
      success: true,
      data: employeesWithStatus
    })

  } catch (error) {
    console.error('❌ Employee status API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch employee statuses'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, eventId, status, workAreaId } = body

    if (!employeeId || !eventId || !status) {
      return NextResponse.json({
        success: false,
        error: 'Employee ID, Event ID, and Status are required'
      }, { status: 400 })
    }

    console.log(`🔄 API: Updating employee ${employeeId} status to ${status} for event ${eventId}`)

    // Update employee event status
    const { error: statusError } = await supabase
      .from('employee_event_status')
      .upsert({
        employee_id: employeeId,
        event_id: eventId,
        status: status,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'employee_id,event_id'
      })

    if (statusError) {
      console.error('❌ Failed to update employee status:', statusError)
      return NextResponse.json({
        success: false,
        error: `Failed to update employee status: ${statusError.message}`
      }, { status: 500 })
    }

    // If assigning to work area, also create work assignment
    if (status === 'selected' && workAreaId) {
      const { error: assignmentError } = await supabase
        .from('work_assignments')
        .upsert({
          employee_id: employeeId,
          work_area_id: workAreaId,
          event_id: eventId,
          assigned_at: new Date().toISOString()
        }, {
          onConflict: 'employee_id,event_id'
        })

      if (assignmentError) {
        console.error('❌ Failed to create work assignment:', assignmentError)
        // Don't fail the whole request, just log the error
        console.log('⚠️ Employee status updated but work assignment failed')
      }
    }

    // If removing from work area, delete work assignment
    if (status === 'available') {
      const { error: removeError } = await supabase
        .from('work_assignments')
        .delete()
        .eq('employee_id', employeeId)
        .eq('event_id', eventId)

      if (removeError) {
        console.error('❌ Failed to remove work assignment:', removeError)
        // Don't fail the whole request, just log the error
        console.log('⚠️ Employee status updated but work assignment removal failed')
      }
    }

    console.log(`✅ Employee status updated successfully`)

    return NextResponse.json({
      success: true,
      message: 'Employee status updated successfully'
    })

  } catch (error) {
    console.error('❌ Employee status update API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update employee status'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId } = body

    if (!eventId) {
      return NextResponse.json({
        success: false,
        error: 'Event ID is required'
      }, { status: 400 })
    }

    console.log(`🔄 API: Syncing all employee statuses for work area assignment, event: ${eventId}`)

    // Reset all employee statuses for this event to 'available' except always needed
    const { data: employees, error: fetchError } = await supabase
      .from('employees')
      .select('id, is_always_needed')

    if (fetchError) {
      console.error('❌ Failed to fetch employees:', fetchError)
      return NextResponse.json({
        success: false,
        error: `Failed to fetch employees: ${fetchError.message}`
      }, { status: 500 })
    }

    let resetCount = 0
    for (const employee of employees || []) {
      const newStatus = employee.is_always_needed ? 'selected' : 'available'
      
      const { error: updateError } = await supabase
        .from('employee_event_status')
        .upsert({
          employee_id: employee.id,
          event_id: eventId,
          status: newStatus,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'employee_id,event_id'
        })

      if (updateError) {
        console.error(`❌ Failed to reset status for employee ${employee.id}:`, updateError)
      } else {
        resetCount++
      }
    }

    // Also clear all work assignments for this event
    const { error: clearAssignmentsError } = await supabase
      .from('work_assignments')
      .delete()
      .eq('event_id', eventId)

    if (clearAssignmentsError) {
      console.error('❌ Failed to clear work assignments:', clearAssignmentsError)
    }

    console.log(`✅ Reset ${resetCount} employee statuses and cleared work assignments`)

    return NextResponse.json({
      success: true,
      message: `Reset ${resetCount} employee statuses for work area assignment`,
      resetCount
    })

  } catch (error) {
    console.error('❌ Employee status sync API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync employee statuses'
    }, { status: 500 })
  }
}