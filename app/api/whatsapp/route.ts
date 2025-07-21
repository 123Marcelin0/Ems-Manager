import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsAppMessage } from '@/lib/twilio'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, message, eventId, employeeId } = body

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, message' },
        { status: 400 }
      )
    }

    const result = await sendWhatsAppMessage({
      to,
      body: message,
      eventId,
      employeeId
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('WhatsApp API error:', error)
    return NextResponse.json(
      { error: 'Failed to send WhatsApp message' },
      { status: 500 }
    )
  }
}