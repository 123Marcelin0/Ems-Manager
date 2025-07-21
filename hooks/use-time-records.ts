import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface TimeRecord {
  id: string
  employee_id: string
  event_id: string
  work_area_id?: string
  sign_in_time: string
  sign_out_time?: string
  total_hours?: number
  hourly_rate: number
  total_payment?: number
  status: 'active' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
}

interface EmployeeTimeRecord extends TimeRecord {
  employees: {
    id: string
    name: string
    user_id: string
    phone_number: string
  }
  events: {
    id: string
    title: string
    location: string
  }
  work_areas?: {
    id: string
    name: string
    location: string
  }
}

export function useTimeRecords() {
  const [timeRecords, setTimeRecords] = useState<EmployeeTimeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTimeRecords = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('time_records')
        .select(`
          *,
          employees (
            id,
            name,
            user_id,
            phone_number
          ),
          events (
            id,
            title,
            location
          ),
          work_areas (
            id,
            name,
            location
          )
        `)
        .order('sign_in_time', { ascending: false })

      if (error) throw error
      setTimeRecords(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch time records')
    } finally {
      setLoading(false)
    }
  }

  const createTimeRecord = async (recordData: Omit<TimeRecord, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('time_records')
        .insert([recordData])
        .select(`
          *,
          employees (
            id,
            name,
            user_id,
            phone_number
          ),
          events (
            id,
            title,
            location
          ),
          work_areas (
            id,
            name,
            location
          )
        `)
        .single()

      if (error) throw error
      setTimeRecords(prev => [data, ...prev])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create time record')
      throw err
    }
  }

  const updateTimeRecord = async (id: string, updates: Partial<TimeRecord>) => {
    try {
      const { data, error } = await supabase
        .from('time_records')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          employees (
            id,
            name,
            user_id,
            phone_number
          ),
          events (
            id,
            title,
            location
          ),
          work_areas (
            id,
            name,
            location
          )
        `)
        .single()

      if (error) throw error
      setTimeRecords(prev => prev.map(record => record.id === id ? data : record))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update time record')
      throw err
    }
  }

  const signOutEmployee = async (recordId: string, signOutTime?: string) => {
    try {
      const signOut = signOutTime || new Date().toISOString()
      
      const { data, error } = await supabase
        .from('time_records')
        .update({
          sign_out_time: signOut,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId)
        .select(`
          *,
          employees (
            id,
            name,
            user_id,
            phone_number
          ),
          events (
            id,
            title,
            location
          ),
          work_areas (
            id,
            name,
            location
          )
        `)
        .single()

      if (error) throw error
      setTimeRecords(prev => prev.map(record => record.id === recordId ? data : record))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out employee')
      throw err
    }
  }

  const getActiveTimeRecords = () => {
    return timeRecords.filter(record => record.status === 'active')
  }

  const getCompletedTimeRecords = () => {
    return timeRecords.filter(record => record.status === 'completed')
  }

  const getTimeRecordsByEvent = (eventId: string) => {
    return timeRecords.filter(record => record.event_id === eventId)
  }

  const getTimeRecordsByEmployee = (employeeId: string) => {
    return timeRecords.filter(record => record.employee_id === employeeId)
  }

  // Get time records for active events
  const getActiveEventTimeRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('time_records')
        .select(`
          *,
          employees (
            id,
            name,
            user_id,
            phone_number
          ),
          events (
            id,
            title,
            location
          ),
          work_areas (
            id,
            name,
            location
          )
        `)
        .eq('status', 'active')
        .order('sign_in_time', { ascending: false })

      if (error) throw error
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch active time records')
      return []
    }
  }

  useEffect(() => {
    fetchTimeRecords()
  }, [])

  // Set up real-time subscription for time records
  useEffect(() => {
    const subscription = supabase
      .channel('time-records-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'time_records'
      }, (payload) => {
        console.log('Time record change:', payload)
        
        if (payload.eventType === 'INSERT') {
          // Fetch the new record with relations
          supabase
            .from('time_records')
            .select(`
              *,
              employees (
                id,
                name,
                user_id,
                phone_number
              ),
              events (
                id,
                title,
                location
              ),
              work_areas (
                id,
                name,
                location
              )
            `)
            .eq('id', payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setTimeRecords(prev => [data, ...prev])
              }
            })
        } else if (payload.eventType === 'UPDATE') {
          // Fetch the updated record with relations
          supabase
            .from('time_records')
            .select(`
              *,
              employees (
                id,
                name,
                user_id,
                phone_number
              ),
              events (
                id,
                title,
                location
              ),
              work_areas (
                id,
                name,
                location
              )
            `)
            .eq('id', payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setTimeRecords(prev => prev.map(record => 
                  record.id === payload.new.id ? data : record
                ))
              }
            })
        } else if (payload.eventType === 'DELETE') {
          setTimeRecords(prev => prev.filter(record => record.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    timeRecords,
    loading,
    error,
    fetchTimeRecords,
    createTimeRecord,
    updateTimeRecord,
    signOutEmployee,
    getActiveTimeRecords,
    getCompletedTimeRecords,
    getTimeRecordsByEvent,
    getTimeRecordsByEmployee,
    getActiveEventTimeRecords
  }
} 