"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useEmployees } from "./use-employees"
import { useEvents } from "./use-events"

interface Event {
  id: string
  name: string
  date: string
  employeesNeeded: number
  employeesToAsk: number
  alwaysNeededCount?: number
  status?: string
  // Add database fields for compatibility
  title?: string
  event_date?: string
  employees_needed?: number
  employees_to_ask?: number
}

interface EventContextType {
  selectedEvent: Event | null
  setSelectedEvent: (event: Event | null) => void
  eventEmployees: any[]
  eventConfig: any
  isLoading: boolean
  refreshEventData: () => void
  events: Event[] // Add transformed events to context
}

const EVENT_STORAGE_KEY = 'ems-selected-event'

const EventContext = createContext<EventContextType | undefined>(undefined)

export function EventProvider({ children }: { children: ReactNode }) {
  const [selectedEvent, setSelectedEventState] = useState<Event | null>(null)
  const [eventEmployees, setEventEmployees] = useState<any[]>([])
  const [eventConfig, setEventConfig] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)

  const { employees: dbEmployees, loading: employeesLoading } = useEmployees()
  const { events: dbEvents, loading: eventsLoading } = useEvents()

  // Transform database events to match UI format
  const events = dbEvents?.map(evt => ({
    id: evt.id,
    name: evt.title,
    date: new Date(evt.event_date).toLocaleDateString(),
    employeesNeeded: evt.employees_needed,
    employeesToAsk: evt.employees_to_ask,
    alwaysNeededCount: dbEmployees?.filter(emp => emp.is_always_needed).length || 0,
    status: evt.status,
    // Keep database fields for compatibility
    title: evt.title,
    event_date: evt.event_date,
    employees_needed: evt.employees_needed,
    employees_to_ask: evt.employees_to_ask
  })) || []

  // Enhanced setSelectedEvent with persistence
  const setSelectedEvent = (event: Event | null) => {
    console.log('🎯 Event Context: Setting selected event:', event?.name || 'null')
    setSelectedEventState(event)
    
    // Persist to localStorage
    try {
      if (event) {
        localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify({
          id: event.id,
          name: event.name,
          date: event.date,
          employeesNeeded: event.employeesNeeded,
          employeesToAsk: event.employeesToAsk,
          alwaysNeededCount: event.alwaysNeededCount,
          status: event.status,
          title: event.title,
          event_date: event.event_date,
          employees_needed: event.employees_needed,
          employees_to_ask: event.employees_to_ask
        }))
        console.log('✅ Event Context: Persisted event to localStorage:', event.name)
      } else {
        localStorage.removeItem(EVENT_STORAGE_KEY)
        console.log('🗑️ Event Context: Removed event from localStorage')
      }
    } catch (error) {
      console.error('Failed to persist selected event:', error)
    }

    // Dispatch custom event for cross-tab synchronization
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('selectedEventChanged', { detail: event }))
    }
  }

  // Load persisted event on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedEvent = localStorage.getItem(EVENT_STORAGE_KEY)
        if (savedEvent) {
          const parsedEvent = JSON.parse(savedEvent)
          console.log('🔄 Event Context: Loaded persisted event:', parsedEvent.name)
          
          // Verify event still exists in database
          const existsInDb = dbEvents?.some(evt => evt.id === parsedEvent.id) || false
          if (existsInDb) {
            setSelectedEventState(parsedEvent)
          } else {
            console.log('⚠️ Event Context: Persisted event no longer exists in database, clearing')
            localStorage.removeItem(EVENT_STORAGE_KEY)
          }
        }
      } catch (error) {
        console.error('Failed to load persisted selected event:', error)
        localStorage.removeItem(EVENT_STORAGE_KEY)
      }
    }
  }, [dbEvents?.length]) // Re-run when events are loaded

  // Set initial selected event if none is selected and no persisted event
  useEffect(() => {
    if (!selectedEvent && events.length > 0 && !employeesLoading && !eventsLoading) {
      // Only set default if no event is persisted
      const hasPersistedEvent = typeof window !== 'undefined' && localStorage.getItem(EVENT_STORAGE_KEY)
      if (!hasPersistedEvent) {
        console.log('🎯 Event Context: Setting default event:', events[0].name)
        setSelectedEvent(events[0])
      }
    }
  }, [events, selectedEvent, employeesLoading, eventsLoading])

  // Listen for storage changes (cross-tab synchronization)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === EVENT_STORAGE_KEY) {
        try {
          if (e.newValue) {
            const newEvent = JSON.parse(e.newValue)
            console.log('🔄 Event Context: Syncing event from another tab:', newEvent.name)
            setSelectedEventState(newEvent)
          } else {
            console.log('🔄 Event Context: Event cleared in another tab')
            setSelectedEventState(null)
          }
        } catch (error) {
          console.error('Failed to sync selected event from storage:', error)
        }
      }
    }

    const handleCustomEvent = (e: CustomEvent) => {
      console.log('🔄 Event Context: Received event change from custom event')
      // Custom event handling if needed
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('selectedEventChanged', handleCustomEvent as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('selectedEventChanged', handleCustomEvent as EventListener)
    }
  }, [])

  // Update selected event if it was modified in the database
  useEffect(() => {
    if (selectedEvent && events.length > 0) {
      const updatedEvent = events.find(evt => evt.id === selectedEvent.id)
      if (updatedEvent && JSON.stringify(updatedEvent) !== JSON.stringify(selectedEvent)) {
        console.log('🔄 Event Context: Syncing event with database changes')
        setSelectedEvent(updatedEvent)
      }
    }
  }, [events, selectedEvent])

  // Load event-specific data when selected event changes
  useEffect(() => {
    if (selectedEvent && !employeesLoading && !eventsLoading) {
      loadEventData(selectedEvent)
    }
  }, [selectedEvent, employeesLoading, eventsLoading])

  const loadEventData = async (event: Event) => {
    if (isLoading) return // Prevent concurrent loads
    
    setIsLoading(true)
    try {
      console.log('🔄 Event Context: Loading data for event:', event.name)
      
      // Load event-specific employee data
      const eventEmployeeData = (dbEmployees || []).map(emp => ({
        id: emp.id,
        name: emp.name,
        userId: emp.user_id,
        lastSelection: emp.last_worked_date ? new Date(emp.last_worked_date).toLocaleString() : "Nie",
        status: emp.is_always_needed ? "always-needed" : "available",
        notes: `${emp.role} - ${emp.employment_type === 'fixed' ? 'Festangestellt' : 'Teilzeit'}`,
        // Add event-specific status here when available
        eventStatus: "not_asked" // This would come from employee_event_status table
      }))

      setEventEmployees(eventEmployeeData)

      // Load event configuration
      const config = {
        employeesNeeded: event.employeesNeeded,
        employeesToAsk: event.employeesToAsk,
        alwaysNeededCount: event.alwaysNeededCount || 0,
        hourlyRate: 15.00, // This would come from the event
        location: "TBD", // This would come from the event
        // Add more event-specific configurations here
      }

      setEventConfig(config)
      console.log('✅ Event Context: Event data loaded successfully')
    } catch (error) {
      console.error('Error loading event data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshEventData = () => {
    if (selectedEvent) {
      loadEventData(selectedEvent)
    }
  }

  const value = {
    selectedEvent,
    setSelectedEvent,
    eventEmployees,
    eventConfig,
    isLoading: isLoading || employeesLoading || eventsLoading,
    refreshEventData,
    events // Add events to context value
  }

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  )
}

export function useEventContext() {
  const context = useContext(EventContext)
  if (context === undefined) {
    throw new Error('useEventContext must be used within an EventProvider')
  }
  return context
} 