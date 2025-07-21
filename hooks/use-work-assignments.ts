import { useState, useEffect } from 'react'

export interface WorkAssignment {
  id: string
  employee_id: string
  work_area_id: string
  event_id: string
  assigned_at: string
  employees?: {
    id: string
    name: string
    role: string
    phone_number: string
  }
  work_areas?: {
    id: string
    name: string
    location: string
    max_capacity: number
    role_requirements: Record<string, number>
  }
  events?: {
    id: string
    title: string
    event_date: string
  }
}

export interface CreateAssignmentData {
  employee_id: string
  work_area_id: string
}

export function useWorkAssignments() {
  const [assignments, setAssignments] = useState<WorkAssignment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAssignments = async (filters?: { 
    event_id?: string; 
    employee_id?: string; 
    work_area_id?: string 
  }) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (filters?.event_id) params.append('event_id', filters.event_id)
      if (filters?.employee_id) params.append('employee_id', filters.employee_id)
      if (filters?.work_area_id) params.append('work_area_id', filters.work_area_id)
      
      const response = await fetch(`/api/work-assignments?${params}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch work assignments')
      }

      setAssignments(result.data || [])
      return result.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch work assignments')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const saveAssignments = async (eventId: string, assignmentData: CreateAssignmentData[]) => {
    try {
      setError(null)
      
      const response = await fetch('/api/work-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: eventId,
          assignments: assignmentData,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to save work assignments')
      }

      // Refresh assignments after saving
      await fetchAssignments({ event_id: eventId })
      
      return result.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save work assignments')
      throw err
    }
  }

  const removeAssignment = async (params: {
    assignment_id?: string;
    event_id?: string;
    employee_id?: string;
    work_area_id?: string;
  }) => {
    try {
      setError(null)
      
      const urlParams = new URLSearchParams()
      if (params.assignment_id) urlParams.append('assignment_id', params.assignment_id)
      if (params.event_id) urlParams.append('event_id', params.event_id)
      if (params.employee_id) urlParams.append('employee_id', params.employee_id)
      if (params.work_area_id) urlParams.append('work_area_id', params.work_area_id)
      
      const response = await fetch(`/api/work-assignments?${urlParams}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to remove work assignment')
      }

      // Update local state by removing the assignment
      if (params.assignment_id) {
        setAssignments(prev => prev.filter(assignment => assignment.id !== params.assignment_id))
      } else if (params.event_id && params.employee_id && params.work_area_id) {
        setAssignments(prev => prev.filter(assignment => 
          !(assignment.event_id === params.event_id && 
            assignment.employee_id === params.employee_id && 
            assignment.work_area_id === params.work_area_id)
        ))
      }

      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove work assignment')
      throw err
    }
  }

  const getAssignmentsForEvent = (eventId: string) => {
    return assignments.filter(assignment => assignment.event_id === eventId)
  }

  const getAssignmentsForEmployee = (employeeId: string) => {
    return assignments.filter(assignment => assignment.employee_id === employeeId)
  }

  const getAssignmentsForWorkArea = (workAreaId: string) => {
    return assignments.filter(assignment => assignment.work_area_id === workAreaId)
  }

  const getEmployeesInWorkArea = (workAreaId: string) => {
    return assignments
      .filter(assignment => assignment.work_area_id === workAreaId)
      .map(assignment => assignment.employees)
      .filter(Boolean)
  }

  return {
    assignments,
    loading,
    error,
    fetchAssignments,
    saveAssignments,
    removeAssignment,
    getAssignmentsForEvent,
    getAssignmentsForEmployee,
    getAssignmentsForWorkArea,
    getEmployeesInWorkArea,
  }
} 