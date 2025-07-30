import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface WorkAssignment {
  id: string
  employee_id: string
  work_area_id: string
  event_id: string
  assigned_at: string
  employee?: {
    id: string
    name: string
    role: string
    phone_number: string
  }
  work_area?: {
    id: string
    name: string
    location: string
  }
}

export function useWorkAssignments() {
  const [assignments, setAssignments] = useState<WorkAssignment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch work assignments for a specific event
  const fetchAssignmentsByEvent = useCallback(async (eventId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`Fetching work assignments for event: ${eventId}`)
      
      const response = await fetch(`/api/work-assignments?eventId=${eventId}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch work assignments')
      }
      
      console.log(`Fetched ${result.data?.length || 0} work assignments`)
      setAssignments(result.data || [])
      return result.data || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch work assignments'
      console.error('Error fetching work assignments:', errorMessage)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Assign employee to work area
  const assignEmployee = async (employeeId: string, workAreaId: string, eventId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`Assigning employee ${employeeId} to work area ${workAreaId} for event ${eventId}`)
      
      // Check if this is an example employee (starts with 'emp-')
      if (employeeId.startsWith('emp-')) {
        console.log('⚠️ Cannot assign example employee to work area - database operation skipped')
        throw new Error('Cannot assign example employees to work areas. Please use real employees from the database.')
      }
      
      const response = await fetch('/api/work-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: employeeId,
          work_area_id: workAreaId,
          event_id: eventId
        })
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to assign employee')
      }
      
      // Update local state
      if (result.data) {
        setAssignments(prev => {
          const existingIndex = prev.findIndex(assignment => 
            assignment.employee_id === employeeId && assignment.event_id === eventId
          )
          
          if (existingIndex >= 0) {
            // Update existing
            const newAssignments = [...prev]
            newAssignments[existingIndex] = result.data
            return newAssignments
          } else {
            // Add new
            return [...prev, result.data]
          }
        })
      }
      
      console.log('Work assignment created/updated successfully')
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign employee'
      console.error('Error assigning employee:', errorMessage)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Remove employee from work area
  const removeAssignment = async (employeeId: string, eventId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`Removing assignment for employee ${employeeId} from event ${eventId}`)
      
      // Check if this is an example employee (starts with 'emp-')
      if (employeeId.startsWith('emp-')) {
        console.log('⚠️ Cannot remove example employee assignment - database operation skipped')
        throw new Error('Cannot remove example employee assignments. Please use real employees from the database.')
      }
      
      const response = await fetch('/api/work-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: employeeId,
          event_id: eventId,
          action: 'remove'
        })
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove assignment')
      }
      
      // Update local state
      setAssignments(prev => prev.filter(assignment => 
        !(assignment.employee_id === employeeId && assignment.event_id === eventId)
      ))
      
      console.log('Work assignment removed successfully')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove assignment'
      console.error('Error removing assignment:', errorMessage)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Get assignments for a specific work area
  const getAssignmentsByWorkArea = useCallback((workAreaId: string) => {
    return assignments.filter(assignment => assignment.work_area_id === workAreaId)
  }, [assignments])

  // Get assignment for a specific employee in an event
  const getEmployeeAssignment = useCallback((employeeId: string, eventId: string) => {
    return assignments.find(assignment => 
      assignment.employee_id === employeeId && assignment.event_id === eventId
    )
  }, [assignments])

  // Auto-assign employees to work areas based on roles and capacity
  const autoAssignEmployees = async (eventId: string, availableEmployees: any[], workAreas: any[]) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Starting auto-assignment of employees to work areas')
      console.log('Available employees for assignment:', availableEmployees.map(emp => ({ id: emp.id, name: emp.name })))
      
      // Extract employee IDs to ensure only sidebar employees are used
      const employeeIds = availableEmployees.map(emp => emp.id)
      
      const response = await fetch('/api/work-assignments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: eventId,
          employee_ids: employeeIds // Pass specific employee IDs
        })
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to auto-assign employees')
      }
      
      setAssignments(result.data || [])
      console.log(`Auto-assigned ${result.data?.length || 0} employees to work areas`)
      return result.data || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to auto-assign employees'
      console.error('Error auto-assigning employees:', errorMessage)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Real-time subscription for work assignments
  useEffect(() => {
    const subscription = supabase
      .channel('work-assignments-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'work_assignments'
      }, (payload) => {
        console.log('Work assignment change detected:', payload.eventType, payload)
        
        if (payload.eventType === 'INSERT') {
          // Fetch the full assignment with relations
          supabase
            .from('work_assignments')
            .select(`
              id,
              employee_id,
              work_area_id,
              event_id,
              assigned_at,
              employee:employees(id, name, role, phone_number),
              work_area:work_areas(id, name, location)
            `)
            .eq('id', payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setAssignments(prev => {
                  // Avoid duplicates
                  if (prev.some(assignment => assignment.id === data.id)) {
                    return prev
                  }
                  return [...prev, data]
                })
              }
            })
        } else if (payload.eventType === 'UPDATE') {
          // Fetch the updated assignment with relations
          supabase
            .from('work_assignments')
            .select(`
              id,
              employee_id,
              work_area_id,
              event_id,
              assigned_at,
              employee:employees(id, name, role, phone_number),
              work_area:work_areas(id, name, location)
            `)
            .eq('id', payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setAssignments(prev => prev.map(assignment => 
                  assignment.id === data.id ? data : assignment
                ))
              }
            })
        } else if (payload.eventType === 'DELETE') {
          setAssignments(prev => prev.filter(assignment => assignment.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    assignments,
    loading,
    error,
    fetchAssignmentsByEvent,
    assignEmployee,
    removeAssignment,
    getAssignmentsByWorkArea,
    getEmployeeAssignment,
    autoAssignEmployees
  }
}