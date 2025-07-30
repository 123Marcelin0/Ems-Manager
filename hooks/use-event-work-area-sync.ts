import { useState, useEffect, useCallback, useRef } from 'react'
import { useEventContext } from './use-event-context'
import { useWorkAreas } from './use-work-areas'
import { useEmployees } from './use-employees'
import { supabase } from '@/lib/supabase'

interface WorkAreaAssignment {
  id: string
  employee_id: string
  work_area_id: string
  event_id: string
  assigned_at: string
}

interface SyncedWorkArea {
  id: string
  name: string
  location: string
  max_capacity: number
  is_active: boolean
  role_requirements: { [roleId: string]: number }
  assigned_employees: Array<{
    id: string
    name: string
    role: string
    user_id: string
  }>
  event_id: string
}

/**
 * Hook to synchronize events and work area assignments
 * Ensures the latest event is always synchronized and work areas are properly synced
 */
export function useEventWorkAreaSync() {
  const { selectedEvent, events, refreshEventData } = useEventContext()
  const { workAreas, fetchWorkAreasByEvent, saveWorkAreasForEvent } = useWorkAreas()
  const { employees, fetchEmployeesWithStatus } = useEmployees()
  
  const [syncedWorkAreas, setSyncedWorkAreas] = useState<SyncedWorkArea[]>([])
  const [workAreaAssignments, setWorkAreaAssignments] = useState<WorkAreaAssignment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSyncedEventId, setLastSyncedEventId] = useState<string | null>(null)
  
  // Use ref to track if sync is in progress to prevent duplicate calls
  const syncInProgressRef = useRef(false)
  // Track if initial sync has been completed for the current event
  const initialSyncCompletedRef = useRef<string | null>(null)
  // Debounce timer for real-time updates
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  // Ref to store the sync function to avoid circular dependencies
  const syncEventDataRef = useRef<((eventId: string) => Promise<void>) | null>(null)
  // Cache to prevent unnecessary API calls
  const lastSyncTimestamp = useRef<{ [eventId: string]: number }>({})
  // Minimum time between syncs (in milliseconds)
  const MIN_SYNC_INTERVAL = 5000 // 5 seconds

  // Fetch work area assignments from database
  const fetchWorkAreaAssignments = useCallback(async (eventId: string): Promise<WorkAreaAssignment[]> => {
    try {
      console.log(`🔄 Fetching work area assignments for event: ${eventId}`)
      
      // Use the API endpoint for consistency
      const response = await fetch(`/api/work-assignments?eventId=${eventId}`)
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch work area assignments')
      }
      
      const assignments = result.data || []
      console.log(`✅ Fetched ${assignments.length} work area assignments`)
      
      return assignments.map((assignment: any) => ({
        id: assignment.id,
        employee_id: assignment.employee_id,
        work_area_id: assignment.work_area_id,
        event_id: assignment.event_id,
        assigned_at: assignment.assigned_at
      }))
    } catch (err) {
      console.error('Error fetching work area assignments:', err)
      
      // Fallback to direct Supabase query
      try {
        console.log('🔄 Falling back to direct Supabase query')
        const { data, error } = await supabase
          .from('work_assignments')
          .select('*')
          .eq('event_id', eventId)

        if (error) {
          throw new Error(`Failed to fetch work area assignments: ${error.message}`)
        }

        console.log(`✅ Fallback: Fetched ${data?.length || 0} work area assignments`)
        return data || []
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr)
        return []
      }
    }
  }, [])

  // Combine work areas with their assigned employees
  const combineWorkAreasWithAssignments = useCallback(async (
    eventId: string,
    assignments: WorkAreaAssignment[],
    employeesWithStatus: any[]
  ): Promise<SyncedWorkArea[]> => {
    try {
      // Get work areas from the hook
      const eventWorkAreas = workAreas.filter(area => area.event_id === eventId && area.is_active)
      
      console.log(`🔄 Combining ${eventWorkAreas.length} work areas with ${assignments.length} assignments`)

      const syncedAreas: SyncedWorkArea[] = eventWorkAreas.map(area => {
        // Find assignments for this work area
        const areaAssignments = assignments.filter(assignment => assignment.work_area_id === area.id)
        console.log(`📋 Work area "${area.name}" has ${areaAssignments.length} assignments`)

        // Get employee details for assignments
        const assignedEmployees = areaAssignments.map(assignment => {
          const employee = employeesWithStatus.find(emp => emp.id === assignment.employee_id)
          if (employee) {
            console.log(`👤 Employee ${employee.name} assigned to ${area.name}`)
            return {
              id: employee.id,
              name: employee.name,
              role: employee.role,
              user_id: employee.user_id
            }
          } else {
            console.warn(`⚠️ Employee ${assignment.employee_id} not found in employee list`)
            return null
          }
        }).filter(Boolean) as Array<{
          id: string
          name: string
          role: string
          user_id: string
        }>

        return {
          id: area.id,
          name: area.name,
          location: area.location,
          max_capacity: area.max_capacity,
          is_active: area.is_active,
          role_requirements: area.role_requirements,
          assigned_employees: assignedEmployees,
          event_id: eventId
        }
      })

      console.log(`✅ Combined work areas with assignments:`, syncedAreas.map(area => ({
        name: area.name,
        assignedCount: area.assigned_employees.length,
        employees: area.assigned_employees.map(emp => emp.name)
      })))

      return syncedAreas
    } catch (err) {
      console.error('Error combining work areas with assignments:', err)
      return []
    }
  }, [workAreas])

  // Main synchronization function with throttling
  const syncEventData = useCallback(async (eventId: string, force = false) => {
    // Check if sync is already in progress
    if (syncInProgressRef.current) {
      console.log('⏳ Sync already in progress, skipping...')
      return
    }

    // Check throttling - prevent too frequent syncs unless forced
    const now = Date.now()
    const lastSync = lastSyncTimestamp.current[eventId] || 0
    if (!force && (now - lastSync) < MIN_SYNC_INTERVAL) {
      console.log(`🚫 Sync throttled for event ${eventId} (last sync ${Math.round((now - lastSync) / 1000)}s ago)`)
      return
    }

    syncInProgressRef.current = true
    setIsLoading(true)
    setError(null)

    try {
      console.log(`🔄 Starting sync for event: ${eventId} (force: ${force})`)

      // 1. Fetch work areas for the event
      await fetchWorkAreasByEvent(eventId)

      // 2. Fetch work area assignments
      const assignments = await fetchWorkAreaAssignments(eventId)
      setWorkAreaAssignments(assignments)

      // 3. Fetch employees with their event status
      const employeesWithStatus = await fetchEmployeesWithStatus(eventId)

      // 4. Combine work areas with their assigned employees
      const syncedAreas = await combineWorkAreasWithAssignments(eventId, assignments, employeesWithStatus)
      setSyncedWorkAreas(syncedAreas)

      setLastSyncedEventId(eventId)
      initialSyncCompletedRef.current = eventId
      lastSyncTimestamp.current[eventId] = now
      console.log(`✅ Sync completed for event: ${eventId}`)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync event data'
      console.log('❌ Sync failed:', errorMessage)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
      syncInProgressRef.current = false
    }
  }, [fetchWorkAreasByEvent, fetchEmployeesWithStatus, fetchWorkAreaAssignments, combineWorkAreasWithAssignments])

  // Update the ref whenever syncEventData changes
  useEffect(() => {
    syncEventDataRef.current = syncEventData
  }, [syncEventData])

  // Debounced sync function for real-time updates
  const debouncedSyncEventData = useCallback((eventId: string, delay = 2000) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    debounceTimerRef.current = setTimeout(() => {
      // Use the main sync function with throttling
      if (syncEventDataRef.current) {
        console.log(`🔄 Debounced sync triggered for event: ${eventId}`)
        syncEventDataRef.current(eventId, false) // Don't force, respect throttling
      }
    }, delay)
  }, [])

  // Auto-sync when selected event changes
  useEffect(() => {
    if (selectedEvent?.id) {
      // Only sync if this is a different event or if we haven't completed initial sync for this event
      if (selectedEvent.id !== lastSyncedEventId || initialSyncCompletedRef.current !== selectedEvent.id) {
        console.log(`🔄 Event changed or initial sync needed: ${selectedEvent.name} (${selectedEvent.id})`)
        // Use ref to avoid circular dependency
        if (syncEventDataRef.current) {
          syncEventDataRef.current(selectedEvent.id)
        }
      }
    }
  }, [selectedEvent?.id, lastSyncedEventId])

  // Listen for work area changes and re-sync
  useEffect(() => {
    const handleWorkAreasChanged = () => {
      if (selectedEvent?.id) {
        console.log('🔄 Work areas changed, debounced re-sync...')
        debouncedSyncEventData(selectedEvent.id, 2000) // Longer debounce
      }
    }

    window.addEventListener('workAreasChanged', handleWorkAreasChanged)
    return () => {
      window.removeEventListener('workAreasChanged', handleWorkAreasChanged)
    }
  }, [selectedEvent?.id, debouncedSyncEventData])

  // Set up real-time subscription for work assignments (disabled to prevent infinite loops)
  useEffect(() => {
    if (!selectedEvent?.id) return

    // Temporarily disabled real-time subscriptions to prevent infinite loops
    // TODO: Re-enable with proper throttling once the sync logic is stable
    console.log(`📡 Real-time subscriptions disabled for event: ${selectedEvent.id}`)

    // const subscription = supabase
    //   .channel('work-assignments-sync')
    //   .on('postgres_changes', {
    //     event: '*',
    //     schema: 'public',
    //     table: 'work_assignments',
    //     filter: `event_id=eq.${selectedEvent.id}`
    //   }, (payload) => {
    //     console.log('📡 Work assignment change detected:', payload)
    //     // Re-sync the event data when assignments change (debounced)
    //     if (selectedEvent?.id) {
    //       debouncedSyncEventData(selectedEvent.id, 3000)
    //     }
    //   })
    //   .on('postgres_changes', {
    //     event: '*',
    //     schema: 'public',
    //     table: 'work_areas',
    //     filter: `event_id=eq.${selectedEvent.id}`
    //   }, (payload) => {
    //     console.log('📡 Work area change detected:', payload)
    //     // Re-sync when work areas change (debounced)
    //     if (selectedEvent?.id) {
    //       debouncedSyncEventData(selectedEvent.id, 3000)
    //     }
    //   })
    //   .subscribe()

    // return () => {
    //   console.log('📡 Unsubscribing from work assignments real-time updates')
    //   subscription.unsubscribe()
    // }
  }, [selectedEvent?.id, debouncedSyncEventData])

  // Assign employee to work area
  const assignEmployeeToWorkArea = useCallback(async (
    employeeId: string,
    workAreaId: string,
    eventId: string
  ) => {
    try {
      console.log(`🔄 Assigning employee ${employeeId} to work area ${workAreaId}`)

      // Check if assignment already exists
      const existingAssignment = workAreaAssignments.find(
        assignment => assignment.employee_id === employeeId && assignment.event_id === eventId
      )

      if (existingAssignment) {
        // Update existing assignment
        const { error } = await supabase
          .from('work_assignments')
          .update({ work_area_id: workAreaId })
          .eq('id', existingAssignment.id)

        if (error) {
          throw new Error(`Failed to update work area assignment: ${error.message}`)
        }
      } else {
        // Create new assignment
        const { error } = await supabase
          .from('work_assignments')
          .insert({
            employee_id: employeeId,
            work_area_id: workAreaId,
            event_id: eventId
          })

        if (error) {
          throw new Error(`Failed to create work area assignment: ${error.message}`)
        }
      }

      // Re-sync data
      if (syncEventDataRef.current) {
        await syncEventDataRef.current(eventId)
      }
      console.log(`✅ Employee assigned successfully`)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign employee'
      console.error('❌ Assignment failed:', errorMessage)
      setError(errorMessage)
      throw err
    }
  }, [workAreaAssignments])

  // Remove employee from work area
  const removeEmployeeFromWorkArea = useCallback(async (
    employeeId: string,
    eventId: string
  ) => {
    try {
      console.log(`🔄 Removing employee ${employeeId} from work area`)

      const { error } = await supabase
        .from('work_assignments')
        .delete()
        .eq('employee_id', employeeId)
        .eq('event_id', eventId)

      if (error) {
        throw new Error(`Failed to remove work area assignment: ${error.message}`)
      }

      // Re-sync data
      if (syncEventDataRef.current) {
        await syncEventDataRef.current(eventId)
      }
      console.log(`✅ Employee removed successfully`)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove employee'
      console.error('❌ Removal failed:', errorMessage)
      setError(errorMessage)
      throw err
    }
  }, [syncEventData])

  // Get work area assignments for attendance list
  const getWorkAreaAssignmentsForAttendance = useCallback(() => {
    if (!selectedEvent?.id) return []

    return syncedWorkAreas.map(area => ({
      id: area.id,
      name: area.name,
      location: area.location,
      needed: Object.values(area.role_requirements).reduce((sum, count) => sum + count, 0),
      present: area.assigned_employees.length,
      employees: area.assigned_employees.map(emp => emp.name)
    }))
  }, [syncedWorkAreas, selectedEvent?.id])

  // Force refresh of event and work area data
  const forceRefresh = useCallback(async () => {
    if (selectedEvent?.id) {
      console.log('🔄 Force refreshing event and work area data...')
      // Clear any pending debounced syncs
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      await refreshEventData()
      if (syncEventDataRef.current) {
        await syncEventDataRef.current(selectedEvent.id, true) // Force sync, bypass throttling
      }
    }
  }, [selectedEvent?.id, refreshEventData])



  // Get latest event automatically
  const getLatestEvent = useCallback(() => {
    if (events.length === 0) return null

    // Sort events by date (most recent first)
    const sortedEvents = [...events].sort((a, b) => {
      const dateA = new Date(a.event_date || a.date)
      const dateB = new Date(b.event_date || b.date)
      return dateB.getTime() - dateA.getTime()
    })

    return sortedEvents[0]
  }, [events])

  // Auto-select latest event if none is selected
  useEffect(() => {
    if (!selectedEvent && events.length > 0) {
      const latestEvent = getLatestEvent()
      if (latestEvent) {
        console.log(`🎯 Auto-selecting latest event: ${latestEvent.name}`)
        // The event context will handle the selection
      }
    }
  }, [selectedEvent, events, getLatestEvent])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    // State
    syncedWorkAreas,
    workAreaAssignments,
    isLoading,
    error,
    lastSyncedEventId,

    // Actions
    syncEventData,
    assignEmployeeToWorkArea,
    removeEmployeeFromWorkArea,
    forceRefresh,

    // Computed values
    getWorkAreaAssignmentsForAttendance,
    getLatestEvent
  }
}