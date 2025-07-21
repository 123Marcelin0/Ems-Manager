import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { createEventInvitationMessage } from '@/lib/twilio'

interface Employee {
  id: string
  name: string
  phone_number: string
  user_id: string
}

interface Event {
  id: string
  title: string
  event_date: string
  start_time: string
  hourly_rate: number
}

interface WhatsAppInvitation {
  eventId: string
  employeeIds: string[]
}

export function useWhatsApp() {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Send WhatsApp invitations to selected employees
  const sendEventInvitations = async ({ eventId, employeeIds }: WhatsAppInvitation) => {
    try {
      setSending(true)
      setError(null)

      // Get event details
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (eventError) throw eventError

      // Get employee details
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .in('id', employeeIds)

      if (employeesError) throw employeesError

      const results = []

      // Send messages to each employee
      for (const employee of employees) {
        try {
          // Create personalized message
          const messageBody = createEventInvitationMessage(
            employee.name,
            event.title,
            new Date(event.event_date).toLocaleDateString('de-DE'),
            event.start_time,
            event.hourly_rate
          )

          // Send WhatsApp message via API
          const response = await fetch('/api/whatsapp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: employee.phone_number,
              message: messageBody,
              eventId: event.id,
              employeeId: employee.id
            })
          })

          const result = await response.json()

          if (result.success) {
            // Update employee status to 'asked'
            await supabase.rpc('update_employee_event_status', {
              p_employee_id: employee.id,
              p_event_id: event.id,
              p_new_status: 'asked',
              p_response_method: 'whatsapp'
            })

            // Log the message in database
            await supabase
              .from('whatsapp_messages')
              .insert({
                employee_id: employee.id,
                event_id: event.id,
                message_sid: result.messageSid,
                phone_number: employee.phone_number,
                message_body: messageBody,
                message_type: 'invitation',
                delivery_status: 'sent'
              })

            results.push({
              employeeId: employee.id,
              employeeName: employee.name,
              success: true,
              messageSid: result.messageSid
            })
          } else {
            results.push({
              employeeId: employee.id,
              employeeName: employee.name,
              success: false,
              error: result.error
            })
          }
        } catch (err) {
          results.push({
            employeeId: employee.id,
            employeeName: employee.name,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
          })
        }
      }

      return results
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitations')
      throw err
    } finally {
      setSending(false)
    }
  }

  // Get WhatsApp message history for an event
  const getMessageHistory = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select(`
          *,
          employees (name, phone_number)
        `)
        .eq('event_id', eventId)
        .order('sent_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get message history')
      throw err
    }
  }

  // Process incoming WhatsApp response
  const processWhatsAppResponse = async (
    phoneNumber: string,
    messageBody: string,
    eventId: string
  ) => {
    try {
      // Find employee by phone number
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single()

      if (empError) throw empError

      // Parse response
      const response = parseWhatsAppResponse(messageBody)
      
      if (response !== 'unknown') {
        const newStatus = response === 'yes' ? 'available' : 'unavailable'
        
        // Update employee status
        await supabase.rpc('update_employee_event_status', {
          p_employee_id: employee.id,
          p_event_id: eventId,
          p_new_status: newStatus,
          p_response_method: 'whatsapp'
        })

        // Log the response
        await supabase
          .from('whatsapp_messages')
          .insert({
            employee_id: employee.id,
            event_id: eventId,
            phone_number: phoneNumber,
            message_body: messageBody,
            message_type: 'response',
            response_body: messageBody,
            response_received_at: new Date().toISOString()
          })

        return {
          success: true,
          employeeName: employee.name,
          response: newStatus
        }
      }

      return {
        success: false,
        error: 'Could not understand response'
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process response')
      throw err
    }
  }

  return {
    sending,
    error,
    sendEventInvitations,
    getMessageHistory,
    processWhatsAppResponse
  }
}

function parseWhatsAppResponse(message: string): 'yes' | 'no' | 'unknown' {
  const normalizedMessage = message.toLowerCase().trim();
  
  // German responses
  if (normalizedMessage.includes('ja') || 
      normalizedMessage.includes('yes') || 
      normalizedMessage.includes('✅') ||
      normalizedMessage.includes('kann arbeiten')) {
    return 'yes';
  }
  
  if (normalizedMessage.includes('nein') || 
      normalizedMessage.includes('no') || 
      normalizedMessage.includes('❌') ||
      normalizedMessage.includes('kann nicht')) {
    return 'no';
  }
  
  return 'unknown';
}