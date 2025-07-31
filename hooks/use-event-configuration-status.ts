import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface ConfigurationStatus {
  eventId: string
  mitteilungenConfigured: boolean
  workAreasConfigured: boolean
  employeesAssigned: number
  totalEmployeesNeeded: number
  workAreasCount: number
  activeWorkAreasCount: number
  lastUpdated: string
  isFullyConfigured?: boolean
  configurationProgress?: number
}

export function useEventConfigurationStatus() {
  const [configurationStatuses, setConfigurationStatuses] = useState<Record<string, ConfigurationStatus>>({})
  const [loading, setLoading] = useState(false)

  // Fetch configuration status for a specific event
  const fetchEventConfigurationStatus = useCallback(async (eventId: string): Promise<ConfigurationStatus> => {
    try {
      console.log(`🔍 Fetching configuration status for event: ${eventId}`)
      
      // Check Mitteilungen configuration (employee status)
      const { data: employeeStatuses, error: statusError } = await supabase
        .from('employee_event_status')
        .select('status')
        .eq('event_id', eventId)
      
      if (statusError) throw statusError
      
      // Consider Mitteilungen configured if employees have been asked and some responded
      const mitteilungenConfigured = employeeStatuses && employeeStatuses.length > 0 && 
        employeeStatuses.some(status => ['available', 'selected', 'unavailable'].includes(status.status))
      
      // Check work areas configuration
      const { data: workAreas, error: workAreasError } = await supabase
        .from('work_areas')
        .select('id, is_active, max_capacity')
        .eq('event_id', eventId)
      
      if (workAreasError) throw workAreasError
      
      const workAreasConfigured = workAreas && workAreas.length > 0
      const activeWorkAreasCount = workAreas?.filter(area => area.is_active).length || 0
      
      // Check employee assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('work_assignments')
        .select('id')
        .eq('event_id', eventId)
        .eq('status', 'active')
      
      if (assignmentsError) throw assignmentsError
      
      const employeesAssigned = assignments?.length || 0
      
      // Get total capacity from work areas
      const totalCapacity = workAreas?.reduce((sum, area) => sum + (area.is_active ? area.max_capacity : 0), 0) || 0
      
      // Calculate configuration progress and completion status
      const isFullyConfigured = (mitteilungenConfigured || false) && 
                                (workAreasConfigured || false) && 
                                activeWorkAreasCount > 0 &&
                                employeesAssigned >= Math.max(1, totalCapacity * 0.8) // At least 80% staffed

      // Calculate overall progress percentage
      let progress = 0
      if (mitteilungenConfigured) progress += 40 // 40% for employee responses
      if (workAreasConfigured && activeWorkAreasCount > 0) progress += 30 // 30% for work areas
      if (employeesAssigned > 0) {
        const assignmentProgress = Math.min(1, employeesAssigned / Math.max(1, totalCapacity))
        progress += assignmentProgress * 30 // Up to 30% for assignments
      }

      const status: ConfigurationStatus = {
        eventId,
        mitteilungenConfigured: mitteilungenConfigured || false,
        workAreasConfigured: workAreasConfigured || false,
        employeesAssigned,
        totalEmployeesNeeded: totalCapacity,
        workAreasCount: workAreas?.length || 0,
        activeWorkAreasCount,
        lastUpdated: new Date().toISOString(),
        isFullyConfigured,
        configurationProgress: Math.round(progress)
      }
      
      // Update local state
      setConfigurationStatuses(prev => ({
        ...prev,
        [eventId]: status
      }))
      
      console.log(`✅ Configuration status for event ${eventId}:`, status)
      return status
      
    } catch (error) {
      console.error(`❌ Error fetching configuration status for event ${eventId}:`, error)
      
      // Return default status on error
      const defaultStatus: ConfigurationStatus = {
        eventId,
        mitteilungenConfigured: false,
        workAreasConfigured: false,
        employeesAssigned: 0,
        totalEmployeesNeeded: 0,
        workAreasCount: 0,
        activeWorkAreasCount: 0,
        lastUpdated: new Date().toISOString()
      }
      
      setConfigurationStatuses(prev => ({
        ...prev,
        [eventId]: defaultStatus
      }))
      
      return defaultStatus
    }
  }, [])

  return {
    configurationStatuses,
    loading,
    fetchEventConfigurationStatus
  }
}