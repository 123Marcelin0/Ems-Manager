import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET work areas with full assignment details
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId');

    // Get work areas with manual assignment details join
    let workAreasQuery = supabaseAdmin
      .from('work_areas')
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
    
    if (eventId) {
      workAreasQuery = workAreasQuery.eq('event_id', eventId);
    }

    const { data: workAreas, error: workAreasError } = await workAreasQuery
      .eq('is_active', true)
      .order('position_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (workAreasError) {
      console.error('Error fetching work areas:', workAreasError);
      return NextResponse.json({ success: false, error: workAreasError.message }, { status: 500 });
    }

    // Manually fetch assignments for each work area
    if (workAreas && workAreas.length > 0) {
      const workAreaIds = workAreas.map(area => area.id);
      
      const { data: assignments, error: assignmentsError } = await supabaseAdmin
        .from('work_assignments')
        .select(`
          id,
          employee_id,
          work_area_id,
          event_id,
          assigned_role,
          assigned_at,
          status,
          employee:employees(id, name, role)
        `)
        .in('work_area_id', workAreaIds);
      
      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        // Continue without assignments rather than failing
      } else if (assignments) {
        // Group assignments by work area
        const assignmentsByWorkArea = assignments.reduce((acc, assignment) => {
          const workAreaId = assignment.work_area_id;
          if (!acc[workAreaId]) {
            acc[workAreaId] = [];
          }
          acc[workAreaId].push({
            id: assignment.id,
            employee_id: assignment.employee_id,
            employee_name: assignment.employee?.name || 'Unknown',
            employee_role: assignment.employee?.role || 'unknown',
            assigned_role: assignment.assigned_role,
            assigned_at: assignment.assigned_at,
            status: assignment.status || 'assigned'
          });
          return acc;
        }, {});
        
        // Add assignments to work areas
        workAreas.forEach(area => {
          area.assignments = assignmentsByWorkArea[area.id] || [];
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: workAreas || []
    });
  } catch (error) {
    console.error('Error in detailed work areas GET:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}