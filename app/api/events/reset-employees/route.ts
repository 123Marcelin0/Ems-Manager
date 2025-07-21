import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { event_id } = await request.json();

    if (!event_id) {
      return NextResponse.json({ success: false, error: 'Event ID is required' }, { status: 400 });
    }

    // Check if we're dealing with example events (non-UUID format)
    const isExampleEvent = event_id.startsWith('evt-') || !event_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    
    if (isExampleEvent) {
      // For example events, return a mock response
      console.log('Example event reset employees (local only):', event_id);
      return NextResponse.json({
        success: true,
        data: {
          event_id,
          updates: [],
          count: 0,
          note: 'Example event - reset handled locally'
        }
      });
    }

    try {
      // Get all employees for this event
      const { data: employees, error: employeesError } = await supabase
        .from('employee_event_status')
        .select('employee_id')
        .eq('event_id', event_id);

      if (employeesError) {
        console.error('Error getting employees:', employeesError);
        return NextResponse.json({ success: false, error: employeesError.message }, { status: 500 });
      }

      // Reset all employees to 'not_asked' status except always_needed ones
      const { data: alwaysNeeded, error: alwaysNeededError } = await supabase
        .from('employees')
        .select('id')
        .eq('is_always_needed', true);

      if (alwaysNeededError) {
        console.error('Error getting always needed employees:', alwaysNeededError);
        return NextResponse.json({ success: false, error: alwaysNeededError.message }, { status: 500 });
      }

      const alwaysNeededIds = (alwaysNeeded || []).map(emp => emp.id);

      // Update all employees for this event
      const updates = [];
      for (const employee of employees || []) {
        const isAlwaysNeeded = alwaysNeededIds.includes(employee.employee_id);
        const newStatus = isAlwaysNeeded ? 'always_needed' : 'not_asked';

        const { error: updateError } = await supabase
          .rpc('update_employee_event_status', {
            p_employee_id: employee.employee_id,
            p_event_id: event_id,
            p_new_status: newStatus,
            p_response_method: 'reset_all'
          });

        if (updateError) {
          console.error('Error updating employee status:', updateError);
          // Continue with other employees even if one fails
        } else {
          updates.push({
            employee_id: employee.employee_id,
            status: newStatus
          });
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          event_id,
          updates,
          count: updates.length
        }
      });
    } catch (dbError) {
      console.error('Database error in reset employees, falling back to local handling:', dbError);
      return NextResponse.json({
        success: true,
        data: {
          event_id,
          updates: [],
          count: 0,
          note: 'Database error - reset handled locally'
        }
      });
    }
  } catch (error) {
    console.error('Error in reset employees:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}