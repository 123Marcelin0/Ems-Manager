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
    const { event_id, employee_ids } = await request.json();

    if (!event_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event ID is required' 
      }, { status: 400 });
    }

    let selectedEmployees;
    let employeesError;

    if (employee_ids && employee_ids.length > 0) {
      // Use specific employee IDs provided from frontend (sidebar employees)
      console.log(`Using specific employee IDs for assignment: ${employee_ids.join(', ')}`);
      
      const { data, error } = await supabaseAdmin
        .from('employees')
        .select('id, name, role, employment_type, is_always_needed')
        .in('id', employee_ids);
      
      selectedEmployees = data?.map(emp => ({
        employee_id: emp.id,
        employee: emp
      })) || [];
      employeesError = error;
    } else {
      // Fallback: Get employees that are available for this event
      // Only use employees with "available" status (as shown in Übersicht sidebar)
      const { data, error } = await supabaseAdmin
        .from('employee_event_status')
        .select(`
          employee_id,
          employee:employees(id, name, role, employment_type, is_always_needed)
        `)
        .eq('event_id', event_id)
        .eq('status', 'available'); // Only available employees
      
      selectedEmployees = data;
      employeesError = error;
    }

    if (employeesError) {
      console.error('Error fetching selected employees:', employeesError);
      return NextResponse.json({ success: false, error: employeesError.message }, { status: 500 });
    }

    if (!selectedEmployees || selectedEmployees.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No employees available for assignment. Please ensure employees are marked as available in Mitteilungen and visible in the sidebar.'
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

    // Define role hierarchy - what roles each employee type can perform
    const roleHierarchy = {
      manager: ['manager', 'allrounder', 'versorger', 'verkauf', 'essen'],
      allrounder: ['allrounder', 'versorger', 'verkauf', 'essen'],
      versorger: ['versorger', 'verkauf', 'essen'],
      verkauf: ['verkauf', 'essen'],
      essen: ['essen']
    };

    // Smart role-based assignment algorithm
    const assignments = [];
    const employeePool = [...selectedEmployees];
    
    console.log(`🎯 Starting smart role-based auto-assignment for ${workAreas.length} work areas`);
    console.log(`👥 Available employees:`, employeePool.map(emp => ({ 
      id: emp.employee_id, 
      name: emp.employee?.name, 
      role: emp.employee?.role 
    })));

    // PHASE 1: Exact role matching (highest priority)
    console.log(`\n🎯 PHASE 1: Exact role matching`);
    
    for (const workArea of workAreas) {
      const roleRequirements = workArea.role_requirements || {};
      let assignedToThisArea = 0;
      
      console.log(`\n🏢 Processing work area: ${workArea.name}`);
      console.log(`📋 Role requirements:`, roleRequirements);
      
      for (const [requiredRole, requiredCount] of Object.entries(roleRequirements)) {
        if (typeof requiredCount !== 'number' || requiredCount <= 0) continue;
        
        console.log(`\n🎯 Looking for ${requiredCount} employees with EXACT role: ${requiredRole}`);
        
        // Find employees with exact matching role
        const exactMatches = employeePool.filter(emp => 
          emp.employee?.role?.toLowerCase() === requiredRole.toLowerCase()
        );
        
        console.log(`✅ Found ${exactMatches.length} exact matches:`, 
          exactMatches.map(emp => ({ name: emp.employee?.name, role: emp.employee?.role })));
        
        const toAssignExact = Math.min(requiredCount, exactMatches.length, workArea.max_capacity - assignedToThisArea);
        
        for (let i = 0; i < toAssignExact; i++) {
          const employee = exactMatches[i];
          
          assignments.push({
            employee_id: employee.employee_id,
            work_area_id: workArea.id,
            event_id: event_id
          });
          
          console.log(`✅ EXACT MATCH: Assigned ${employee.employee?.name} (${employee.employee?.role}) to ${workArea.name} for ${requiredRole}`);
          
          // Remove from pool
          const poolIndex = employeePool.findIndex(emp => emp.employee_id === employee.employee_id);
          if (poolIndex > -1) {
            employeePool.splice(poolIndex, 1);
          }
          
          assignedToThisArea++;
        }
      }
      
      // Store assignment count for this work area
      workArea._assignedCount = assignedToThisArea;
    }

    // PHASE 2: Role hierarchy matching (for unfilled positions)
    console.log(`\n🎯 PHASE 2: Role hierarchy matching for unfilled positions`);
    
    for (const workArea of workAreas) {
      const roleRequirements = workArea.role_requirements || {};
      let assignedToThisArea = workArea._assignedCount || 0;
      
      if (assignedToThisArea >= workArea.max_capacity) continue;
      
      console.log(`\n🏢 Filling remaining spots in: ${workArea.name} (${assignedToThisArea}/${workArea.max_capacity})`);
      
      for (const [requiredRole, requiredCount] of Object.entries(roleRequirements)) {
        if (typeof requiredCount !== 'number' || requiredCount <= 0) continue;
        
        // Count how many of this role we already assigned
        const alreadyAssignedForRole = assignments.filter(a => 
          a.work_area_id === workArea.id
        ).length; // This is a simplification - in reality we'd need to track per role
        
        const stillNeeded = Math.max(0, requiredCount - Math.floor(alreadyAssignedForRole * (requiredCount / Object.values(roleRequirements).reduce((a, b) => (a as number) + (b as number), 0))));
        
        if (stillNeeded <= 0) continue;
        
        console.log(`\n🔄 Still need ${stillNeeded} employees for role: ${requiredRole}`);
        
        // Find employees who CAN perform this role (using hierarchy)
        const capableEmployees = employeePool.filter(emp => {
          const empRole = emp.employee?.role?.toLowerCase();
          const canPerformRoles = roleHierarchy[empRole as keyof typeof roleHierarchy] || [];
          return canPerformRoles.includes(requiredRole.toLowerCase());
        });
        
        console.log(`🔍 Found ${capableEmployees.length} employees who can perform ${requiredRole}:`, 
          capableEmployees.map(emp => ({ name: emp.employee?.name, role: emp.employee?.role })));
        
        const toAssignHierarchy = Math.min(stillNeeded, capableEmployees.length, workArea.max_capacity - assignedToThisArea);
        
        for (let i = 0; i < toAssignHierarchy; i++) {
          const employee = capableEmployees[i];
          
          assignments.push({
            employee_id: employee.employee_id,
            work_area_id: workArea.id,
            event_id: event_id
          });
          
          console.log(`🔄 HIERARCHY MATCH: Assigned ${employee.employee?.name} (${employee.employee?.role}) to ${workArea.name} for ${requiredRole}`);
          
          // Remove from pool
          const poolIndex = employeePool.findIndex(emp => emp.employee_id === employee.employee_id);
          if (poolIndex > -1) {
            employeePool.splice(poolIndex, 1);
          }
          
          assignedToThisArea++;
        }
      }
    }

    console.log(`\n🎉 Smart assignment complete! Total assignments: ${assignments.length}`);
    console.log(`👥 Remaining unassigned employees: ${employeePool.length}`);

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