import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/events/create-with-work-areas - Create event with work areas
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event_data, work_areas_data = [] } = body

    // Validate required event fields
    const requiredFields = ['title', 'location', 'event_date', 'start_time', 'hourly_rate', 'employees_needed', 'employees_to_ask']
    for (const field of requiredFields) {
      if (!event_data[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required event field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate work areas if provided
    if (work_areas_data.length > 0) {
      for (let i = 0; i < work_areas_data.length; i++) {
        const workArea = work_areas_data[i]
        const requiredWorkAreaFields = ['name', 'location', 'max_capacity', 'role_requirements']
        
        for (const field of requiredWorkAreaFields) {
          if (!workArea[field]) {
            return NextResponse.json(
              { success: false, error: `Missing required work area field: ${field} in work area ${i + 1}` },
              { status: 400 }
            )
          }
        }

        // Validate role_requirements is an object
        if (typeof workArea.role_requirements !== 'object') {
          return NextResponse.json(
            { success: false, error: `role_requirements must be an object in work area ${i + 1}` },
            { status: 400 }
          )
        }
      }
    }

    // Use the enhanced database function to create event with work areas
    const { data, error } = await supabase
      .rpc('create_event_with_work_areas', {
        p_event_data: event_data,
        p_work_areas_data: work_areas_data
      })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      message: `Event "${event_data.title}" created successfully${work_areas_data.length > 0 ? ` with ${work_areas_data.length} work areas` : ''}`
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating event with work areas:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create event with work areas' },
      { status: 500 }
    )
  }
} 