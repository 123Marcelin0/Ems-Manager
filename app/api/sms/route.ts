import { NextRequest, NextResponse } from 'next/server';
import { smsService } from '@/lib/sms-service';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { to, message, type = 'general' } = await request.json();

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient();

    // Send SMS
    const result = await smsService.sendSMS(to, message, type);

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      status: result.status
    });

  } catch (error) {
    console.error('SMS API Error:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = createClient();

    let query = supabase
      .from('sms_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (phone) {
      query = query.or(`to_phone.eq.${phone},from_phone.eq.${phone}`);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      messages: data
    });

  } catch (error) {
    console.error('SMS History API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SMS history' },
      { status: 500 }
    );
  }
}