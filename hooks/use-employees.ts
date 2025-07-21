import { useState, useEffect } from 'react'
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

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeesForSelection
  }
}