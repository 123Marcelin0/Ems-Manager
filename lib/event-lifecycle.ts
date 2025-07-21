import { supabase } from './supabase'
import { createEventInvitationMessage } from './twilio'

export interface EventLifecycleConfig {
  checkIntervalMs?: number // How often to check for status changes
  autoStartWorkSession?: boolean // Whether to automatically start work sessions
  autoCompleteEvents?: boolean // Whether to automatically complete events
}

export class EventLifecycleManager {
  private checkInterval: NodeJS.Timeout | null = null
  private config: EventLifecycleConfig

  constructor(config: EventLifecycleConfig = {}) {
    this.config = {
      checkIntervalMs: 60000, // Check every minute
      autoStartWorkSession: true,
      autoCompleteEvents: true,
      ...config
    }
  }

  // Start the lifecycle manager
  start() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    this.checkInterval = setInterval(() => {
      this.checkEventStatuses()
    }, this.config.checkIntervalMs)

    console.log('🔄 Event lifecycle manager started')
  }

  // Stop the lifecycle manager
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    console.log('⏹️ Event lifecycle manager stopped')
  }

  // Check and update event statuses
  private async checkEventStatuses() {
    try {
      const now = new Date()
      
      // Check for events that should transition from recruiting to planned
      await this.checkRecruitmentCompletion()
      
      // Check for events that should start (recruiting/planned → active)
      if (this.config.autoStartWorkSession) {
        await this.checkEventStart(now)
      }
      
      // Check for events that should complete (active → completed)
      if (this.config.autoCompleteEvents) {
        await this.checkEventCompletion(now)
      }
      
    } catch (error) {
      console.error('❌ Error in event lifecycle check:', error)
    }
  }

  // Check if recruitment is complete and transition to planned
  private async checkRecruitmentCompletion() {
    try {
      // Get events in recruiting status
      const { data: recruitingEvents, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'recruiting')

      if (error) throw error

      for (const event of recruitingEvents || []) {
        // Check recruitment status
        const { data: recruitmentStatus, error: statusError } = await supabase
          .rpc('check_recruitment_status', { p_event_id: event.id })

        if (statusError) continue

        if (recruitmentStatus && recruitmentStatus.length > 0) {
          const status = recruitmentStatus[0]
          
          // If we have enough available employees, mark as planned
          if (status.employees_available >= status.employees_needed) {
            await supabase
              .from('events')
              .update({ 
                status: 'planned',
                updated_at: new Date().toISOString()
              })
              .eq('id', event.id)

            console.log('✅ Event marked as planned:', event.title)
          }
        }
      }
    } catch (error) {
      console.error('❌ Error checking recruitment completion:', error)
    }
  }

  // Check if events should start and mark employees as working
  private async checkEventStart(now: Date) {
    try {
      // Get events that should start (within 15 minutes of start time)
      const { data: eventsToStart, error } = await supabase
        .from('events')
        .select('*')
        .in('status', ['recruiting', 'planned'])
        .gte('event_date', now.toISOString().split('T')[0])

      if (error) throw error

      for (const event of eventsToStart || []) {
        const eventDateTime = new Date(`${event.event_date}T${event.start_time}`)
        const timeUntilStart = eventDateTime.getTime() - now.getTime()
        
        // If event starts within 15 minutes, mark as active and start work sessions
        if (timeUntilStart <= 15 * 60 * 1000 && timeUntilStart > -60 * 60 * 1000) { // Within 15 min before to 1 hour after
          await this.startEventWorkSession(event)
        }
      }
    } catch (error) {
      console.error('❌ Error checking event start:', error)
    }
  }

  // Start work session for an event
  private async startEventWorkSession(event: any) {
    try {
      // Update event status to active
      await supabase
        .from('events')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', event.id)

      // Get all available employees for this event
      const { data: availableEmployees, error } = await supabase
        .from('employee_event_status')
        .select(`
          *,
          employees (
            id,
            name,
            phone_number
          )
        `)
        .eq('event_id', event.id)
        .eq('status', 'available')

      if (error) throw error

      // Mark employees as working and create time records
      for (const status of availableEmployees || []) {
        const employee = status.employees
        
        // Update employee status to working
        await supabase.rpc('update_employee_event_status', {
          p_employee_id: employee.id,
          p_event_id: event.id,
          p_new_status: 'working',
          p_response_method: 'automatic'
        })

        // Create time record
        await supabase
          .from('time_records')
          .insert({
            employee_id: employee.id,
            event_id: event.id,
            sign_in_time: new Date().toISOString(),
            hourly_rate: event.hourly_rate,
            status: 'active'
          })

        console.log('👷 Employee marked as working:', employee.name, 'for event:', event.title)
      }

      console.log('🚀 Event work session started:', event.title)
    } catch (error) {
      console.error('❌ Error starting event work session:', error)
    }
  }

  // Check if events should complete
  private async checkEventCompletion(now: Date) {
    try {
      // Get active events that ended more than 2 hours ago
      const { data: activeEvents, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'active')

      if (error) throw error

      for (const event of activeEvents || []) {
        const eventEndTime = new Date(`${event.event_date}T${event.end_time || '23:59'}`)
        const timeSinceEnd = now.getTime() - eventEndTime.getTime()
        
        // If event ended more than 2 hours ago, mark as completed
        if (timeSinceEnd > 2 * 60 * 60 * 1000) {
          await this.completeEvent(event)
        }
      }
    } catch (error) {
      console.error('❌ Error checking event completion:', error)
    }
  }

  // Complete an event
  private async completeEvent(event: any) {
    try {
      // Update event status to completed
      await supabase
        .from('events')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', event.id)

      // Mark all working employees as completed
      await supabase
        .from('employee_event_status')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('event_id', event.id)
        .eq('status', 'working')

      console.log('✅ Event completed:', event.title)
    } catch (error) {
      console.error('❌ Error completing event:', error)
    }
  }

  // Manually trigger additional recruitment for an event
  async triggerAdditionalRecruitment(eventId: string) {
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

                const response = await fetch('/api/whatsapp', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    to: employee.phone_number || '',
                    message: messageBody,
                    eventId: event.id,
                    employeeId: employee.employee_id
                  })
                })

                const result = await response.json()

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
    }
  }
}

// Export singleton instance
export const eventLifecycleManager = new EventLifecycleManager() 