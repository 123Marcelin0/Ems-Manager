"use client"

import { useWorkAreaAssignment } from "@/hooks/use-work-area-assignment"
import { AdvancedSettings } from "./advanced-settings"
import { EventSelection } from "./work-area/event-selection"
import { WorkAreaManagement } from "./work-area/work-area-management"
import { WorkAreaOverview } from "./work-area/work-area-overview"
import { useEventContext } from "@/hooks/use-event-context"
import { useEventWorkAreaSync } from "@/hooks/use-event-work-area-sync"
import { useEffect } from "react"

interface WorkAreaAssignmentProps {
  onBack?: () => void
  activeView?: string
  setActiveView?: (view: string) => void
  onNavigateToDashboard?: () => void
  onAddNewEvent?: (eventData: any) => void
  availableEmployees?: any[]
  onEmployeeStatusChange?: (employeeId: string, newStatus: string) => void
}

export function WorkAreaAssignment({ onBack, activeView = "event", setActiveView, onNavigateToDashboard, onAddNewEvent, availableEmployees = [], onEmployeeStatusChange }: WorkAreaAssignmentProps) {
  // Use global event context
  const { selectedEvent } = useEventContext()
  
  // Use event work area sync for real-time synchronization
  const { 
    syncedWorkAreas, 
    assignEmployeeToWorkArea, 
    removeEmployeeFromWorkArea,
    forceRefresh 
  } = useEventWorkAreaSync()
  
  const {
    // State
    workAreas,
    showAdvancedSettings,
    searchQuery,
    selectedEmployees,
    availableEmployees: hookAvailableEmployees,
    isLoading,

    // Setters
    setShowAdvancedSettings,
    setSelectedEmployees,
    setFilteredEmployees,

    // Handlers
    getSelectedEmployeesForDisplay,
    handleAssignEmployee,
    handleRemoveEmployee,
    handleEmployeeSelect,
    refreshEmployeeStatuses,
  } = useWorkAreaAssignment()

  // Transform Mitteilungen employees to work area format, filtering by status
  const mitteilungenAvailableEmployees = availableEmployees
    .filter(emp => emp.status === "available" || emp.status === "selected") // Include selected employees too
    .map(emp => {
      // Determine role from notes with proper typing
      let role: "allrounder" | "versorger" | "verkauf" | "manager" | "essen" = 'allrounder'
      if (emp.notes?.includes('Allrounder')) role = 'allrounder'
      else if (emp.notes?.includes('Versorger')) role = 'versorger'
      else if (emp.notes?.includes('Verkauf')) role = 'verkauf'
      else if (emp.notes?.includes('Manager')) role = 'manager'
      else if (emp.notes?.includes('Essen')) role = 'essen'
      
      // Map Mitteilungen status to work area availability
      let availability: "available" | "unavailable" | "assigned" = "available"
      if (emp.status === "selected") {
        availability = "assigned"
      } else if (emp.status === "unavailable") {
        availability = "unavailable"
      }
      
      return {
        id: emp.id,
        name: emp.name,
        role: role,
        skills: [], 
        availability
      }
    })

  // Update filtered employees when available employees change or when real employees are loaded
  useEffect(() => {
    // Use real employees from hook if available, otherwise use Mitteilungen employees
    const employeesToUse = hookAvailableEmployees.length > 0 ? hookAvailableEmployees : mitteilungenAvailableEmployees
    setFilteredEmployees(employeesToUse.filter(emp => emp.availability === "available"))
  }, [availableEmployees, hookAvailableEmployees, setFilteredEmployees])

  // Refresh employee statuses when entering the overview section
  useEffect(() => {
    if (activeView === "ubersicht" && selectedEvent?.id) {
      console.log('Work Area Assignment: Entering overview section, refreshing employee statuses...')
      refreshEmployeeStatuses()
    }
  }, [activeView, selectedEvent?.id, refreshEmployeeStatuses])

  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedEmployees([])
    setFilteredEmployees(mitteilungenAvailableEmployees)
  }

  // Enhanced assign employee handler that also updates parent status and database
  const handleAssignEmployeeEnhanced = async (workAreaId: string, employee: any) => {
    try {
      // Update local state first for immediate UI feedback
      handleAssignEmployee(workAreaId, employee)
      
      // Update parent status
      if (onEmployeeStatusChange) {
        onEmployeeStatusChange(employee.id, "selected")
      }
      
      // Update database if we have a selected event
      if (selectedEvent?.id) {
        await assignEmployeeToWorkArea(employee.id, workAreaId, selectedEvent.id)
        console.log(`✅ Employee ${employee.name} assigned to work area ${workAreaId}`)
      }
    } catch (error) {
      console.error('Failed to assign employee:', error)
      // Optionally revert local state on error
    }
  }

  // Enhanced remove employee handler that also updates parent status and database
  const handleRemoveEmployeeEnhanced = async (workAreaId: string, employeeId: string) => {
    try {
      // Update local state first for immediate UI feedback
      handleRemoveEmployee(workAreaId, employeeId)
      
      // Update parent status
      if (onEmployeeStatusChange) {
        onEmployeeStatusChange(employeeId, "available")
      }
      
      // Update database if we have a selected event
      if (selectedEvent?.id) {
        await removeEmployeeFromWorkArea(employeeId, selectedEvent.id)
        console.log(`✅ Employee removed from work area`)
      }
    } catch (error) {
      console.error('Failed to remove employee:', error)
      // Optionally revert local state on error
    }
  }

  // Override the display function to use real employees or Mitteilungen employees
  const getSelectedEmployeesForDisplayEnhanced = () => {
    const employeesToUse = hookAvailableEmployees.length > 0 ? hookAvailableEmployees : mitteilungenAvailableEmployees
    const availableEmployeesToShow = employeesToUse.filter(emp => emp.availability === "available")
    
    if (selectedEmployees.length === 0) {
      return availableEmployeesToShow
    }
    return availableEmployeesToShow.filter((emp: any) => selectedEmployees.includes(emp.id))
  }

  if (showAdvancedSettings) {
    return <AdvancedSettings onBack={() => setShowAdvancedSettings(false)} />
  }

  const handleEventSave = (eventData: any) => {
    console.log('Event saved:', eventData)
    // TODO: Save event to database
    
    if (eventData.askEmployeesNow) {
      // If user wants to ask employees now, add event and navigate to dashboard
      console.log('Navigate to dashboard for employee asking')
      onAddNewEvent?.(eventData)
      onNavigateToDashboard?.()
    } else {
      // If user wants to ask later, stay in event view
      setActiveView?.("event")
    }
  }

  // Render different views based on activeView
  const renderContent = () => {
    switch (activeView) {
      case "event":
        return (
          <EventSelection
            setActiveView={setActiveView}
          />
        )
      case "arbeitsbereiche":
        return <WorkAreaManagement 
          key={`work-areas-${selectedEvent?.id}-${activeView}`} // Force remount when event or view changes
          onContinue={() => setActiveView?.("ubersicht")} 
          onWorkAreasSaved={() => {
            // Work areas saved - force refresh to sync latest data
            console.log('Work areas saved, refreshing sync data...')
            forceRefresh()
            refreshEmployeeStatuses()
          }}
        />
      case "ubersicht":
      default:
        return (
          <WorkAreaOverview
            workAreas={workAreas}
            availableEmployees={hookAvailableEmployees.length > 0 ? hookAvailableEmployees : mitteilungenAvailableEmployees} // Use real employees if available
            selectedEmployees={selectedEmployees}
            searchQuery={searchQuery}
            getSelectedEmployeesForDisplay={getSelectedEmployeesForDisplayEnhanced}
            onAssignEmployee={handleAssignEmployeeEnhanced}
            onRemoveEmployee={handleRemoveEmployeeEnhanced}
            onEmployeeSelect={handleEmployeeSelect}
            onClearSelection={handleClearSelection}
            onBack={onBack}
            setActiveView={setActiveView}
          />
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Content Area */}
      {renderContent()}
    </div>
  )
}