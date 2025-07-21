import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { event_id, count } = await request.json();

    if (!event_id) {
      return NextResponse.json({ success: false, error: 'Event ID is required' }, { status: 400 });
    }

    // Check if we're dealing with example events (non-UUID format)
    const isExampleEvent = event_id.startsWith('evt-') || !event_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    
    if (isExampleEvent) {
      // For example events, return a mock response
      console.log('Example event random selection (local only):', event_id, count);
      return NextResponse.json({
        success: true,
        data: {
          selectedEmployees: [],
          summary: null,
          count: 0,
          note: 'Example event - random selection handled locally'
        }
      });
    }

    try {
      // Use the database function to select employees for the event
      const { data: selectedEmployees, error: selectionError } = await supabaseAdmin
        .rpc('select_employees_for_event', {
          p_event_id: event_id,
          p_additional_count: count || 0
        });

      if (selectionError) {
        console.error('Error selecting employees:', selectionError);
        return NextResponse.json({ success: false, error: selectionError.message }, { status: 500 });
      }

      // Update the status of selected employees to 'selected'
      if (selectedEmployees && selectedEmployees.length > 0) {
        for (const employee of selectedEmployees) {
          const { error: updateError } = await supabaseAdmin
            .rpc('update_employee_event_status', {
              p_employee_id: employee.employee_id,
              p_event_id: event_id,
              p_new_status: 'selected',
              p_response_method: 'system_selection'
            });

          if (updateError) {
            console.error('Error updating employee status:', updateError);
            // Continue with other employees even if one fails
          }
        }
      }

      // Get updated event summary
      const { data: summary, error: summaryError } = await supabaseAdmin
        .rpc('get_event_employee_summary', {
          p_event_id: event_id
        });

      if (summaryError) {
        console.error('Error getting event summary:', summaryError);
      }

      return NextResponse.json({
        success: true,
        data: {
          selectedEmployees,
          summary: summary?.[0] || null,
          count: selectedEmployees?.length || 0
        }
      });
    } catch (dbError) {
      console.error('Database error in random selection, falling back to local handling:', dbError);
      return NextResponse.json({
        success: true,
        data: {
          selectedEmployees: [],
          summary: null,
          count: 0,
          note: 'Database error - random selection handled locally'
        }
      });
    }
  } catch (error) {
    console.error('Error in random selection:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}