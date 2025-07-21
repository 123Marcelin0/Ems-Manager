import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/analytics/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // week, month, year

    // Validate period parameter
    if (!['week', 'month', 'year'].includes(period)) {
      return NextResponse.json(
        { success: false, error: 'Invalid period. Must be: week, month, or year' },
        { status: 400 }
      );
    }

    // Get analytics using our Supabase function
    const { data: analytics, error } = await supabase
      .rpc('get_dashboard_analytics', {
        p_time_period: period
      });

    if (error) throw error;

    // Get additional real-time data
    const { data: recentEvents, error: eventsError } = await supabase
      .from('events')
      .select('id, title, event_date, status')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })
      .limit(5);

    if (eventsError) {
      console.error('Error fetching recent events:', eventsError);
    }

    // Get employee performance summary
    const { data: topEmployees, error: employeesError } = await supabase
      .from('employee_performance_summary')
      .select('id, name, events_completed, total_hours_worked, total_earnings')
      .order('events_completed', { ascending: false })
      .limit(5);

    if (employeesError) {
      console.error('Error fetching top employees:', employeesError);
    }

    // Get events needing attention (those with recruitment issues)
    const { data: eventsNeedingAttention, error: attentionError } = await supabase
      .from('audit_logs')
      .select('new_values, created_at')
      .eq('action', 'NEEDS_MORE_RECRUITMENT')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (attentionError) {
      console.error('Error fetching events needing attention:', attentionError);
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        analytics,
        upcomingEvents: recentEvents || [],
        topEmployees: topEmployees || [],
        eventsNeedingAttention: eventsNeedingAttention?.length || 0,
        period
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard analytics' },
      { status: 500 }
    );
  }
} 