import { NextRequest, NextResponse } from 'next/server';
import { responseParser } from '@/lib/response-parser';
import { conversationManager } from '@/lib/conversation-manager';
import { employeeRegistrationWorkflow } from '@/lib/employee-registration-workflow';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Parse Twilio webhook data
    const formData = await request.formData();
    const body = Object.fromEntries(formData);

    const {
      MessageSid: messageId,
      From: fromPhone,
      To: toPhone,
      Body: messageBody,
      MessageStatus: status
    } = body as Record<string, string>;

    console.log('SMS Webhook received:', {
      messageId,
      fromPhone,
      toPhone,
      messageBody,
      status
    });

    // Initialize Supabase client
    const supabase = createClient();

    // Log incoming message
    await supabase.from('sms_messages').insert({
      message_id: messageId,
      from_phone: fromPhone,
      to_phone: toPhone,
      message_body: messageBody,
      direction: 'inbound',
      status: status || 'received',
      message_type: 'response'
    });

    // Parse the incoming message
    const parsedResponse = await responseParser.parseResponse(messageBody);
    
    // Handle different response types
    let responseMessage = '';

    switch (parsedResponse.intent) {
      case 'registration':
        if (parsedResponse.registrationCode === 'Emsland100') {
          const result = await employeeRegistrationWorkflow.handleRegistration(
            fromPhone,
            parsedResponse.registrationCode
          );
          responseMessage = result.message;
        } else {
          responseMessage = 'Ungültiger Registrierungscode. Bitte verwenden Sie "Emsland100".';
        }
        break;

      case 'event_response':
        const result = await conversationManager.handleEventResponse(
          fromPhone,
          parsedResponse.response || 'unknown',
          parsedResponse.eventId
        );
        responseMessage = result.message;
        break;

      case 'help':
        responseMessage = `Verfügbare Befehle:
• "Emsland100" - Registrierung als Mitarbeiter
• "Ja" oder "Nein" - Antwort auf Veranstaltungseinladungen
• "Hilfe" - Diese Nachricht anzeigen
• "Status" - Aktueller Registrierungsstatus`;
        break;

      case 'status':
        // Check registration status
        const { data: employee } = await supabase
          .from('employees')
          .select('name, phone')
          .eq('phone', fromPhone)
          .single();

        if (employee) {
          responseMessage = `Hallo ${employee.name}! Sie sind als Mitarbeiter registriert.`;
        } else {
          responseMessage = 'Sie sind noch nicht registriert. Senden Sie "Emsland100" zur Registrierung.';
        }
        break;

      default:
        responseMessage = 'Entschuldigung, ich habe Ihre Nachricht nicht verstanden. Senden Sie "Hilfe" für verfügbare Befehle.';
    }

    // Send response if we have one
    if (responseMessage) {
      const smsService = (await import('@/lib/sms-service')).smsService;
      await smsService.sendSMS(fromPhone, responseMessage, 'response');
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('SMS Webhook Error:', error);
    
    // Still return success to Twilio to avoid retries
    return NextResponse.json({ success: true });
  }
}

// Handle Twilio webhook verification (optional but recommended)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    return new NextResponse(challenge, {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
  
  return NextResponse.json({ status: 'SMS webhook endpoint active' });
}