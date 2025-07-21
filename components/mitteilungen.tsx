"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { QuickActions } from "./quick-actions"
import { EmployeeSection } from "./employee-section"
import { EventSelector } from "./event-selector"
import { useEventContext } from "@/hooks/use-event-context"


interface MitteilungenProps {
  employees: any[]
  activeFilter: string
  setActiveFilter: (filter: string) => void
  stats: any
  requiredEmployees: string
  setRequiredEmployees: (count: string) => void
  onRandomSelection: () => void
  onResetAll: () => void
  onEmployeesNeededChange: (eventId: string, needed: number) => void
  onEmployeesToAskChange: (eventId: string, toAsk: number) => void
  onStatusChange: (employeeId: string, status: string) => void
  authorizationMode: boolean
  selectedForAuth: string[]
  setSelectedForAuth: (selected: string[]) => void
  authorizedUsers: string[]
  onMitteilungenSaved?: () => void
  onMitteilungenContinue?: () => void
  mitteilungenSaved?: boolean
}

export function Mitteilungen({
  employees,
  activeFilter,
  setActiveFilter,
  stats,
  requiredEmployees,
  setRequiredEmployees,
  onRandomSelection,
  onResetAll,
  onEmployeesNeededChange,
  onEmployeesToAskChange,
  onStatusChange,
  authorizationMode,
  selectedForAuth,
  setSelectedForAuth,
  authorizedUsers,
  onMitteilungenSaved,
  onMitteilungenContinue,
  mitteilungenSaved,
}: MitteilungenProps) {
  // Use global event context
  const { selectedEvent, setSelectedEvent, events } = useEventContext()
  
  // Configuration history removed - no more locking system
  
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  
  // Check if configuration is complete (employees have been selected)
  const isConfigurationComplete = employees.some(emp => emp.status === "selected" || emp.status === "available") || mitteilungenSaved

  useEffect(() => {
    setIsSaved(mitteilungenSaved || false)
  }, [mitteilungenSaved])

  const handleSave = async () => {
    setIsSaving(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsSaved(true)
    setIsSaving(false)
    
    // Configuration saved successfully
    console.log('✅ Mitteilungen: Configuration saved for event:', selectedEvent?.id)
    
    // Call parent callback
    if (onMitteilungenSaved) {
      onMitteilungenSaved()
    }
  }

  const handleContinue = () => {
    // Navigate to next step (Arbeitsbereiche)
    // This would be handled by parent component
    console.log('Continue to Arbeitsbereiche')
    if (onMitteilungenContinue) {
      onMitteilungenContinue()
    }
  }

  const filteredEmployees = employees.filter((employee) => {
    if (activeFilter === "all") return true
    if (activeFilter === "available") return employee.status === "available"
    if (activeFilter === "selected") return employee.status === "selected"
    if (activeFilter === "unavailable") return employee.status === "unavailable"
    return false
  })

  return (
    <div className="space-y-6">
      <EventSelector
        events={events}
        selectedEvent={selectedEvent}
        onEventSelect={(event) => {
          setSelectedEvent(event)
          // Call parent handler for additional logic
          if (event) {
            onEmployeesNeededChange(event.id, event.employeesNeeded)
            onEmployeesToAskChange(event.id, event.employeesToAsk)
          }
        }}
        onEmployeesNeededChange={onEmployeesNeededChange}
        onEmployeesToAskChange={onEmployeesToAskChange}
        // Remove the config click handler to prevent configuration dialog
        // Save/Continue button props
        isConfigurationComplete={isConfigurationComplete}
        isSaved={isSaved}
        isSaving={isSaving}
        onSave={handleSave}
        onContinue={handleContinue}
      />
      
      <QuickActions
        requiredEmployees={requiredEmployees}
        setRequiredEmployees={setRequiredEmployees}
        onRandomSelection={onRandomSelection}
        onResetAll={onResetAll}
        selectedEvent={selectedEvent}
        alwaysNeededCount={employees.filter(e => e.status === "always-needed").length}
      />
      
      <EmployeeSection
        employees={filteredEmployees}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        stats={stats}
        onStatusChange={onStatusChange}
        authorizationMode={authorizationMode}
        selectedForAuth={selectedForAuth}
        setSelectedForAuth={setSelectedForAuth}
        authorizedUsers={authorizedUsers}
      />
    </div>
  )
}