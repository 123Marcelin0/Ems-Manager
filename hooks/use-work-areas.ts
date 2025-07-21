import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface WorkArea {
  id: string
  event_id: string
  name: string
  location: string
  description?: string
  max_capacity: number
  current_assigned: number
  is_active: boolean
  priority: 'low' | 'medium' | 'high'
  role_requirements: Record<string, number>
  required_skills: string[]
  color_theme: string
  position_order: number
  created_at: string
  updated_at: string
  created_by?: string
  // Extended fields from view
  event_title?: string
  event_date?: string
  assignments?: Array<{
    id: string
    employee_id: string
    employee_name: string
    employee_role: string
    assigned_role?: string
    assigned_at: string
    status: string
  }>
}

interface CreateWorkAreaData {
  event_id: string
  name: string
  location: string
  description?: string
  max_capacity: number
  priority?: 'low' | 'medium' | 'high'
  role_requirements: Record<string, number>
  required_skills?: string[]
  color_theme?: string
  position_order?: number
  is_active?: boolean
}

interface UpdateWorkAreaData {
  name?: string
  location?: string
  description?: string
  max_capacity?: number
  priority?: 'low' | 'medium' | 'high'
  role_requirements?: Record<string, number>
  required_skills?: string[]
  color_theme?: string
  position_order?: number
  is_active?: boolean
}

