"use client"

import { useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Users, Settings, Clock } from "lucide-react"
import { useEventConfigurationStatus } from "@/hooks/use-event-configuration-status"

interface EventConfigurationStatusProps {
  eventId: string
  compact?: boolean
  showDetails?: boolean
}

export function EventConfigurationStatus({ 
  eventId, 
  compact = false, 
  showDetails = true 
}: EventConfigurationStatusProps) {
  const { configurationStatuses, fetchEventConfigurationStatus } = useEventConfigurationStatus()
  
  const status = configurationStatuses[eventId]

  // Fetch status when component mounts or eventId changes
  useEffect(() => {
    if (eventId) {
      fetchEventConfigurationStatus(eventId)
    }
  }, [eventId, fetchEventConfigurationStatus])

  // Listen for configuration changes
  useEffect(() => {
    const handleConfigurationChange = (event: CustomEvent) => {
      if (event.detail?.eventId === eventId) {
        console.log('🔄 Configuration change detected, refreshing status for event:', eventId)
        fetchEventConfigurationStatus(eventId)
      }
    }

    const handleWorkAreasChange = () => {
      console.log('🔄 Work areas changed, refreshing status for event:', eventId)
      fetchEventConfigurationStatus(eventId)
    }

    const handleEmployeeStatusChange = (event: CustomEvent) => {
      if (event.detail?.eventId === eventId) {
        console.log('🔄 Employee status changed, refreshing status for event:', eventId)
        fetchEventConfigurationStatus(eventId)
      }
    }

    window.addEventListener('configurationChanged', handleConfigurationChange as EventListener)
    window.addEventListener('workAreasChanged', handleWorkAreasChange)
    window.addEventListener('employeeStatusChanged', handleEmployeeStatusChange as EventListener)

    return () => {
      window.removeEventListener('configurationChanged', handleConfigurationChange as EventListener)
      window.removeEventListener('workAreasChanged', handleWorkAreasChange)
      window.removeEventListener('employeeStatusChanged', handleEmployeeStatusChange as EventListener)
    }
  }, [eventId, fetchEventConfigurationStatus])

  if (!status) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Clock className="h-4 w-4 animate-spin" />
        <span className="text-sm">Lade Status...</span>
      </div>
    )
  }

  const getOverallStatus = () => {
    // Check if event is fully configured:
    // 1. Mitteilungen configured (employees asked/responded)
    // 2. Work areas configured (at least one active work area)
    // 3. All work area positions filled OR reasonable assignment coverage
    const isFullyConfigured = status.mitteilungenConfigured && 
                              status.workAreasConfigured && 
                              status.activeWorkAreasCount > 0 &&
                              (status.employeesAssigned >= status.totalEmployeesNeeded || 
                               (status.employeesAssigned > 0 && status.employeesAssigned >= status.totalEmployeesNeeded * 0.8))

    // Check if event has good progress
    const hasGoodProgress = status.mitteilungenConfigured && status.workAreasConfigured && status.employeesAssigned > 0

    if (isFullyConfigured) {
      return {
        label: "Vollständig konfiguriert",
        color: "bg-green-100 text-green-700 border-green-200",
        icon: CheckCircle,
        iconColor: "text-green-600"
      }
    } else if (hasGoodProgress) {
      return {
        label: "Fast vollständig",
        color: "bg-blue-100 text-blue-700 border-blue-200",
        icon: AlertCircle,
        iconColor: "text-blue-600"
      }
    } else if (status.mitteilungenConfigured || status.workAreasConfigured) {
      return {
        label: "Teilweise konfiguriert",
        color: "bg-yellow-100 text-yellow-700 border-yellow-200",
        icon: AlertCircle,
        iconColor: "text-yellow-600"
      }
    } else {
      return {
        label: "Nicht konfiguriert",
        color: "bg-gray-100 text-gray-700 border-gray-200",
        icon: Settings,
        iconColor: "text-gray-500"
      }
    }
  }

  const overallStatus = getOverallStatus()
  const StatusIcon = overallStatus.icon

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <StatusIcon className={`h-4 w-4 ${overallStatus.iconColor}`} />
        <Badge className={`text-xs font-medium ${overallStatus.color}`}>
          {overallStatus.label}
        </Badge>
        {/* Show progress percentage for partially configured events */}
        {status.configurationProgress !== undefined && !status.isFullyConfigured && (
          <span className="text-xs text-gray-500">
            ({status.configurationProgress}%)
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Overall Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-4 w-4 ${overallStatus.iconColor}`} />
          <Badge className={`text-xs font-medium ${overallStatus.color}`}>
            {overallStatus.label}
          </Badge>
        </div>
        {/* Show progress or completion indicator */}
        {status.isFullyConfigured ? (
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-600">Bereit</span>
          </div>
        ) : status.configurationProgress !== undefined && (
          <span className="text-xs font-medium text-gray-600">
            {status.configurationProgress}%
          </span>
        )}
      </div>

      {/* Detailed Status */}
      {showDetails && (
        <div className="space-y-2">
          {/* Mitteilungen Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                status.mitteilungenConfigured ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className="text-sm text-gray-600">Mitarbeiter angefragt</span>
            </div>
            <span className={`text-xs font-medium ${
              status.mitteilungenConfigured ? 'text-green-600' : 'text-gray-500'
            }`}>
              {status.mitteilungenConfigured ? '✓' : '○'}
            </span>
          </div>

          {/* Work Areas Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                status.workAreasConfigured ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className="text-sm text-gray-600">Arbeitsbereiche</span>
            </div>
            <span className={`text-xs font-medium ${
              status.activeWorkAreasCount > 0 ? 'text-green-600' : 'text-gray-500'
            }`}>
              {status.activeWorkAreasCount} konfiguriert
            </span>
          </div>

          {/* Employee Assignment Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3 text-gray-400" />
              <span className="text-sm text-gray-600">Mitarbeiterverteilung</span>
            </div>
            <span className={`text-xs font-medium ${
              status.employeesAssigned >= status.totalEmployeesNeeded ? 'text-green-600' : 
              status.employeesAssigned > 0 ? 'text-yellow-600' : 'text-gray-500'
            }`}>
              {status.employeesAssigned > 0 ? 
                `${Math.round((status.employeesAssigned / Math.max(status.totalEmployeesNeeded, 1)) * 100)}% verfügbar` :
                '0% verfügbar'
              }
            </span>
          </div>
        </div>
      )}
    </div>
  )
}