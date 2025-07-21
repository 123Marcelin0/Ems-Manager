"use client"

import { useWorkAreaAssignment } from "@/hooks/use-work-area-assignment"
import { AdvancedSettings } from "./advanced-settings"
import { EventSelection } from "./work-area/event-selection"
import { WorkAreaManagement } from "./work-area/work-area-management"
import { WorkAreaOverview } from "./work-area/work-area-overview"
import { useEventContext } from "@/hooks/use-event-context"
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
  
  const {
    // State
    workAreas,
    showAdvancedSettings,
    searchQuery,
    selectedEmployees,
    availableEmployees: hookAvailableEmployees,

    // Setters
    setShowAdvancedSettings,
    setSelectedEmployees,
    setFilteredEmployees,

    // Handlers
    getSelectedEmployeesForDisplay,
    handleAssignEmployee,
    handleRemoveEmployee,
    handleEmployeeSelect,
  } = useWorkAreaAssignment()

  // Override hook's available employees with employees from Mitteilungen table (only available ones)
  const mitteilungenAvailableEmployees = availableEmployees
    .filter(emp => emp.status === "available")
    .map(emp => {
      // Determine role from notes with proper typing
      let role: "allrounder" | "versorger" | "verkauf" | "manager" | "essen" = 'allrounder'
      if (emp.notes?.includes('Allrounder')) role = 'allrounder'
      else if (emp.notes?.includes('Versorger')) role = 'versorger'
      else if (emp.notes?.includes('Verkauf')) role = 'verkauf'
      else if (emp.notes?.includes('Manager')) role = 'manager'
      else if (emp.notes?.includes('Essen')) role = 'essen'
      
      return {
        id: emp.id,
        name: emp.name,
        role: role,
        skills: [], 
        availability: "available" as const
      }
    })

  // Update filtered employees when available employees change
  useEffect(() => {
    setFilteredEmployees(mitteilungenAvailableEmployees)
  }, [availableEmployees, setFilteredEmployees])

  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedEmployees([])
    setFilteredEmployees(mitteilungenAvailableEmployees)
  }

  // Enhanced assign employee handler that also updates parent status
  const handleAssignEmployeeEnhanced = (workAreaId: string, employee: any) => {
    handleAssignEmployee(workAreaId, employee)
    if (onEmployeeStatusChange) {
      onEmployeeStatusChange(employee.id, "selected")
    }
  }

  // Enhanced remove employee handler that also updates parent status
  const handleRemoveEmployeeEnhanced = (workAreaId: string, employeeId: string) => {
    handleRemoveEmployee(workAreaId, employeeId)
    if (onEmployeeStatusChange) {
      onEmployeeStatusChange(employeeId, "available")
    }
  }

  // Override the display function to use Mitteilungen employees
  const getSelectedEmployeesForDisplayEnhanced = () => {
    if (selectedEmployees.length === 0) {
      return mitteilungenAvailableEmployees
    }
    return mitteilungenAvailableEmployees.filter((emp: any) => selectedEmployees.includes(emp.id))
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
          onContinue={() => setActiveView?.("ubersicht")} 
          onWorkAreasSaved={() => {
            // Work areas saved - navigation will be unlocked via event listener
            console.log('Work areas saved, navigation will update automatically')
          }}
        />
      case "ubersicht":
      default:
        return (
          <WorkAreaOverview
            workAreas={workAreas}
            availableEmployees={mitteilungenAvailableEmployees} // Use employees from Mitteilungen table
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