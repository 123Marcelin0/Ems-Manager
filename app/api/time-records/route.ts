import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/time-records - Get time records with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const eventId = searchParams.get('eventId');
    const status = searchParams.get('status');

    let query = supabase
      .from('time_records')
      .select(`
        *,
        employees (id, name),
        events (id, title),
        work_areas (id, name)
      `);
    
    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }
    
    if (eventId) {
      query = query.eq('event_id', eventId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching time records:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch time records' },
      { status: 500 }
    );
  }
}

// POST /api/time-records - Create new time record (sign-in)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employee_id, event_id, work_area_id, hourly_rate } = body;

    // Validate required fields
    if (!employee_id || !event_id || !hourly_rate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: employee_id, event_id, hourly_rate' },
        { status: 400 }
      );
    }

    // Check if employee already has an active time record for this event
    const { data: existingRecord, error: checkError } = await supabase
      .from('time_records')
      .select('id')
      .eq('employee_id', employee_id)
      .eq('event_id', event_id)
      .eq('status', 'active')
      .limit(1);

    if (checkError) throw checkError;

    if (existingRecord && existingRecord.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Employee already has an active time record for this event' },
        { status: 400 }
      );
    }

    // Create new time record
    const { data, error } = await supabase
      .from('time_records')
      .insert({
        employee_id,
        event_id,
        work_area_id: work_area_id || null,
        sign_in_time: new Date().toISOString(),
        hourly_rate,
        status: 'active'
      })
      .select(`
        *,
        employees (id, name),
        events (id, title),
        work_areas (id, name)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Employee signed in successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating time record:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create time record' },
      { status: 500 }
    );
  }
} 