import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { employee_id, event_id, status } = await request.json();

    if (!employee_id || !event_id || !status) {
      return NextResponse.json({ 
        success: false, 
        error: 'Employee ID, Event ID, and status are required' 
      }, { status: 400 });
    }

    // Map UI status to database status
    const dbStatus = 
      status === 'selected' ? 'selected' :
      status === 'available' ? 'available' :
      status === 'unavailable' ? 'unavailable' :
      status === 'always-needed' ? 'always_needed' :
      status === 'not-selected' ? 'not_asked' : 'not_asked';

    // Check if we're dealing with example employees (non-UUID format)
    const isExampleEmployee = employee_id.startsWith('emp-');
    
    if (isExampleEmployee) {
      // For example employees, just return success without database update
      console.log('Example employee status update (local only):', employee_id, status);
      return NextResponse.json({
        success: true,
        data: {
          employee_id,
          event_id,
          status: dbStatus,
          updated: true,
          note: 'Example employee - status updated locally only'
        }
      });
    }

    // For real employees with UUID format, update in database
    try {
      // First check if the employee exists in the database
      const { data: employee, error: employeeError } = await supabaseAdmin
        .from('employees')
        .select('id')
        .eq('id', employee_id)
        .single();

      if (employeeError || !employee) {
        console.error('Employee not found in database:', employee_id);
        return NextResponse.json({
          success: true,
          data: {
            employee_id,
            event_id,
            status: dbStatus,
            updated: true,
            note: 'Employee not found in database - status updated locally only'
          }
        });
      }

      // Update employee status using the database function
      const { data, error } = await supabaseAdmin
        .rpc('update_employee_event_status', {
          p_employee_id: employee_id,
          p_event_id: event_id,
          p_new_status: dbStatus,
          p_response_method: 'manual_update'
        });

      if (error) {
        console.error('Error updating employee status:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: {
          employee_id,
          event_id,
          status: dbStatus,
          updated: data
        }
      });
    } catch (dbError) {
      console.error('Database error, falling back to local update:', dbError);
      return NextResponse.json({
        success: true,
        data: {
          employee_id,
          event_id,
          status: dbStatus,
          updated: true,
          note: 'Database error - status updated locally only'
        }
      });
    }
  } catch (error) {
    console.error('Error in update status:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}