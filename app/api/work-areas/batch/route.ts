import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST batch create/update work areas for an event
export async function POST(request: Request) {
  try {
    const { event_id, work_areas, replace_existing = true } = await request.json();

    if (!event_id || !work_areas || !Array.isArray(work_areas)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: event_id, work_areas (array)' 
      }, { status: 400 });
    }

    // Start transaction-like operation
    let result = [];

    try {
      // If replace_existing is true, delete existing work areas for this event
      if (replace_existing) {
        const { error: deleteError } = await supabaseAdmin
          .from('work_areas')
          .delete()
          .eq('event_id', event_id);

        if (deleteError) {
          console.error('Error deleting existing work areas:', deleteError);
          return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
        }
      }

      // Prepare work areas data with defaults
      const workAreasToInsert = work_areas.map((area, index) => ({
        event_id: event_id,
        name: area.name,
        location: area.location,
        description: area.description || '',
        max_capacity: area.max_capacity || 1,
        current_assigned: 0,
        is_active: area.is_active !== undefined ? area.is_active : true,
        priority: area.priority || 'medium',
        role_requirements: area.role_requirements || {},
        required_skills: area.required_skills || [],
        color_theme: area.color_theme || 'blue',
        position_order: area.position_order !== undefined ? area.position_order : index,
        created_by: null
      }));

      // Insert all work areas
      const { data, error } = await supabaseAdmin
        .from('work_areas')
        .insert(workAreasToInsert)
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

      if (error) {
        console.error('Error creating work areas:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      result = data || [];

    } catch (transactionError) {
      console.error('Error in batch work areas operation:', transactionError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to complete batch operation' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully ${replace_existing ? 'replaced' : 'created'} ${result.length} work areas`
    });

  } catch (error) {
    console.error('Error in work areas batch POST:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}