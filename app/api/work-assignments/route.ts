import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId');

    let query = supabaseAdmin
      .from('work_assignments')
      .select(`
        id,
        employee_id,
        work_area_id,
        event_id,
        assigned_at,
        employee:employees(id, name, role, phone_number),
        work_area:work_areas(id, name, location)
      `);
    
    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query.order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching work assignments:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error in work assignments GET:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { employee_id, work_area_id, event_id, action } = await request.json();

    if (!employee_id || !event_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Employee ID and Event ID are required' 
      }, { status: 400 });
    }

    if (action === 'remove') {
      // Remove assignment
      const { error } = await supabaseAdmin
        .from('work_assignments')
        .delete()
        .eq('employee_id', employee_id)
        .eq('event_id', event_id);

      if (error) {
        console.error('Error removing work assignment:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Assignment removed successfully'
      });
    } else {
      // Create or update assignment
      if (!work_area_id) {
        return NextResponse.json({ 
          success: false, 
          error: 'Work Area ID is required for assignment' 
        }, { status: 400 });
      }

      // Check if assignment already exists
      const { data: existingAssignment } = await supabaseAdmin
        .from('work_assignments')
        .select('id')
        .eq('employee_id', employee_id)
        .eq('event_id', event_id)
        .single();

      if (existingAssignment) {
        // Update existing assignment
        const { data, error } = await supabaseAdmin
          .from('work_assignments')
          .update({
            work_area_id: work_area_id,
            assigned_at: new Date().toISOString()
          })
          .eq('id', existingAssignment.id)
          .select(`
            id,
            employee_id,
            work_area_id,
            event_id,
            assigned_at,
            employee:employees(id, name, role, phone_number),
            work_area:work_areas(id, name, location)
          `)
          .single();

        if (error) {
          console.error('Error updating work assignment:', error);
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          data,
          message: 'Assignment updated successfully'
        });
      } else {
        // Create new assignment
        const { data, error } = await supabaseAdmin
          .from('work_assignments')
          .insert({
            employee_id,
            work_area_id,
            event_id
          })
          .select(`
            id,
            employee_id,
            work_area_id,
            event_id,
            assigned_at,
            employee:employees(id, name, role, phone_number),
            work_area:work_areas(id, name, location)
          `)
          .single();

        if (error) {
          console.error('Error creating work assignment:', error);
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          data,
          message: 'Assignment created successfully'
        });
      }
    }
  } catch (error) {
    console.error('Error in work assignments POST:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

// Auto-assign employees to work areas
export async function PUT(request: Request) {
  try {
    const { event_id } = await request.json();

    if (!event_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event ID is required' 
      }, { status: 400 });
    }

    // Get employees that are available or selected for this event
    const { data: selectedEmployees, error: employeesError } = await supabaseAdmin
      .from('employee_event_status')
      .select(`
        employee_id,
        employee:employees(id, name, role, employment_type, is_always_needed)
      `)
      .eq('event_id', event_id)
      .in('status', ['selected', 'available']);

    if (employeesError) {
      console.error('Error fetching selected employees:', employeesError);
      return NextResponse.json({ success: false, error: employeesError.message }, { status: 500 });
    }

    if (!selectedEmployees || selectedEmployees.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No selected employees found for this event'
      });
    }

    // Get work areas for this event
    const { data: workAreas, error: workAreasError } = await supabaseAdmin
      .from('work_areas')
      .select(`
        id, name, location, max_capacity, role_requirements
      `)
      .eq('event_id', event_id)
      .eq('is_active', true);

    if (workAreasError) {
      console.error('Error fetching work areas:', workAreasError);
      return NextResponse.json({ success: false, error: workAreasError.message }, { status: 500 });
    }

    if (!workAreas || workAreas.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No available work areas for this event'
      });
    }

    // Clear existing assignments for this event
    await supabaseAdmin
      .from('work_assignments')
      .delete()
      .eq('event_id', event_id);

    // Auto-assignment algorithm
    const assignments = [];
    const employeePool = [...selectedEmployees];

    for (const workArea of workAreas) {
      let assignedToThisArea = 0; // Reset for each work area
      
      // Assign employees based on role requirements
      const roleRequirements = workArea.role_requirements || {};
      
      for (const [role, requiredCount] of Object.entries(roleRequirements)) {
        if (typeof requiredCount !== 'number' || requiredCount <= 0) continue;

        // Find employees with matching role that are still available
        const matchingEmployees = employeePool.filter(emp => 
          emp.employee?.role === role
        );

        const toAssign = Math.min(requiredCount, matchingEmployees.length, workArea.max_capacity - assignedToThisArea);

        for (let i = 0; i < toAssign; i++) {
          const employee = matchingEmployees[i];
          
          assignments.push({
            employee_id: employee.employee_id,
            work_area_id: workArea.id,
            event_id: event_id
          });

          // Remove from pool to avoid double assignment
          const poolIndex = employeePool.findIndex(emp => emp.employee_id === employee.employee_id);
          if (poolIndex > -1) {
            employeePool.splice(poolIndex, 1);
          }

          assignedToThisArea++;
        }
      }

      // Fill remaining capacity with any available employees
      while (assignedToThisArea < workArea.max_capacity && employeePool.length > 0) {
        const employee = employeePool.shift();
        
        assignments.push({
          employee_id: employee.employee_id,
          work_area_id: workArea.id,
          event_id: event_id
        });

        assignedToThisArea++;
      }
    }

    // Insert all assignments
    if (assignments.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('work_assignments')
        .insert(assignments)
        .select(`
          id,
          employee_id,
          work_area_id,
          event_id,
          assigned_at,
          employee:employees(id, name, role, phone_number),
          work_area:work_areas(id, name, location)
        `);

      if (error) {
        console.error('Error creating assignments:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: data || [],
        message: `Successfully assigned ${assignments.length} employees to work areas`
      });
    }

    return NextResponse.json({
      success: true,
      data: [],
      message: 'No assignments created'
    });
  } catch (error) {
    console.error('Error in work assignments auto-assign:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}