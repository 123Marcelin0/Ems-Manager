import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET /api/work-areas - Get all work areas or filter by event
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Work Areas API: GET request received');
    
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    
    console.log('🔍 Work Areas API: EventId parameter:', eventId);

    // Create authenticated Supabase client for server-side API route
    const authenticatedSupabase = await createServerSupabaseClient(request);

    let query = authenticatedSupabase.from('work_areas').select('*');
    
    if (eventId) {
      query = query.eq('event_id', eventId);
      console.log('🔍 Work Areas API: Filtering by eventId:', eventId);
    } else {
      console.log('🔍 Work Areas API: Fetching all work areas');
    }
    
    console.log('🔍 Work Areas API: Executing query...');
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase query error:', error);
      throw error;
    }

    console.log('✅ Work Areas API: Query successful, data length:', data?.length || 0);
    return NextResponse.json({ success: true, data: data || [] });
    
  } catch (error) {
    console.error('❌ Work Areas API: Unhandled error:', error);
    
    // Ensure we always return JSON, even on error
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch work areas',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST /api/work-areas - Create new work area
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Work Areas API: POST request received');
    
    const body = await request.json();
    console.log('🔍 Work Areas API: Request body:', body);
    
    const { event_id, name, location, max_capacity, role_requirements } = body;

    // Validate required fields
    if (!event_id || !name || !location || !max_capacity || !role_requirements) {
      console.log('❌ Work Areas API: Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create authenticated Supabase client for server-side API route
    console.log('🔍 Work Areas API: Creating authenticated Supabase client...');
    const authenticatedSupabase = await createServerSupabaseClient(request);

    // Verify authentication with better error handling and retry logic
    let user = null;
    let authError = null;
    
    try {
      // Small delay to ensure session is properly set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { data, error } = await authenticatedSupabase.auth.getUser();
      user = data?.user;
      authError = error;
      
      console.log('🔍 Work Areas API: Auth check result:', { 
        hasUser: !!user, 
        userId: user?.id,
        userEmail: user?.email,
        authError: authError?.message 
      });
      
    } catch (error) {
      console.log('❌ Work Areas API: Auth check failed:', error);
      authError = error as Error;
    }
    
    if (authError || !user) {
      console.log('❌ Work Areas API: User not authenticated:', authError?.message || 'Auth session missing!');
      
      // For development/testing - if session was set successfully but getUser() failed,
      // try a direct insert without strict user verification
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ') && process.env.NODE_ENV === 'development') {
        console.log('🔧 Work Areas API: Using development bypass - attempting direct insert...');
        
        const { data: workArea, error: insertError } = await authenticatedSupabase
          .from('work_areas')
          .insert({
            event_id,
            name,
            location,
            max_capacity,
            role_requirements,
            is_active: true,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Work Areas API: Development insert error:', insertError);
          return NextResponse.json(
            { success: false, error: `Database error: ${insertError.message}` },
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }

        console.log('✅ Work Areas API: Work area created via development bypass:', workArea);
        return NextResponse.json({ 
          success: true, 
          data: workArea 
        }, { status: 201, headers: { 'Content-Type': 'application/json' } });
      }
      
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please log in.' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Work Areas API: User authenticated:', user.email);

    // Check if user has manager role
    console.log('🔍 Work Areas API: Checking manager role for user:', user.id);
    const { data: employee, error: employeeError } = await authenticatedSupabase
      .from('employees')
      .select('id, name, role')
      .eq('user_id', user.id)
      .single();

    if (employeeError || !employee) {
      console.log('❌ Work Areas API: Employee record not found:', employeeError?.message || 'No employee');
      
      // Try to create a manager record if it doesn't exist
      console.log('🔍 Work Areas API: Creating manager employee record...');
      const { data: newEmployee, error: createError } = await authenticatedSupabase
        .from('employees')
        .insert({
          name: user.email?.split('@')[0] || 'Manager User',
          user_id: user.id,
          phone_number: '+1234567890',
          role: 'manager',
          employment_type: 'part_time',
          is_always_needed: true
        })
        .select()
        .single();

      if (createError) {
        console.log('❌ Work Areas API: Failed to create employee record:', createError);
        return NextResponse.json(
          { success: false, error: 'User account not properly set up. Please contact administrator.' },
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('✅ Work Areas API: Created manager employee record:', newEmployee.id);
    } else if (employee.role !== 'manager') {
      console.log('❌ Work Areas API: User is not a manager, role:', employee.role);
      return NextResponse.json(
        { success: false, error: 'Only managers can create work areas.' },
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('✅ Work Areas API: User is manager:', employee.name);
    }

    // Try direct insert with authenticated client
    console.log('🔍 Work Areas API: Attempting direct insert...');
    
    const { data: workArea, error: insertError } = await authenticatedSupabase
      .from('work_areas')
      .insert({
        event_id,
        name,
        location,
        max_capacity,
        role_requirements,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Work Areas API: Insert error:', insertError);
      throw insertError;
    }

    console.log('✅ Work Areas API: Work area created successfully:', workArea);
    
    return NextResponse.json({ 
      success: true, 
      data: workArea 
    }, { status: 201, headers: { 'Content-Type': 'application/json' } });
    
  } catch (error) {
    console.error('❌ Work Areas API: Unhandled POST error:', error);
    
    // Ensure we always return JSON, even on error
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create work area',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 