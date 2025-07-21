import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/templates - Fetch all templates or filter by type/location
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const template_type = searchParams.get('type')
    const location = searchParams.get('location')

    let query = supabase
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
      .order('created_at', { ascending: false })

    // Apply filters if provided
    if (template_type) {
      query = query.eq('template_type', template_type)
    }
    if (location) {
      query = query.eq('location', location)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// POST /api/templates - Create new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, template_type, location, event_data, work_areas_data } = body

    // Validate required fields
    if (!name || !template_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, template_type' },
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

    const { data, error } = await supabase
      .from('templates')
      .insert({
        name,
        template_type,
        location: location || null,
        event_data: event_data || {},
        work_areas_data: work_areas_data || {}
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create template' },
      { status: 500 }
    )
  }
}

// PUT /api/templates - Update existing template
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, template_type, location, event_data, work_areas_data } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (template_type !== undefined) updateData.template_type = template_type
    if (location !== undefined) updateData.location = location
    if (event_data !== undefined) updateData.event_data = event_data
    if (work_areas_data !== undefined) updateData.work_areas_data = work_areas_data

    const { data, error } = await supabase
      .from('templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update template' },
      { status: 500 }
    )
  }
}

// DELETE /api/templates - Delete template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete template' },
      { status: 500 }
    )
  }
} 