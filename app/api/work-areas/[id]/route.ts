import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/work-areas/[id] - Get specific work area
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('🔍 Work Area [id] API: GET request for ID:', params.id);
    
    // Test Supabase connection
    if (!supabase) {
      console.error('❌ Supabase client not initialized');
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('work_areas')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('❌ Work Area [id] API: Supabase error:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Work area not found' },
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      throw error;
    }

    console.log('✅ Work Area [id] API: Found work area:', data?.id);
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error('❌ Work Area [id] API: Unhandled GET error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch work area',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PUT /api/work-areas/[id] - Update work area
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('🔍 Work Area [id] API: PUT request for ID:', params.id);
    
    const body = await request.json();
    console.log('🔍 Work Area [id] API: Update data:', body);

    // Test Supabase connection
    if (!supabase) {
      console.error('❌ Supabase client not initialized');
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('work_areas')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Work Area [id] API: Update error:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Work area not found' },
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      throw error;
    }

    console.log('✅ Work Area [id] API: Updated work area:', data?.id);
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error('❌ Work Area [id] API: Unhandled PUT error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update work area',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE /api/work-areas/[id] - Delete work area
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('🔍 Work Area [id] API: DELETE request for ID:', params.id);

    // Test Supabase connection
    if (!supabase) {
      console.error('❌ Supabase client not initialized');
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabase
      .from('work_areas')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('❌ Work Area [id] API: Delete error:', error);
      throw error;
    }

    console.log('✅ Work Area [id] API: Deleted work area:', params.id);
    return NextResponse.json({ success: true, message: 'Work area deleted successfully' });
    
  } catch (error) {
    console.error('❌ Work Area [id] API: Unhandled DELETE error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete work area',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 