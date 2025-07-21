import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Event {
  id: string
  title: string
  location: string
  event_date: string
  start_time: string
  end_time?: string
  description?: string
  specialties?: string
  hourly_rate: number
  employees_needed: number
  employees_to_ask: number
  status: 'draft' | 'recruiting' | 'planned' | 'active' | 'completed' | 'cancelled'
  created_by?: string
  created_at: string
  updated_at: string
  is_template?: boolean
  template_id?: string
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Enhanced fetchEvents with better empty state handling
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching events from database...')
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching events:', error)
        throw error
      }

      console.log(`✅ Successfully fetched ${data?.length || 0} events`)
      setEvents(data || [])
      
      // If no events exist, log helpful message
      if (!data || data.length === 0) {
        console.log('ℹ️ No events found in database - this is normal after cleanup')
      }
      
      return data || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch events'
      console.error('❌ Events fetch error:', errorMessage)
      setError(errorMessage)
      setEvents([]) // Ensure we have an empty array on error
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single()

      if (error) throw error
      
      // Update local state immediately
      setEvents(prev => [...prev, data])
      
      // Force a fresh fetch to ensure all components get the latest data
      setTimeout(() => {
        fetchEvents()
      }, 500)
      
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event')
      throw err
    }
  }

  const createEventWithWorkAreas = async (eventData: any, workAreasData: any[] = []) => {
    try {
      const response = await fetch('/api/events/create-with-work-areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_data: eventData,
          work_areas_data: workAreasData,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create event with work areas')
      }

      // Add the new event to local state
      if (result.data.event_data) {
        setEvents(prev => [...prev, result.data.event_data])
      }

      return result.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event with work areas')
      throw err
    }
  }

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setEvents(prev => prev.map(event => event.id === id ? data : event))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event')
      throw err
    }
  }

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

      if (error) throw error
      setEvents(prev => prev.filter(event => event.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event')
      throw err
    }
  }

  // Get events by status
  const getEventsByStatus = (status: Event['status']) => {
    return events.filter(event => event.status === status)
  }

  // Get upcoming events (today and future)
  const getUpcomingEvents = () => {
    const today = new Date().toISOString().split('T')[0]
    return events.filter(event => event.event_date >= today)
  }

  // Get active events
  const getActiveEvents = () => {
    return events.filter(event => event.status === 'active')
  }

  // Get events that need attention (recruiting with low response rate)
  const getEventsNeedingAttention = async () => {
    try {
      const recruitingEvents = events.filter(event => event.status === 'recruiting')
      const eventsWithIssues = []

      for (const event of recruitingEvents) {
        const { data: recruitmentStatus, error } = await supabase
          .rpc('check_recruitment_status', { p_event_id: event.id })

        if (!error && recruitmentStatus && recruitmentStatus.length > 0) {
          const status = recruitmentStatus[0]
          if (status.needs_more_recruitment) {
            eventsWithIssues.push({
              ...event,
              recruitmentStatus: status
            })
          }
        }
      }

      return eventsWithIssues
    } catch (err) {
      console.error('Error getting events needing attention:', err)
      return []
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Set up real-time subscription for events
  useEffect(() => {
    const subscription = supabase
      .channel('events-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'events'
      }, (payload) => {
        console.log('Event change:', payload)
        
        if (payload.eventType === 'INSERT') {
          setEvents(prev => [...prev, payload.new as Event])
        } else if (payload.eventType === 'UPDATE') {
          setEvents(prev => prev.map(event => 
            event.id === payload.new.id ? payload.new as Event : event
          ))
        } else if (payload.eventType === 'DELETE') {
          setEvents(prev => prev.filter(event => event.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Set up real-time subscription for employee event status changes
  useEffect(() => {
    const subscription = supabase
      .channel('employee-event-status-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'employee_event_status'
      }, (payload) => {
        console.log('Employee event status change:', payload)
        // This will trigger UI updates when employee statuses change
        // The individual components will handle their own real-time updates
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    createEventWithWorkAreas,
    updateEvent,
    deleteEvent,
    getEventsByStatus,
    getUpcomingEvents,
    getActiveEvents,
    getEventsNeedingAttention
  }
}