import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/work-assignments - Fetch work assignments for an event
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const event_id = searchParams.get('event_id')
    const employee_id = searchParams.get('employee_id')
    const work_area_id = searchParams.get('work_area_id')

    let query = supabase
      .from('work_assignments')
      .select(`
        id,
        employee_id,
        work_area_id,
        event_id,
        assigned_at,
        employees (
          id,
          name,
          role,
          phone_number
        ),
        work_areas (
          id,
          name,
          location,
          max_capacity,
          role_requirements
        ),
        events (
          id,
          title,
          event_date
        )
      `)
      .order('assigned_at', { ascending: false })

    // Apply filters
    if (event_id) {
      query = query.eq('event_id', event_id)
    }
    if (employee_id) {
      query = query.eq('employee_id', employee_id)
    }
    if (work_area_id) {
      query = query.eq('work_area_id', work_area_id)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Error fetching work assignments:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch work assignments' },
      { status: 500 }
    )
  }
}

// POST /api/work-assignments - Save work assignments for an event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event_id, assignments } = body

    // Validate required fields
    if (!event_id || !assignments || !Array.isArray(assignments)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: event_id, assignments (array)' },
        { status: 400 }
      )
    }

    // Validate each assignment
    for (let i = 0; i < assignments.length; i++) {
      const assignment = assignments[i]
      if (!assignment.employee_id || !assignment.work_area_id) {
        return NextResponse.json(
          { success: false, error: `Missing employee_id or work_area_id in assignment ${i + 1}` },
          { status: 400 }
        )
      }
    }

    // Use the database function to save assignments
    const { data, error } = await supabase
      .rpc('save_work_assignments', {
        p_event_id: event_id,
        p_assignments: assignments
      })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      message: `Successfully saved ${assignments.length} work assignments for event`
    }, { status: 201 })
  } catch (error) {
    console.error('Error saving work assignments:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save work assignments' },
      { status: 500 }
    )
  }
}

// DELETE /api/work-assignments - Remove specific assignment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assignment_id = searchParams.get('assignment_id')
    const event_id = searchParams.get('event_id')
    const employee_id = searchParams.get('employee_id')
    const work_area_id = searchParams.get('work_area_id')

    let deleteQuery = supabase.from('work_assignments').delete()

    if (assignment_id) {
      deleteQuery = deleteQuery.eq('id', assignment_id)
    } else if (event_id && employee_id && work_area_id) {
      deleteQuery = deleteQuery
        .eq('event_id', event_id)
        .eq('employee_id', employee_id)
        .eq('work_area_id', work_area_id)
    } else {
      return NextResponse.json(
        { success: false, error: 'Must provide either assignment_id or (event_id + employee_id + work_area_id)' },
        { status: 400 }
      )
    }

    const { error } = await deleteQuery

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Work assignment removed successfully'
    })
  } catch (error) {
    console.error('Error removing work assignment:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to remove work assignment' },
      { status: 500 }
    )
  }
} 