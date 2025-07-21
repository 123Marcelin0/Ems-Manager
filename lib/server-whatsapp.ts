// Server-side WhatsApp service that can be used in API routes
import { sendWhatsAppMessage } from './twilio'

export async function sendWhatsAppMessageServer({
  to,
  message,
  eventId,
  employeeId
}: {
  to: string
  message: string
  eventId?: string
  employeeId?: string
}) {
  return await sendWhatsAppMessage({
    to,
    body: message,
    eventId,
    employeeId
  })
}