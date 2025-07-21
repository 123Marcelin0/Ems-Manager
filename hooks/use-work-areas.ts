import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface WorkArea {
  id: string
  event_id: string
  name: string
  location: string
  max_capacity: number
  is_active: boolean
  role_requirements: Record<string, number>
  created_at: string
}

export function useWorkAreas() {
  const [workAreas, setWorkAreas] = useState<WorkArea[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helper function to get authenticated headers
  const getAuthHeaders = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        throw new Error('Authentication required. Please log in.')
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      } else {
        throw new Error('Authentication required. Please log in.')
      }
      
      return headers
    } catch (error) {
      console.error('Error in getAuthHeaders:', error)
      throw new Error('Authentication required. Please log in.')
    }
  }

  // Fetch work areas for a specific event
  const fetchWorkAreasByEvent = useCallback(async (eventId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`Fetching work areas for event: ${eventId}`)
      
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/work-areas?eventId=${eventId}`, {
        headers
      })
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        let errorMsg = '';
        if (contentType && contentType.includes('application/json')) {
          const errJson = await response.json();
          errorMsg = errJson.error || JSON.stringify(errJson);
        } else {
          errorMsg = await response.text();
        }
        throw new Error(errorMsg || 'Request failed');
      }
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server did not return JSON');
      }
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch work areas')
      }
      
      console.log(`Fetched ${result.data?.length || 0} work areas`)
      setWorkAreas(result.data || [])
      return result.data || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch work areas'
      console.error('Error fetching work areas:', errorMessage)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch all work areas (for status checking across events)
  const fetchAllWorkAreas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const headers = await getAuthHeaders()
      const response = await fetch('/api/work-areas', { headers })
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        let errorMsg = '';
        if (contentType && contentType.includes('application/json')) {
          const errJson = await response.json();
          errorMsg = errJson.error || JSON.stringify(errJson);
        } else {
          errorMsg = await response.text();
        }
        throw new Error(errorMsg || 'Request failed');
      }
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server did not return JSON');
      }
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch work areas')
      }
      
      setWorkAreas(result.data || [])
      return result.data || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch work areas'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Create a new work area
  const createWorkArea = async (workAreaData: Omit<WorkArea, 'id' | 'created_at'>) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Creating work area:', workAreaData)
      
      const headers = await getAuthHeaders()
      const response = await fetch('/api/work-areas', {
        method: 'POST',
        headers,
        body: JSON.stringify(workAreaData),
      })
      
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        let errorMsg = '';
        if (contentType && contentType.includes('application/json')) {
          const errJson = await response.json();
          errorMsg = errJson.error || JSON.stringify(errJson);
        } else {
          errorMsg = await response.text();
        }
        throw new Error(errorMsg || 'Request failed');
      }
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server did not return JSON');
      }
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create work area')
      }
      
      // Optimistic update - add to local state immediately
      setWorkAreas(prev => [...prev, result.data])
      console.log('Work area created successfully:', result.data)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create work area'
      console.error('Error creating work area:', errorMessage)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Update an existing work area
  const updateWorkArea = async (id: string, updates: Partial<Omit<WorkArea, 'id' | 'created_at'>>) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Updating work area:', id, updates)
      
      // Optimistic update - update local state immediately
      setWorkAreas(prev => prev.map(area => 
        area.id === id ? { ...area, ...updates } : area
      ))
      
      const response = await fetch(`/api/work-areas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        // Revert optimistic update on error
        setWorkAreas(prev => prev.map(area => 
          area.id === id ? { ...area, ...updates } : area
        ))
        
        let errorMsg = '';
        if (contentType && contentType.includes('application/json')) {
          const errJson = await response.json();
          errorMsg = errJson.error || JSON.stringify(errJson);
        } else {
          errorMsg = await response.text();
        }
        throw new Error(errorMsg || 'Request failed');
      }
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server did not return JSON');
      }
      const result = await response.json()
      
      if (!result.success) {
        // Revert optimistic update on error
        setWorkAreas(prev => prev.map(area => 
          area.id === id ? { ...area, ...updates } : area
        ))
        throw new Error(result.error || 'Failed to update work area')
      }
      
      // Update with server response to ensure consistency
      setWorkAreas(prev => prev.map(area => 
        area.id === id ? result.data : area
      ))
      
      console.log('Work area updated successfully:', result.data)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update work area'
      console.error('Error updating work area:', errorMessage)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Delete a work area
  const deleteWorkArea = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Deleting work area:', id)
      
      // Store original area for potential rollback
      const originalArea = workAreas.find(area => area.id === id)
      
      // Optimistic update - remove from local state immediately
      setWorkAreas(prev => prev.filter(area => area.id !== id))
      
      const response = await fetch(`/api/work-areas/${id}`, {
        method: 'DELETE',
      })
      
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        // Revert optimistic update on error
        if (originalArea) {
          setWorkAreas(prev => [...prev, originalArea])
        }
        
        let errorMsg = '';
        if (contentType && contentType.includes('application/json')) {
          const errJson = await response.json();
          errorMsg = errJson.error || JSON.stringify(errJson);
        } else {
          errorMsg = await response.text();
        }
        throw new Error(errorMsg || 'Request failed');
      }
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server did not return JSON');
      }
      const result = await response.json()
      
      if (!result.success) {
        // Revert optimistic update on error
        if (originalArea) {
          setWorkAreas(prev => [...prev, originalArea])
        }
        throw new Error(result.error || 'Failed to delete work area')
      }
      
      console.log('Work area deleted successfully')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete work area'
      console.error('Error deleting work area:', errorMessage)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Save multiple work areas for an event (complete replacement - one configuration per event)
  const saveWorkAreasForEvent = async (eventId: string, workAreasData: ({ id?: string; name: string; location: string; max_capacity: number; role_requirements: Record<string, number>; is_active: boolean })[]) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`🔍 Work Areas Hook: Saving ${workAreasData.length} work areas for event:`, eventId)
      
      const existingAreas = workAreas.filter(area => area.event_id === eventId)
      
      // ALWAYS delete ALL existing work areas for this event first (complete replacement)
      if (existingAreas.length > 0) {
        console.log(`🔍 Work Areas Hook: Deleting ${existingAreas.length} existing work areas for event:`, eventId)
        for (const existingArea of existingAreas) {
          try {
            await deleteWorkArea(existingArea.id)
          } catch (deleteError) {
            console.warn(`⚠️ Work Areas Hook: Failed to delete area ${existingArea.id}:`, deleteError)
            // Continue with other deletions even if one fails
          }
        }
        // Clear the existing areas from our local state tracking
        setWorkAreas(prev => prev.filter(area => area.event_id !== eventId))
      }
      
      const resultAreas: WorkArea[] = []
      
      // Create ALL new work areas (complete replacement)
      console.log(`🔍 Work Areas Hook: Creating ${workAreasData.length} new work areas for event:`, eventId)
      for (const areaData of workAreasData) {
        try {
          const createdArea = await createWorkArea({
            name: areaData.name,
            location: areaData.location,
            max_capacity: areaData.max_capacity,
            role_requirements: areaData.role_requirements,
            is_active: areaData.is_active,
            event_id: eventId
          })
          resultAreas.push(createdArea)
          console.log(`✅ Work Areas Hook: Created work area "${areaData.name}"`)
        } catch (createError) {
          console.error(`❌ Work Areas Hook: Failed to create work area "${areaData.name}":`, createError)
          // Re-throw the error to stop the process
          throw new Error(`Failed to create work area "${areaData.name}": ${createError instanceof Error ? createError.message : 'Unknown error'}`)
        }
      }
      
      console.log(`✅ Work Areas Hook: Successfully saved ${resultAreas.length} work areas for event: ${eventId}`)
      
      // Update our local state with all the new areas
      setWorkAreas(prev => prev.filter(area => area.event_id !== eventId).concat(resultAreas))
      
      return resultAreas
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save work areas'
      console.error('❌ Work Areas Hook: Error saving work areas for event:', errorMessage)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Real-time subscription for work areas
  useEffect(() => {
    const subscription = supabase
      .channel('work-areas-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'work_areas'
      }, (payload) => {
        console.log('Work area change detected:', payload.eventType, payload)
        
        if (payload.eventType === 'INSERT') {
          setWorkAreas(prev => {
            // Avoid duplicates
            if (prev.some(area => area.id === payload.new.id)) {
              return prev
            }
            return [...prev, payload.new as WorkArea]
          })
        } else if (payload.eventType === 'UPDATE') {
          setWorkAreas(prev => prev.map(area => 
            area.id === payload.new.id ? payload.new as WorkArea : area
          ))
        } else if (payload.eventType === 'DELETE') {
          setWorkAreas(prev => prev.filter(area => area.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    workAreas,
    loading,
    error,
    fetchWorkAreasByEvent,
    fetchAllWorkAreas,
    createWorkArea,
    updateWorkArea,
    deleteWorkArea,
    saveWorkAreasForEvent
  }
} 