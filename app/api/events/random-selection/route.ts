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
      // Implement fair distribution algorithm directly
      // Get all employees with their last worked dates
      const { data: allEmployees, error: employeesError } = await supabaseAdmin
        .from('employees')
        .select('id, name, last_worked_date, is_always_needed, employment_type')
        .eq('employment_type', 'part_time'); // Focus on part-time employees for selection

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        return NextResponse.json({ success: false, error: employeesError.message }, { status: 500 });
      }

      // Get current employee statuses for this event
      const { data: currentStatuses, error: statusError } = await supabaseAdmin
        .from('employee_event_status')
        .select('employee_id, status')
        .eq('event_id', event_id);

      if (statusError) {
        console.error('Error fetching current statuses:', statusError);
      }

      // Create status map
      const statusMap = new Map();
      currentStatuses?.forEach(status => {
        statusMap.set(status.employee_id, status.status);
      });

      // Filter selectable employees (not already selected, not always needed, available or not asked)
      const selectableEmployees = allEmployees.filter(emp => {
        const currentStatus = statusMap.get(emp.id);
        return !emp.is_always_needed && 
               (currentStatus === 'available' || currentStatus === 'not_asked' || !currentStatus);
      });

      // Sort by last worked date (fair distribution - longest time since last work first)
      selectableEmployees.sort((a, b) => {
        if (!a.last_worked_date && !b.last_worked_date) return 0;
        if (!a.last_worked_date) return -1; // Never worked comes first
        if (!b.last_worked_date) return 1;
        return new Date(a.last_worked_date) - new Date(b.last_worked_date);
      });

      // Select the required number of employees
      const selectedEmployees = selectableEmployees.slice(0, Math.min(count, selectableEmployees.length));

      // Update the status of selected employees to 'selected'
      const updatePromises = selectedEmployees.map(employee => 
        supabaseAdmin
          .from('employee_event_status')
          .upsert({
            employee_id: employee.id,
            event_id: event_id,
            status: 'selected',
            response_method: 'system_selection',
            responded_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'employee_id,event_id'
          })
      );

      await Promise.all(updatePromises);

      // Get updated summary
      const { data: summaryData, error: summaryError } = await supabaseAdmin
        .from('employee_event_status')
        .select('status')
        .eq('event_id', event_id);

      let summary = null;
      if (!summaryError && summaryData) {
        const statusCounts = summaryData.reduce((acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {});
        
        summary = {
          event_id: event_id,
          total_asked: statusCounts.asked || 0,
          total_available: statusCounts.available || 0,
          total_unavailable: statusCounts.unavailable || 0,
          total_selected: statusCounts.selected || 0,
          total_working: statusCounts.working || 0,
          total_completed: statusCounts.completed || 0
        };
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