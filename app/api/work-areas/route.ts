import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Helper function to get authenticated supabase client
async function getAuthenticatedClient(request: Request) {
  const authHeader = request.headers.get('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    // Create a client with the user's token
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    );
    
    // Verify the token is valid
    const { data: { user }, error } = await userClient.auth.getUser(token);
    
    if (error || !user) {
      return { client: null, user: null, error: 'Authentication required. Please log in.' };
    }
    
    return { client: userClient, user, error: null };
  }
  
  return { client: null, user: null, error: 'Authentication required. Please log in.' };
}

export async function GET(request: Request) {
  try {
    const { client, user, error: authError } = await getAuthenticatedClient(request);
    
    if (authError || !client || !user) {
      return NextResponse.json({ 
        success: false, 
        error: authError || 'Authentication required. Please log in.' 
      }, { status: 401 });
    }

    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId');

    let query = client.from('work_areas').select('*');
    
    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching work areas:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error in work areas GET:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { client, user, error: authError } = await getAuthenticatedClient(request);
    
    if (authError || !client || !user) {
      return NextResponse.json({ 
        success: false, 
        error: authError || 'Authentication required. Please log in.' 
      }, { status: 401 });
    }

    const workAreaData = await request.json();

    // Use the authenticated client
    const { data, error } = await client
      .from('work_areas')
      .insert([workAreaData])
      .select()
      .single();

    if (error) {
      console.error('Error creating work area:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in work areas POST:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}