import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET work areas with full assignment details
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId');

    // Use the view that includes assignment details
    let query = supabaseAdmin
      .from('work_areas_with_assignments')
      .select('*');
    
    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query
      .eq('is_active', true)
      .order('position_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching detailed work areas:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error in detailed work areas GET:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}