export function useWorkAreas() {
  const [workAreas, setWorkAreas] = useState<WorkArea[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Helper function to get standard headers
  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
    }
  }

  // Fetch work areas for a specific event with full details
  const fetchWorkAreasByEvent = useCallback(async (eventId: string, includeAssignments = true) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`🔍 Fetching work areas for event: ${eventId}`)
      
      const endpoint = includeAssignments 
        ? `/api/work-areas/detailed?eventId=${eventId}`
        : `/api/work-areas?eventId=${eventId}`
      
      const headers = getHeaders()
      const response = await fetch(endpoint, { headers })
      
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
      
      console.log(`✅ Fetched ${result.data?.length || 0} work areas`)
      setWorkAreas(result.data || [])
      return result.data || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch work areas'
      console.error('❌ Error fetching work areas:', errorMessage)
      setError(errorMessage)
      toast({
        title: "Fehler beim Laden",
        description: "Arbeitsbereiche konnten nicht geladen werden.",
        variant: "destructive"
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Fetch all work areas (for status checking across events)
  const fetchAllWorkAreas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching all work areas')
      
      const headers = getHeaders()
      const response = await fetch('/api/work-areas/detailed', { headers })
      
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
      
      console.log(`✅ Fetched ${result.data?.length || 0} work areas`)
      setWorkAreas(result.data || [])
      return result.data || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch work areas'
      console.error('❌ Error fetching all work areas:', errorMessage)
      setError(errorMessage)
      toast({
        title: "Fehler beim Laden",
        description: "Arbeitsbereiche konnten nicht geladen werden.",
        variant: "destructive"
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Create a new work area
  const createWorkArea = async (workAreaData: CreateWorkAreaData) => {
    try {
      setSaving(true)
      setError(null)
      
      console.log('🔨 Creating work area:', workAreaData)
      
      const headers = getHeaders()
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
      
      console.log('✅ Work area created successfully:', result.data)
      
      toast({
        title: "Arbeitsbereich erstellt",
        description: `"${result.data.name}" wurde erfolgreich erstellt.`,
      })
      
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create work area'
      console.error('❌ Error creating work area:', errorMessage)
      setError(errorMessage)
      toast({
        title: "Fehler beim Erstellen",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    } finally {
      setSaving(false)
    }
  }

  // Update an existing work area
  const updateWorkArea = async (id: string, updates: UpdateWorkAreaData) => {
    try {
      setSaving(true)
      setError(null)
      
      console.log('🔧 Updating work area:', id, updates)
      
      // Store original for potential rollback
      const originalArea = workAreas.find(area => area.id === id)
      
      // Optimistic update - update local state immediately
      setWorkAreas(prev => prev.map(area => 
        area.id === id ? { ...area, ...updates, updated_at: new Date().toISOString() } : area
      ))
      
      const headers = getHeaders()
      const response = await fetch(`/api/work-areas/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      })
      
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        // Revert optimistic update on error
        if (originalArea) {
          setWorkAreas(prev => prev.map(area => 
            area.id === id ? originalArea : area
          ))
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
          setWorkAreas(prev => prev.map(area => 
            area.id === id ? originalArea : area
          ))
        }
        throw new Error(result.error || 'Failed to update work area')
      }
      
      // Update with server response to ensure consistency
      setWorkAreas(prev => prev.map(area => 
        area.id === id ? result.data : area
      ))
      
      console.log('✅ Work area updated successfully:', result.data)
      
      toast({
        title: "Arbeitsbereich aktualisiert",
        description: `"${result.data.name}" wurde erfolgreich aktualisiert.`,
      })
      
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update work area'
      console.error('❌ Error updating work area:', errorMessage)
      setError(errorMessage)
      toast({
        title: "Fehler beim Aktualisieren",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    } finally {
      setSaving(false)
    }
  }

  // Delete a work area
  const deleteWorkArea = async (id: string) => {
    try {
      setSaving(true)
      setError(null)
      
      console.log('🗑️ Deleting work area:', id)
      
      // Store original area for potential rollback
      const originalArea = workAreas.find(area => area.id === id)
      
      if (!originalArea) {
        throw new Error('Work area not found')
      }
      
      // Check if work area has assignments
      if (originalArea.current_assigned > 0) {
        const confirmDelete = window.confirm(
          `Der Arbeitsbereich "${originalArea.name}" hat ${originalArea.current_assigned} zugewiesene Mitarbeiter. Möchten Sie ihn trotzdem löschen?`
        )
        if (!confirmDelete) {
          return false
        }
      }
      
      // Optimistic update - remove from local state immediately
      setWorkAreas(prev => prev.filter(area => area.id !== id))
      
      const headers = getHeaders()
      const response = await fetch(`/api/work-areas/${id}`, {
        method: 'DELETE',
        headers,
      })
      
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        // Revert optimistic update on error
        setWorkAreas(prev => [...prev, originalArea])
        
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
        setWorkAreas(prev => [...prev, originalArea])
        throw new Error(result.error || 'Failed to delete work area')
      }
      
      console.log('✅ Work area deleted successfully')
      
      toast({
        title: "Arbeitsbereich gelöscht",
        description: `"${originalArea.name}" wurde erfolgreich gelöscht.`,
      })
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete work area'
      console.error('❌ Error deleting work area:', errorMessage)
      setError(errorMessage)
      toast({
        title: "Fehler beim Löschen",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    } finally {
      setSaving(false)
    }
  }

  // Save multiple work areas for an event (batch operation)
  const saveWorkAreasForEvent = async (eventId: string, workAreasData: CreateWorkAreaData[]) => {
    try {
      setSaving(true)
      setError(null)
      
      console.log(`💾 Saving ${workAreasData.length} work areas for event:`, eventId)
      
      const headers = getHeaders()
      const response = await fetch('/api/work-areas/batch', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          event_id: eventId,
          work_areas: workAreasData
        }),
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
        throw new Error(result.error || 'Failed to save work areas')
      }
      
      // Update local state with saved areas
      setWorkAreas(prev => {
        // Remove existing areas for this event and add new ones
        const filtered = prev.filter(area => area.event_id !== eventId)
        return [...filtered, ...result.data]
      })
      
      console.log(`✅ Successfully saved ${result.data.length} work areas for event: ${eventId}`)
      
      toast({
        title: "Arbeitsbereiche gespeichert",
        description: `${result.data.length} Arbeitsbereiche wurden erfolgreich gespeichert.`,
      })
      
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save work areas'
      console.error('❌ Error saving work areas for event:', errorMessage)
      setError(errorMessage)
      toast({
        title: "Fehler beim Speichern",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    } finally {
      setSaving(false)
    }
  }

  // Duplicate work area
  const duplicateWorkArea = async (id: string) => {
    try {
      const originalArea = workAreas.find(area => area.id === id)
      if (!originalArea) {
        throw new Error('Work area not found')
      }

      const duplicateData: CreateWorkAreaData = {
        event_id: originalArea.event_id,
        name: `${originalArea.name} (Kopie)`,
        location: originalArea.location,
        description: originalArea.description,
        max_capacity: originalArea.max_capacity,
        priority: originalArea.priority,
        role_requirements: { ...originalArea.role_requirements },
        required_skills: [...originalArea.required_skills],
        color_theme: originalArea.color_theme,
        position_order: originalArea.position_order + 1,
        is_active: originalArea.is_active
      }

      return await createWorkArea(duplicateData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate work area'
      console.error('❌ Error duplicating work area:', errorMessage)
      throw err
    }
  }

  // Reorder work areas
  const reorderWorkAreas = async (eventId: string, orderedIds: string[]) => {
    try {
      setSaving(true)
      setError(null)
      
      console.log('🔄 Reordering work areas for event:', eventId)
      
      const headers = getHeaders()
      const response = await fetch('/api/work-areas/reorder', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          event_id: eventId,
          ordered_ids: orderedIds
        }),
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to reorder work areas')
      }
      
      // Update local state with new order
      setWorkAreas(prev => prev.map(area => {
        const newOrder = orderedIds.indexOf(area.id)
        return newOrder >= 0 ? { ...area, position_order: newOrder } : area
      }))
      
      console.log('✅ Work areas reordered successfully')
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder work areas'
      console.error('❌ Error reordering work areas:', errorMessage)
      setError(errorMessage)
      throw err
    } finally {
      setSaving(false)
    }
  }

  // Toggle work area active status
  const toggleWorkAreaStatus = async (id: string) => {
    try {
      const area = workAreas.find(a => a.id === id)
      if (!area) {
        throw new Error('Work area not found')
      }

      return await updateWorkArea(id, { is_active: !area.is_active })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle work area status'
      console.error('❌ Error toggling work area status:', errorMessage)
      throw err
    }
  }

  // Real-time subscription for work areas and assignments
  useEffect(() => {
    const workAreasSubscription = supabase
      .channel('work-areas-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'work_areas'
      }, (payload) => {
        console.log('🔄 Work area change detected:', payload.eventType, payload)
        
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
            area.id === payload.new.id ? { ...area, ...payload.new } : area
          ))
        } else if (payload.eventType === 'DELETE') {
          setWorkAreas(prev => prev.filter(area => area.id !== payload.old.id))
        }
      })
      .subscribe()

    const assignmentsSubscription = supabase
      .channel('work-assignments-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'work_assignments'
      }, (payload) => {
        console.log('🔄 Work assignment change detected:', payload.eventType, payload)
        
        // Update current_assigned count when assignments change
        if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
          const workAreaId = payload.eventType === 'INSERT' ? payload.new.work_area_id : payload.old.work_area_id
          
          setWorkAreas(prev => prev.map(area => {
            if (area.id === workAreaId) {
              const newCount = payload.eventType === 'INSERT' 
                ? area.current_assigned + 1 
                : Math.max(0, area.current_assigned - 1)
              return { ...area, current_assigned: newCount }
            }
            return area
          }))
        } else if (payload.eventType === 'UPDATE') {
          // Handle work area changes in assignments
          if (payload.old.work_area_id !== payload.new.work_area_id) {
            setWorkAreas(prev => prev.map(area => {
              if (area.id === payload.old.work_area_id) {
                return { ...area, current_assigned: Math.max(0, area.current_assigned - 1) }
              } else if (area.id === payload.new.work_area_id) {
                return { ...area, current_assigned: area.current_assigned + 1 }
              }
              return area
            }))
          }
        }
      })
      .subscribe()

    return () => {
      workAreasSubscription.unsubscribe()
      assignmentsSubscription.unsubscribe()
    }
  }, [])

  return {
    // State
    workAreas,
    loading,
    saving,
    error,
    
    // Basic CRUD operations
    fetchWorkAreasByEvent,
    fetchAllWorkAreas,
    createWorkArea,
    updateWorkArea,
    deleteWorkArea,
    
    // Batch operations
    saveWorkAreasForEvent,
    
    // Advanced operations
    duplicateWorkArea,
    reorderWorkAreas,
    toggleWorkAreaStatus,
  }
} 