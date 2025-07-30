import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event ID is required' 
      }, { status: 400 });
    }

    console.log(`Fetching employee statuses for event: ${eventId}`);

    // First get all employees
    const { data: allEmployees, error: employeesError } = await supabaseAdmin
      .from('employees')
      .select('id, name, user_id, role, phone_number, employment_type, is_always_needed, last_worked_date, total_hours_worked, created_at, updated_at')
      .order('name');

    if (employeesError) {
      console.error('Error fetching employees:', employeesError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch employees' 
      }, { status: 500 });
    }

    if (!allEmployees || allEmployees.length === 0) {
      console.log('No employees found in database');
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Then get all statuses for this event
    const { data: statuses, error: statusError } = await supabaseAdmin
      .from('employee_event_status')
      .select('employee_id, status, responded_at')
      .eq('event_id', eventId);

    if (statusError) {
      console.warn('Error fetching statuses (this is OK if no statuses exist yet):', statusError);
      // Continue with empty statuses instead of failing
    }

    // Create a map of employee ID to status
    const statusMap: Record<string, string> = {};
    statuses?.forEach(status => {
      statusMap[status.employee_id] = status.status;
    });

    // Combine employees with their statuses
    const employeesWithStatus = allEmployees.map(employee => ({
      ...employee,
      employee_event_status: statusMap[employee.id] ? [{
        status: statusMap[employee.id],
        event_id: eventId
      }] : []
    }));

    console.log(`✅ Fetched ${employeesWithStatus.length} employees with status for event ${eventId}`);
    
    // Log the status distribution for debugging
    const statusCounts = employeesWithStatus.reduce((acc: any, emp: any) => {
      const status = emp.employee_event_status?.[0]?.status || 'no_status'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})
    console.log('📊 API Status distribution:', statusCounts);
    
    return NextResponse.json({
      success: true,
      data: employeesWithStatus
    });

  } catch (error) {
    console.error('Error in employee status endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      },
      { status: 500 }
    );
  }
}