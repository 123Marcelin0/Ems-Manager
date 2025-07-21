import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createEventInvitationMessage } from '@/lib/twilio'
import { sendWhatsAppMessageServer } from '@/lib/server-whatsapp'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, eventId } = body

    switch (action) {
      case 'start':
        return NextResponse.json({ success: true, message: 'Lifecycle manager started' })
      
      case 'stop':
        return NextResponse.json({ success: true, message: 'Lifecycle manager stopped' })
      
      case 'triggerAdditionalRecruitment':
        if (!eventId) {
          return NextResponse.json(
            { error: 'Event ID is required for additional recruitment' },
            { status: 400 }
          )
        }
        await triggerAdditionalRecruitment(eventId)
        return NextResponse.json({ success: true, message: 'Additional recruitment triggered' })
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Lifecycle API error:', error)
    return NextResponse.json(
      { error: 'Failed to execute lifecycle action' },
      { status: 500 }
    )
  }
}

// Manually trigger additional recruitment for an event
async function triggerAdditionalRecruitment(eventId: string) {
  try {
    // Check recruitment status
    const { data: recruitmentStatus, error } = await supabase
      .rpc('check_recruitment_status', { p_event_id: eventId })

    if (error) throw error

    if (recruitmentStatus && recruitmentStatus.length > 0) {
      const status = recruitmentStatus[0]
      
      if (status.needs_more_recruitment && status.suggested_additional_asks > 0) {
        // Get additional employees to ask
        const { data: additionalEmployees, error: selectionError } = await supabase
          .rpc('select_employees_for_event', {
            p_event_id: eventId,
            p_additional_count: status.suggested_additional_asks
          })

        if (selectionError) throw selectionError

        if (additionalEmployees && additionalEmployees.length > 0) {
          // Get event details
          const { data: event, error: eventError } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single()

          if (eventError) throw eventError

          // Send WhatsApp invitations to additional employees
          for (const employee of additionalEmployees) {
            try {
              const messageBody = createEventInvitationMessage(
                employee.employee_name,
                event.title,
                new Date(event.event_date).toLocaleDateString('de-DE'),
                event.start_time,
                event.hourly_rate
              )

              const result = await sendWhatsAppMessageServer({
                to: employee.phone_number || '',
                message: messageBody,
                eventId: event.id,
                employeeId: employee.employee_id
              })

              if (result.success) {
                // Update employee status to asked
                await supabase.rpc('update_employee_event_status', {
                  p_employee_id: employee.employee_id,
                  p_event_id: event.id,
                  p_new_status: 'asked',
                  p_response_method: 'whatsapp'
                })

                console.log('📱 Additional invitation sent to:', employee.employee_name)
              }
            } catch (err) {
              console.error('❌ Error sending additional invitation:', err)
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error triggering additional recruitment:', error)
    throw error
  }
}