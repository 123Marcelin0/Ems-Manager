import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Employee {
  id: string
  name: string
  user_id: string
  phone_number: string
  role: 'manager' | 'allrounder' | 'versorger' | 'verkauf' | 'essen'
  skills: string[]
  employment_type: 'part_time' | 'fixed'
  is_always_needed: boolean
  last_worked_date: string | null
  total_hours_worked: number
  created_at: string
  updated_at: string
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all employees
  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('last_worked_date', { ascending: true, nullsFirst: true })

      if (error) throw error
      setEmployees(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Create new employee
  const createEmployee = async (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert(employee)
        .select()
        .single()

      if (error) throw error
      setEmployees(prev => [...prev, data])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create employee')
      throw err
    }
  }

  // Update employee
  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setEmployees(prev => prev.map(emp => emp.id === id ? data : emp))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update employee')
      throw err
    }
  }

  // Delete employee
  const deleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)

      if (error) throw error
      setEmployees(prev => prev.filter(emp => emp.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete employee')
      throw err
    }
  }

  // Get employees for fair distribution (sorted by last worked date)
  const getEmployeesForSelection = async (eventId: string, additionalCount = 0) => {
    try {
      const { data, error } = await supabase
        .rpc('select_employees_for_event', {
          p_event_id: eventId,
          p_additional_count: additionalCount
        })

      if (error) throw error
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get employee selection')
      throw err
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  // Set up real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('employees-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'employees'
      }, (payload) => {
        console.log('Employee change:', payload)
        
        if (payload.eventType === 'INSERT') {
          setEmployees(prev => [...prev, payload.new as Employee])
        } else if (payload.eventType === 'UPDATE') {
          setEmployees(prev => prev.map(emp => 
            emp.id === payload.new.id ? payload.new as Employee : emp
          ))
        } else if (payload.eventType === 'DELETE') {
          setEmployees(prev => prev.filter(emp => emp.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Fetch employees with status for a specific event
  const fetchEmployeesWithStatus = useCallback(async (eventId: string) => {
    try {
      console.log(`Fetching employees with status for event: ${eventId}`)
      
      // First get all employees
      const { data: allEmployees, error: employeesError } = await supabase
        .from('employees')
        .select('id, name, user_id, role, phone_number, employment_type, is_always_needed, last_worked_date, total_hours_worked, created_at, updated_at')
        .order('name')

      if (employeesError) {
        console.warn('Error fetching employees:', employeesError.message || employeesError)
        // Return empty array instead of throwing
        return []
      }

      if (!allEmployees || allEmployees.length === 0) {
        console.log('No employees found in database')
        return []
      }

      // Then get all statuses for this event
      const { data: statuses, error: statusError } = await supabase
        .from('employee_event_status')
        .select('employee_id, status, responded_at')
        .eq('event_id', eventId)

      if (statusError) {
        console.warn('Error fetching statuses (this is OK if no statuses exist yet):', statusError.message || statusError)
        // Continue with empty statuses instead of failing
      }

      // Create a map of employee ID to status
      const statusMap: Record<string, string> = {}
      statuses?.forEach(status => {
        statusMap[status.employee_id] = status.status
      })

      // Combine employees with their statuses
      const employeesWithStatus = allEmployees.map(employee => ({
        ...employee,
        employee_event_status: statusMap[employee.id] ? [{
          status: statusMap[employee.id],
          event_id: eventId
        }] : []
      }))

      console.log(`Fetched ${employeesWithStatus.length} employees with status for event ${eventId}`)
      return employeesWithStatus
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch employees with status'
      console.warn('Error fetching employees with status:', errorMessage)
      // Always return empty array, never throw
      return []
    }
  }, [])

  // Update employee status for a specific event
  const updateEmployeeStatus = useCallback(async (employeeId: string, eventId: string, status: string) => {
    try {
      const response = await fetch('/api/employees/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: employeeId,
          event_id: eventId,
          status: status
        }),
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update employee status')
      }
      
      console.log(`Updated status for employee ${employeeId} in event ${eventId} to ${status}`)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update employee status'
      console.error('Error updating employee status:', errorMessage)
      throw err
    }
  }, [])

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeesForSelection,
    fetchEmployeesWithStatus,
    updateEmployeeStatus
  }
}