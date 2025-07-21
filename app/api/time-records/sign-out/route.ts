import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/time-records/sign-out - Sign out employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employee_id, event_id, notes } = body;

    // Validate required fields
    if (!employee_id || !event_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: employee_id, event_id' },
        { status: 400 }
      );
    }

    // Use the enhanced sign-out function
    const { data: signOutResult, error } = await supabase
      .rpc('sign_out_employee', {
        p_employee_id: employee_id,
        p_event_id: event_id,
        p_notes: notes || null
      });

    if (error) throw error;

    if (!signOutResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: signOutResult.error || 'Failed to sign out employee' 
        },
        { status: 400 }
      );
    }

    // Get the updated time record with related data
    const { data: timeRecord, error: fetchError } = await supabase
      .from('time_records')
      .select(`
        *,
        employees (id, name),
        events (id, title),
        work_areas (id, name)
      `)
      .eq('employee_id', employee_id)
      .eq('event_id', event_id)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError) {
      console.error('Error fetching updated time record:', fetchError);
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        timeRecord: timeRecord || null,
        summary: {
          total_hours: signOutResult.total_hours,
          total_payment: signOutResult.total_payment,
          sign_in_time: signOutResult.sign_in_time,
          sign_out_time: signOutResult.sign_out_time
        }
      },
      message: 'Employee signed out successfully'
    });
  } catch (error) {
    console.error('Error signing out employee:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to sign out employee' },
      { status: 500 }
    );
  }
} 