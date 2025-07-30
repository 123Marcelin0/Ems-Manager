// SMS Service for Twilio Integration
import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'
import { 
  SMSErrorHandler, 
  SMSRetryHandler, 
  smsCircuitBreaker,
  SMSErrorType 
} from './sms-error-handler'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

// Initialize Twilio client if credentials are available
const client = accountSid && authToken ? twilio(accountSid, authToken) : null

// Types and Interfaces
export interface SMSMessage {
  to: string
  body: string
  eventId?: string
  employeeId?: string
  conversationId?: string
  messageType?: string
}

export interface SMSResponse {
  success: boolean
  messageSid?: string
  error?: string
  deliveryStatus?: string
}

export interface NotificationResult {
  employeeId: string
  employeeName: string
  phoneNumber: string
  success: boolean
  messageSid?: string
  error?: string
}

export interface IncomingMessageParams {
  from: string
  body: string
  messageSid: string
  messageStatus?: string
}

export interface ProcessingResult {
  success: boolean
  conversationId?: string
  responseMessage?: string
  error?: string
}

// Core SMS Service Class
export class SMSService {
  private client: twilio.Twilio | null
  private phoneNumber: string | undefined

  constructor() {
    this.client = client
    this.phoneNumber = twilioPhoneNumber
  }

