import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// PUT reorder work areas
export async function PUT(request: Request) {
  try {
    const { event_id, ordered_ids } = await request.json();

    if (!event_id || !ordered_ids || !Array.isArray(ordered_ids)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: event_id, ordered_ids (array)' 
      }, { status: 400 });
    }

    // Update position_order for each work area
    const updatePromises = ordered_ids.map((id, index) => 
      supabaseAdmin
        .from('work_areas')
        .update({ position_order: index })
        .eq('id', id)
        .eq('event_id', event_id)
    );

    const results = await Promise.all(updatePromises);

    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Error reordering work areas:', errors);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to reorder some work areas' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully reordered ${ordered_ids.length} work areas`
    });

  } catch (error) {
    console.error('Error in work areas reorder PUT:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}