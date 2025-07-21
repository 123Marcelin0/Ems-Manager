import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Parse the form data from Twilio
    const formData = await request.formData();
    
    // Extract the key fields
    const from = formData.get('From') as string;
    const body = formData.get('Body') as string;
    const messageSid = formData.get('MessageSid') as string;
    
    // Log the incoming message for debugging
    console.log('📱 **INCOMING WEBHOOK**');
    console.log('From:', from);
    console.log('Body:', body);
    console.log('MessageSid:', messageSid);
    console.log('Timestamp:', new Date().toISOString());
    console.log('---');
    
    // Process WhatsApp response using our new Supabase function
    const { data: processResult, error: processError } = await supabase
      .rpc('process_whatsapp_response', {
        p_phone_number: from,
        p_message_body: body,
        p_message_sid: messageSid
      });

    if (processError) {
      console.error('❌ Error processing WhatsApp response:', processError);
      
      // Return generic response on error
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thank you for your message. We'll get back to you soon!</Message>
</Response>`,
        {
          headers: {
            'Content-Type': 'application/xml',
          },
        }
      );
    }

    // Handle the processing result
    if (processResult.success) {
      console.log('✅ WhatsApp response processed successfully:', {
        employee: processResult.employee_name,
        response: processResult.response_type,
        eventsUpdated: processResult.events_updated
      });

      // Generate appropriate response based on employee's answer
      let responseMessage = '';
      const employeeName = processResult.employee_name;
      
      if (processResult.response_type === 'available') {
        responseMessage = `Danke ${employeeName}! ✅ Wir haben deine Zusage registriert. Du wirst weitere Details zum Arbeitseinsatz erhalten.`;
      } else if (processResult.response_type === 'unavailable') {
        responseMessage = `Danke ${employeeName}! ❌ Wir haben deine Absage registriert. Kein Problem - beim nächsten Event fragen wir wieder!`;
      } else {
        responseMessage = `Hallo ${employeeName}! Bitte antworte mit "JA" wenn du arbeiten kannst oder "NEIN" wenn du nicht kannst.`;
      }

      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${responseMessage}</Message>
</Response>`,
        {
          headers: {
            'Content-Type': 'application/xml',
          },
        }
      );
    } else {
      console.log('⚠️ Could not process response:', processResult.error);
      
      // Check if it's an unknown employee
      if (processResult.error === 'Employee not found') {
        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Diese Nummer ist nicht in unserem System registriert. Bitte wende dich an deinen Manager.</Message>
</Response>`,
          {
            headers: {
              'Content-Type': 'application/xml',
            },
          }
        );
      }
      
      // For unclear responses, ask for clarification
      const employeeName = processResult.employee_name || 'there';
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Hallo! Ich habe deine Antwort nicht verstanden. Bitte antworte mit "JA" oder "NEIN" für die Arbeitsanfrage.</Message>
</Response>`,
        {
          headers: {
            'Content-Type': 'application/xml',
          },
        }
      );
    }
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Entschuldigung, es gab einen Fehler bei der Verarbeitung deiner Nachricht. Bitte versuche es später erneut.</Message>
</Response>`,
      {
        status: 500,
        headers: {
          'Content-Type': 'application/xml',
        },
      }
    );
  }
}

// Handle GET requests (for webhook verification)
export async function GET(request: NextRequest) {
  return new NextResponse('Webhook endpoint is working! 🎉', {
    status: 200,
  });
} 