  // Create Supabase client for server-side operations
  private createSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, supabaseKey)
  }

  // Check if SMS service is properly configured
  isConfigured(): boolean {
    return !!(this.client && this.phoneNumber)
  }

  // Get configuration status
  getStatus() {
    return {
      accountSid: !!accountSid,
      authToken: !!authToken,
      phoneNumber: !!this.phoneNumber,
      client: !!this.client,
      fullyConfigured: this.isConfigured()
    }
  }

  // Send SMS message
  async sendMessage({
    to,
    body,
    eventId,
    employeeId,
    conversationId,
    messageType = 'general'
  }: SMSMessage): Promise<SMSResponse> {
    return smsCircuitBreaker.execute(async () => {
      return SMSRetryHandler.withRetry(async () => {
        try {
          // Validate inputs
          if (!to || !body) {
            throw SMSErrorHandler.handleValidationError('Phone number and message body are required')
          }

          // Normalize phone number
          const normalizedPhone = this.normalizePhoneNumber(to)
          
          // Check if we have Twilio credentials
          if (!this.client || !this.phoneNumber) {
        console.log('📱 Simulating SMS message (Twilio not configured):', {
          to: normalizedPhone,
          body: body.substring(0, 50) + '...',
          eventId,
          employeeId,
          conversationId,
          messageType
        })

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Generate fake message SID
        const messageSid = `SM${Math.random().toString(36).substring(2, 15)}`

        // Log to database
        await this.logMessage({
          phoneNumber: normalizedPhone,
          messageBody: body,
          direction: 'outbound',
          employeeId,
          eventId,
          conversationId,
          messageSid,
          messageType,
          deliveryStatus: 'sent'
        })

        return {
          success: true,
          messageSid,
          deliveryStatus: 'sent'
        }
      }

      // Send real SMS via Twilio
      console.log('📱 Sending SMS via Twilio:', {
        to: normalizedPhone,
        body: body.substring(0, 50) + '...',
        eventId,
        employeeId,
        conversationId,
        messageType
      })

      const message = await this.client.messages.create({
        body,
        from: this.phoneNumber,
        to: normalizedPhone
      })

      console.log('✅ SMS sent successfully:', message.sid)

      // Log to database
      await this.logMessage({
        phoneNumber: normalizedPhone,
        messageBody: body,
        direction: 'outbound',
        employeeId,
        eventId,
        conversationId,
        messageSid: message.sid,
        messageType,
        deliveryStatus: message.status
      })

      return {
        success: true,
        messageSid: message.sid,
        deliveryStatus: message.status
      }
        } catch (error) {
          const smsError = SMSErrorHandler.classifyError(error)
          console.error('❌ SMS send error:', smsError)
          
          // Log error to database
          await this.logMessage({
            phoneNumber: to,
            messageBody: body,
            direction: 'outbound',
            employeeId,
            eventId,
            conversationId,
            messageType,
            deliveryStatus: 'failed'
          })

          throw smsError
        }
      })
    })
  }

  // Send event notifications to multiple employees
  async sendEventNotifications(
    eventId: string, 
    employeeIds: string[]
  ): Promise<NotificationResult[]> {
    try {
      // Get event details
      const { data: event, error: eventError } = await this.createSupabaseClient()
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (eventError) throw eventError

      // Get employee details
      const { data: employees, error: employeesError } = await this.createSupabaseClient()
        .from('employees')
        .select('*')
        .in('id', employeeIds)
        .eq('sms_enabled', true)

      if (employeesError) throw employeesError

      const results: NotificationResult[] = []

      // Send messages to each employee
      for (const employee of employees) {
        try {
          // Get or create conversation
          const { data: conversationId } = await this.createSupabaseClient()
            .rpc('get_or_create_sms_conversation', {
              p_phone_number: employee.phone_number,
              p_employee_id: employee.id
            })

          // Create event notification message
          const messageBody = this.createEventNotificationMessage(
            employee.name,
            event.title,
            new Date(event.event_date).toLocaleDateString('de-DE'),
            event.start_time,
            event.hourly_rate,
            event.location
          )

          // Send SMS
          const response = await this.sendMessage({
            to: employee.phone_number,
            body: messageBody,
            eventId: event.id,
            employeeId: employee.id,
            conversationId,
            messageType: 'event_notification'
          })

          if (response.success) {
            // Update employee status to 'asked'
            await this.createSupabaseClient().rpc('update_employee_event_status', {
              p_employee_id: employee.id,
              p_event_id: event.id,
              p_new_status: 'asked',
              p_response_method: 'sms'
            })

            // Update conversation state
            await this.createSupabaseClient().rpc('update_conversation_state', {
              p_conversation_id: conversationId,
              p_new_state: 'event_notification_sent',
              p_context_data: { eventId: event.id, notificationSent: true },
              p_event_id: event.id
            })

            results.push({
              employeeId: employee.id,
              employeeName: employee.name,
              phoneNumber: employee.phone_number,
              success: true,
              messageSid: response.messageSid
            })
          } else {
            results.push({
              employeeId: employee.id,
              employeeName: employee.name,
              phoneNumber: employee.phone_number,
              success: false,
              error: response.error
            })
          }
        } catch (err) {
          results.push({
            employeeId: employee.id,
            employeeName: employee.name,
            phoneNumber: employee.phone_number,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
          })
        }
      }

      return results
    } catch (error) {
      throw new Error(`Failed to send event notifications: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Send registration prompt
  async sendRegistrationPrompt(phoneNumber: string): Promise<SMSResponse> {
    const message = `Hallo! 👋

Willkommen bei unserem Event-Team! 

Um dich zu registrieren, sende uns bitte deinen vollständigen Namen.

Beispiel: "Max Mustermann"

Vielen Dank! 🙏`

    return this.sendMessage({
      to: phoneNumber,
      body: message,
      messageType: 'registration_prompt'
    })
  }

  // Send confirmation message
  async sendConfirmationMessage(
    phoneNumber: string, 
    message: string, 
    messageType: string = 'confirmation'
  ): Promise<SMSResponse> {
    return this.sendMessage({
      to: phoneNumber,
      body: message,
      messageType
    })
  }

  // Process incoming SMS message
  async processIncomingMessage({
    from,
    body,
    messageSid,
    messageStatus
  }: IncomingMessageParams): Promise<ProcessingResult> {
    try {
      const normalizedPhone = this.normalizePhoneNumber(from)

      // Get or create conversation
      const { data: conversationId } = await this.createSupabaseClient()
        .rpc('get_or_create_sms_conversation', {
          p_phone_number: normalizedPhone
        })

      // Log incoming message
      await this.logMessage({
        phoneNumber: normalizedPhone,
        messageBody: body,
        direction: 'inbound',
        messageSid,
        conversationId,
        deliveryStatus: messageStatus || 'received'
      })

      // Get conversation details
      const { data: conversation } = await this.createSupabaseClient()
        .from('sms_conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (!conversation) {
        throw new Error('Conversation not found')
      }

      // Process message based on conversation state
      // This will be expanded in the conversation manager
      return {
        success: true,
        conversationId,
        responseMessage: 'Message received and will be processed'
      }
    } catch (error) {
      console.error('❌ Error processing incoming message:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Log SMS message to database
  private async logMessage({
    phoneNumber,
    messageBody,
    direction,
    employeeId,
    eventId,
    conversationId,
    messageSid,
    messageType = 'general',
    deliveryStatus
  }: {
    phoneNumber: string
    messageBody: string
    direction: 'inbound' | 'outbound'
    employeeId?: string
    eventId?: string
    conversationId?: string
    messageSid?: string
    messageType?: string
    deliveryStatus?: string
  }): Promise<string | null> {
    try {
      const { data, error } = await this.createSupabaseClient()
        .rpc('log_sms_message', {
          p_phone_number: phoneNumber,
          p_message_body: messageBody,
          p_direction: direction,
          p_employee_id: employeeId || null,
          p_event_id: eventId || null,
          p_conversation_id: conversationId || null,
          p_message_sid: messageSid || null,
          p_message_type: messageType
        })

      if (error) {
        console.error('❌ Error logging SMS message:', error)
        return null
      }

      // Update delivery status if provided
      if (deliveryStatus && data) {
        await this.createSupabaseClient()
          .from('sms_messages')
          .update({ delivery_status: deliveryStatus })
          .eq('id', data)
      }

      return data
    } catch (error) {
      console.error('❌ Error logging SMS message:', error)
      return null
    }
  }

  // Create event notification message
  private createEventNotificationMessage(
    employeeName: string,
    eventTitle: string,
    eventDate: string,
    eventTime: string,
    hourlyRate: number,
    location: string
  ): string {
    return `Hallo ${employeeName}! 👋

Wir haben eine Veranstaltung für dich:

📅 Event: ${eventTitle}
📍 Datum: ${eventDate}
⏰ Zeit: ${eventTime}
🏢 Ort: ${location}
💰 Stundenlohn: €${hourlyRate.toFixed(2)}

Kannst du arbeiten? Bitte antworte:
1️⃣ JA - Ich kann arbeiten
2️⃣ NEIN - Ich kann nicht
3️⃣ RÜCKFRAGE - Ich habe eine Frage

Vielen Dank! 🙏`
  }

  // Normalize phone number to international format
  private normalizePhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters except +
    let normalized = phoneNumber.replace(/[^\d+]/g, '')
    
    // If it starts with 0, replace with +49 (German country code)
    if (normalized.startsWith('0')) {
      normalized = '+49' + normalized.substring(1)
    }
    
    // If it doesn't start with +, assume German number
    if (!normalized.startsWith('+')) {
      normalized = '+49' + normalized
    }
    
    return normalized
  }
}

// Export singleton instance
export const smsService = new SMSService()

// Export helper functions for backward compatibility
export function isTwilioConfigured(): boolean {
  return smsService.isConfigured()
}

export function getTwilioStatus() {
  return smsService.getStatus()
}

// Export types
export type { SMSMessage, SMSResponse, NotificationResult, IncomingMessageParams, ProcessingResult }