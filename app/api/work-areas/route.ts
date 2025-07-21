import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId');

    let query = supabaseAdmin
      .from('work_areas')
      .select(`
        id,
        event_id,
        name,
        location,
        description,
        max_capacity,
        current_assigned,
        is_active,
        priority,
        role_requirements,
        required_skills,
        color_theme,
        position_order,
        created_at,
        updated_at,
        created_by
      `);
    
    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query
      .eq('is_active', true)
      .order('position_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching work areas:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error in work areas GET:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const workAreaData = await request.json();

    // Validate required fields
    if (!workAreaData.event_id || !workAreaData.name || !workAreaData.location) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: event_id, name, location' 
      }, { status: 400 });
    }

    // Set defaults for optional fields
    const dataToInsert = {
      event_id: workAreaData.event_id,
      name: workAreaData.name,
      location: workAreaData.location,
      description: workAreaData.description || '',
      max_capacity: workAreaData.max_capacity || 1,
      current_assigned: 0,
      is_active: workAreaData.is_active !== undefined ? workAreaData.is_active : true,
      priority: workAreaData.priority || 'medium',
      role_requirements: workAreaData.role_requirements || {},
      required_skills: workAreaData.required_skills || [],
      color_theme: workAreaData.color_theme || 'blue',
      position_order: workAreaData.position_order || 0,
      created_by: null // Will be set by RLS if user is authenticated
    };

    const { data, error } = await supabaseAdmin
      .from('work_areas')
      .insert([dataToInsert])
      .select(`
        id,
        event_id,
        name,
        location,
        description,
        max_capacity,
        current_assigned,
        is_active,
        priority,
        role_requirements,
        required_skills,
        color_theme,
        position_order,
        created_at,
        updated_at,
        created_by
      `)
      .single();

    if (error) {
      console.error('Error creating work area:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in work areas POST:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}