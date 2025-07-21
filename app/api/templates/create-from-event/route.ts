import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/templates/create-from-event - Create template from existing event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event_id, template_name, template_type = 'combined' } = body

    // Validate required fields
    if (!event_id || !template_name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: event_id, template_name' },
        { status: 400 }
      )
    }

    // Validate template_type
    const validTypes = ['event', 'work_area', 'combined']
    if (!validTypes.includes(template_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid template_type. Must be: event, work_area, or combined' },
        { status: 400 }
      )
    }

    // Use the database function to create template from event
    const { data, error } = await supabase
      .rpc('create_template_from_event', {
        p_event_id: event_id,
        p_template_name: template_name,
        p_template_type: template_type
      })

    if (error) throw error

    // Get the created template details
    const { data: template, error: fetchError } = await supabase
      .from('templates')
      .select(`
        id,
        name,
        template_type,
        location,
        event_data,
        work_areas_data,
        created_by,
        created_at,
        updated_at
      `)
      .eq('id', data)
      .single()

    if (fetchError) throw fetchError

    return NextResponse.json({
      success: true,
      data: template,
      message: `Template "${template_name}" created successfully from event`
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating template from event:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create template from event' },
      { status: 500 }
    )
  }
} 