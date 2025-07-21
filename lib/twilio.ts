// Twilio WhatsApp Integration
import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

// Initialize Twilio client if credentials are available
const client = accountSid && authToken ? twilio(accountSid, authToken) : null

interface WhatsAppMessage {
  to: string
  body: string
  eventId?: string
  employeeId?: string
}

interface WhatsAppResponse {
  success: boolean
  messageSid?: string
  error?: string
}

export async function sendWhatsAppMessage({
  to,
  body,
  eventId,
  employeeId
}: WhatsAppMessage): Promise<WhatsAppResponse> {
  try {
    // Check if we have Twilio credentials
    if (!client || !twilioPhoneNumber) {
      console.log('📱 Simulating WhatsApp message (Twilio not configured):', {
        to,
        body: body.substring(0, 50) + '...',
        eventId,
        employeeId
      })

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Simulate successful response
      const messageSid = `SM${Math.random().toString(36).substring(2, 15)}`

      return {
        success: true,
        messageSid
      }
    }

    // Use real Twilio API
    console.log('📱 Sending WhatsApp message via Twilio:', {
      to: `whatsapp:${to}`,
      body: body.substring(0, 50) + '...',
      eventId,
      employeeId
    })

    const message = await client.messages.create({
      body,
      from: twilioPhoneNumber,
      to: `whatsapp:${to}`
    })

    console.log('✅ WhatsApp message sent successfully:', message.sid)

    return {
      success: true,
      messageSid: message.sid
    }
  } catch (error) {
    console.error('❌ WhatsApp send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export function createEventInvitationMessage(
  employeeName: string,
  eventTitle: string,
  eventDate: string,
  eventTime: string,
  hourlyRate: number
): string {
  return `Hallo ${employeeName}! 👋

Wir haben eine Veranstaltung für dich:

📅 Event: ${eventTitle}
📍 Datum: ${eventDate}
⏰ Zeit: ${eventTime}
💰 Stundenlohn: €${hourlyRate.toFixed(2)}

Kannst du arbeiten? Bitte antworte:
✅ JA - Ich kann arbeiten
❌ NEIN - Ich kann nicht

Vielen Dank! 🙏`
}

export function parseWhatsAppResponse(message: string): 'yes' | 'no' | 'unknown' {
  const normalizedMessage = message.toLowerCase().trim()

  // German responses
  if (normalizedMessage.includes('ja') ||
    normalizedMessage.includes('yes') ||
    normalizedMessage.includes('✅') ||
    normalizedMessage.includes('kann arbeiten')) {
    return 'yes'
  }

  if (normalizedMessage.includes('nein') ||
    normalizedMessage.includes('no') ||
    normalizedMessage.includes('❌') ||
    normalizedMessage.includes('kann nicht')) {
    return 'no'
  }

  return 'unknown'
}

// Helper function to check if Twilio is properly configured
export function isTwilioConfigured(): boolean {
  return !!(accountSid && authToken && twilioPhoneNumber && client)
}

// Helper function to get Twilio configuration status
export function getTwilioStatus(): {
  accountSid: boolean
  authToken: boolean
  phoneNumber: boolean
  client: boolean
  fullyConfigured: boolean
} {
  return {
    accountSid: !!accountSid,
    authToken: !!authToken,
    phoneNumber: !!twilioPhoneNumber,
    client: !!client,
    fullyConfigured: isTwilioConfigured()
  }
}