import { useState, useEffect } from 'react'

export interface Template {
  id: string
  name: string
  template_type: 'event' | 'work_area' | 'combined'
  location?: string
  event_data: any
  work_areas_data: any
  created_by?: string
  created_at: string
  updated_at: string
}

export interface CreateTemplateData {
  name: string
  template_type: 'event' | 'work_area' | 'combined'
  location?: string
  event_data?: any
  work_areas_data?: any
}

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = async (filters?: { type?: string; location?: string }) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (filters?.type) params.append('type', filters.type)
      if (filters?.location) params.append('location', filters.location)
      
      const response = await fetch(`/api/templates?${params}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch templates')
      }

      setTemplates(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates')
    } finally {
      setLoading(false)
    }
  }

  const createTemplate = async (templateData: CreateTemplateData) => {
    try {
      setError(null)
      
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create template')
      }

      // Add the new template to the local state
      setTemplates(prev => [result.data, ...prev])
      return result.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template')
      throw err
    }
  }

  const createTemplateFromEvent = async (eventId: string, templateName: string, templateType: 'event' | 'work_area' | 'combined' = 'combined') => {
    try {
      setError(null)
      
      const response = await fetch('/api/templates/create-from-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: eventId,
          template_name: templateName,
          template_type: templateType,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create template from event')
      }

      // Add the new template to the local state
      setTemplates(prev => [result.data, ...prev])
      return result.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template from event')
      throw err
    }
  }

  const updateTemplate = async (id: string, updates: Partial<CreateTemplateData>) => {
    try {
      setError(null)
      
      const response = await fetch('/api/templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update template')
      }

      // Update the template in local state
      setTemplates(prev => prev.map(template => 
        template.id === id ? result.data : template
      ))
      return result.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template')
      throw err
    }
  }

  const deleteTemplate = async (id: string) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/templates?id=${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete template')
      }

      // Remove the template from local state
      setTemplates(prev => prev.filter(template => template.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template')
      throw err
    }
  }

  const getTemplatesByLocation = (location: string) => {
    return templates.filter(template => template.location === location)
  }

  const getTemplatesByType = (type: 'event' | 'work_area' | 'combined') => {
    return templates.filter(template => template.template_type === type)
  }

  // Load templates on mount
  useEffect(() => {
    fetchTemplates()
  }, [])

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    createTemplateFromEvent,
    updateTemplate,
    deleteTemplate,
    getTemplatesByLocation,
    getTemplatesByType,
  }
} 