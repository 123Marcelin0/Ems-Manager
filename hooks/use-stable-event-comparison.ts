import { useRef, useCallback } from 'react'

interface Event {
  id: string
  name: string
  date: string
  employeesNeeded: number
  employeesToAsk: number
  alwaysNeededCount?: number
  status?: string
  title?: string
  event_date?: string
  employees_needed?: number
  employees_to_ask?: number
}

/**
 * Custom hook for stable event comparison to prevent infinite loops
 * while ensuring proper data loading when events actually change
 */
export function useStableEventComparison() {
  const lastEventRef = useRef<Event | null>(null)
  const lastUpdateTimestamp = useRef<number>(0)
  
  const hasEventChanged = useCallback((newEvent: Event | null): boolean => {
    const now = Date.now()
    
    // Prevent rapid updates (debounce)
    if (now - lastUpdateTimestamp.current < 100) {
      return false
    }
    
    const lastEvent = lastEventRef.current
    
    // If both are null, no change
    if (!newEvent && !lastEvent) {
      return false
    }
    
    // If one is null and other isn't, it's a change
    if (!newEvent || !lastEvent) {
      lastEventRef.current = newEvent
      lastUpdateTimestamp.current = now
      return true
    }
    
    // Compare meaningful properties
    const hasChanged = (
      newEvent.id !== lastEvent.id ||
      newEvent.name !== lastEvent.name ||
      newEvent.employeesNeeded !== lastEvent.employeesNeeded ||
      newEvent.employeesToAsk !== lastEvent.employeesToAsk ||
      newEvent.status !== lastEvent.status
    )
    
    if (hasChanged) {
      lastEventRef.current = newEvent
      lastUpdateTimestamp.current = now
    }
    
    return hasChanged
  }, [])
  
  const getStableEventId = useCallback((event: Event | null): string | null => {
    return event?.id || null
  }, [])
  
  const resetComparison = useCallback(() => {
    lastEventRef.current = null
    lastUpdateTimestamp.current = 0
  }, [])
  
  return {
    hasEventChanged,
    getStableEventId,
    resetComparison
  }
}