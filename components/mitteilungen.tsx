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
  
  // Track pending status changes for manual saving
  const [pendingStatusChanges, setPendingStatusChanges] = useState<Record<string, string>>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Check if configuration is complete (employees have been selected)
  const isConfigurationComplete = employees.some(emp => emp.status === "selected" || emp.status === "available") || mitteilungenSaved

  useEffect(() => {
    setIsSaved(mitteilungenSaved || false)
  }, [mitteilungenSaved])

  // Reset saved state when new changes are made
  useEffect(() => {
    if (hasUnsavedChanges) {
      setIsSaved(false)
    }
  }, [hasUnsavedChanges])

  // Reset saved state when new changes are made
  useEffect(() => {
    if (hasUnsavedChanges) {
      setIsSaved(false)
    }
  }, [hasUnsavedChanges])

  // Handle local status changes (don't save to database immediately)
  const handleLocalStatusChange = (employeeId: string, newStatus: string) => {
    console.log('🔄 Mitteilungen: Local status change:', { employeeId, newStatus })
    
    // Store the pending change
    setPendingStatusChanges(prev => ({
      ...prev,
      [employeeId]: newStatus
    }))
    
    setHasUnsavedChanges(true)
  }

  // Handle bulk operations (like random selection) - bypass manual saving
  const handleBulkStatusChange = (employeeId: string, newStatus: string) => {
    console.log('🔄 Mitteilungen: Bulk status change (bypassing manual save):', { employeeId, newStatus })
    // For bulk operations, call the parent handler directly
    onStatusChange(employeeId, newStatus)
  }

  // Handle discarding unsaved changes
  const handleDiscardChanges = () => {
    setPendingStatusChanges({})
    setHasUnsavedChanges(false)
    setIsSaved(false)
    console.log('🔄 Mitteilungen: Discarded unsaved changes')
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      console.log('💾 Mitteilungen: Starting save process with changes:', pendingStatusChanges)
      
      // Apply all pending status changes to database
      for (const [employeeId, newStatus] of Object.entries(pendingStatusChanges)) {
        console.log('💾 Mitteilungen: Saving status change:', { employeeId, newStatus })
        await onStatusChange(employeeId, newStatus)
      }
      
      console.log('✅ Mitteilungen: All database updates completed for event:', selectedEvent?.id)
      
      // Clear pending changes immediately after successful save
      setPendingStatusChanges({})
      setHasUnsavedChanges(false)
      
      // Call parent callback
      if (onMitteilungenSaved) {
        onMitteilungenSaved()
      }
      
      setIsSaved(true)
      setIsSaving(false)
      
      console.log('✅ Mitteilungen: Save process completed successfully')
    } catch (error) {
      console.error('❌ Mitteilungen: Error saving changes:', error)
      setIsSaving(false)
      // Don't clear pending changes on error so user can retry
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
      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700">
            ⚠️ Sie haben ungespeicherte Änderungen für {Object.keys(pendingStatusChanges).length} Mitarbeiter.
          </p>
        </div>
      )}

      <EventSelector
        events={events}
        selectedEvent={selectedEvent}
        onEventSelect={(event) => {
          // Warn user about unsaved changes when switching events
          if (hasUnsavedChanges) {
            const confirmSwitch = window.confirm(
              `Sie haben ungespeicherte Änderungen für ${Object.keys(pendingStatusChanges).length} Mitarbeiter. ` +
              'Möchten Sie diese Änderungen verwerfen und das Event wechseln?'
            )
            if (!confirmSwitch) {
              return // Don't switch events
            }
            // Clear unsaved changes if user confirms
            setPendingStatusChanges({})
            setHasUnsavedChanges(false)
          }
          
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
        isSaved={mitteilungenSaved || false}
        isSaving={false}
        onSave={() => {
          if (onMitteilungenSaved) {
            onMitteilungenSaved()
          }
        }}
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