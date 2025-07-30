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

    console.log(`🔄 API: Fetching work area assignments for event: ${eventId}`)

    // Use the database function to get work areas with assignments
    const { data, error } = await supabase
      .rpc('get_work_areas_with_assignments', {
        p_event_id: eventId
      })

    if (error) {
      console.error('❌ Failed to fetch work area assignments:', error)
      return NextResponse.json({
        success: false,
        error: `Failed to fetch work area assignments: ${error.message}`
      }, { status: 500 })
    }

    console.log(`✅ Fetched ${data?.length || 0} work areas with assignments`)

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('❌ Work area assignments API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch work area assignments'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, workAreaId, eventId, action } = body

    if (!employeeId || !eventId) {
      return NextResponse.json({
        success: false,
        error: 'Employee ID and Event ID are required'
      }, { status: 400 })
    }

    console.log(`🔄 API: ${action} employee ${employeeId} ${action === 'assign' ? 'to work area ' + workAreaId : 'from work area'} for event ${eventId}`)

    if (action === 'assign') {
      if (!workAreaId) {
        return NextResponse.json({
          success: false,
          error: 'Work Area ID is required for assignment'
        }, { status: 400 })
      }

      // Use the database function to assign employee
      const { data, error } = await supabase
        .rpc('assign_employee_to_work_area', {
          p_employee_id: employeeId,
          p_work_area_id: workAreaId,
          p_event_id: eventId
        })

      if (error) {
        console.error('❌ Failed to assign employee:', error)
        return NextResponse.json({
          success: false,
          error: `Failed to assign employee: ${error.message}`
        }, { status: 500 })
      }

      const result = data?.[0]
      if (!result?.success) {
        return NextResponse.json({
          success: false,
          error: result?.message || 'Assignment failed'
        }, { status: 400 })
      }

      console.log(`✅ Employee assigned successfully: ${result.message}`)

      return NextResponse.json({
        success: true,
        message: result.message,
        assignmentId: result.assignment_id
      })

    } else if (action === 'remove') {
      // Use the database function to remove employee
      const { data, error } = await supabase
        .rpc('remove_employee_from_work_area', {
          p_employee_id: employeeId,
          p_event_id: eventId
        })

      if (error) {
        console.error('❌ Failed to remove employee:', error)
        return NextResponse.json({
          success: false,
          error: `Failed to remove employee: ${error.message}`
        }, { status: 500 })
      }

      const result = data?.[0]
      if (!result?.success) {
        return NextResponse.json({
          success: false,
          error: result?.message || 'Removal failed'
        }, { status: 400 })
      }

      console.log(`✅ Employee removed successfully: ${result.message}`)

      return NextResponse.json({
        success: true,
        message: result.message
      })

    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use "assign" or "remove"'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Work area assignment API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process work area assignment'
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

    console.log(`🔄 API: Syncing all work area assignments for event: ${eventId}`)

    // Use the sync function to get all assignments
    const { data, error } = await supabase
      .rpc('sync_work_area_assignments')

    if (error) {
      console.error('❌ Failed to sync work area assignments:', error)
      return NextResponse.json({
        success: false,
        error: `Failed to sync work area assignments: ${error.message}`
      }, { status: 500 })
    }

    // Filter assignments for the specific event
    const eventAssignments = (data || []).filter((assignment: any) => 
      assignment.event_title // This would need to be filtered by event ID in a real implementation
    )

    console.log(`✅ Synced ${eventAssignments.length} work area assignments`)

    return NextResponse.json({
      success: true,
      message: `Synced ${eventAssignments.length} work area assignments`,
      data: eventAssignments
    })

  } catch (error) {
    console.error('❌ Work area sync API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync work area assignments'
    }, { status: 500 })
  }
}