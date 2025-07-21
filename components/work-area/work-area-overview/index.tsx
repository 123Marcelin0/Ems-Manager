"use client"

import React, { useState, useEffect } from 'react'
import { useSidebar } from "@/components/ui/sidebar"
import { useWorkAreas } from "@/hooks/use-work-areas"
import { useWorkAssignments } from "@/hooks/use-work-assignments"
import { useEventContext } from "@/hooks/use-event-context"
import { useEmployees } from "@/hooks/use-employees"
import { EmployeeList } from "../employee-list"
import type { WorkArea, Employee } from "@/hooks/use-work-area-assignment"

// Subcomponents
import { EventHeader } from "./event-header"
import { EmployeeSidebar } from "./employee-sidebar"
import { ConfigurationDialog } from "./configuration-dialog"
import { WorkAreasGrid } from "./work-areas-grid"
import { EmptyState } from "./empty-state"
import { useAutoAssignment } from "./use-auto-assignment"
import { ANIMATION_DELAYS } from "./constants"

interface WorkAreaOverviewProps {
  workAreas: WorkArea[]
  availableEmployees: Employee[]
  selectedEmployees: string[]
  searchQuery: string
  getSelectedEmployeesForDisplay: () => Employee[]
  onAssignEmployee: (workAreaId: string, employee: Employee) => void
  onRemoveEmployee: (workAreaId: string, employeeId: string) => void
  onEmployeeSelect: (employeeId: string) => void
  onClearSelection: () => void
  onBack?: () => void
  setActiveView?: (view: string) => void
}

export function WorkAreaOverview({
  workAreas: propWorkAreas,
  availableEmployees,
  selectedEmployees,
  searchQuery,
  getSelectedEmployeesForDisplay,
  onAssignEmployee,
  onRemoveEmployee,
  onEmployeeSelect,
  onClearSelection,
  onBack,
  setActiveView
}: WorkAreaOverviewProps) {
  // Move all hooks to the top before any conditional returns
  const { setOpen } = useSidebar()
  const { workAreas: dbWorkAreas, fetchWorkAreasByEvent } = useWorkAreas()
  const { assignments, fetchAssignmentsByEvent, assignEmployee, removeAssignment, autoAssignEmployees } = useWorkAssignments()
  const { employees: dbEmployees, getEmployeesForSelection } = useEmployees()
  const { selectedEvent, setSelectedEvent, events } = useEventContext()
  
  // State management
  const [showEmployeeList, setShowEmployeeList] = useState(false)
  const [draggedEmployee, setDraggedEmployee] = useState<Employee | null>(null)
  const [dragOverArea, setDragOverArea] = useState<string | null>(null)
  const [draggedFromArea, setDraggedFromArea] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  // Fetch work areas and assignments when component mounts or event changes
  useEffect(() => {
    if (selectedEvent?.id) {
      fetchWorkAreasByEvent(selectedEvent.id)
      fetchAssignmentsByEvent(selectedEvent.id)
    }
  }, [selectedEvent?.id, fetchWorkAreasByEvent, fetchAssignmentsByEvent])

  // Transform database employees to UI format
  const transformedEmployees = dbEmployees.map(emp => ({
    id: emp.id,
    name: emp.name,
    role: emp.role as "allrounder" | "versorger" | "verkauf" | "manager" | "essen",
    skills: emp.skills || [],
    availability: "available" as const
  }))

  // Get employees that are selected for this event
  const selectedEmployeesForEvent = transformedEmployees.filter(emp => {
    // Check if employee has status 'selected' for this event
    // This would need to be fetched from employee_event_status table
    return true // For now, show all employees
  })

  // Transform database work areas to UI format and include assignments
  const dbWorkAreasTransformed = dbWorkAreas
    .filter(area => area.is_active) // Only show work areas that are active (toggle switched on)
    .map(area => {
      // Get assignments for this work area
      const areaAssignments = assignments.filter(assignment => assignment.work_area_id === area.id)
      
      // Transform assignments to employees
      const assignedEmployees = areaAssignments.map(assignment => {
        const employee = transformedEmployees.find(emp => emp.id === assignment.employee_id)
        return employee ? {
          ...employee,
          availability: "assigned" as const
        } : null
      }).filter(Boolean) as Employee[]

      return {
        id: area.id,
        name: area.name,
        location: area.location,
        requiredSkills: [],
        requiredRoles: Object.keys(area.role_requirements).filter(role => area.role_requirements[role] > 0),
        maxCapacity: area.max_capacity,
        currentAssigned: assignedEmployees.length,
        assignedEmployees: assignedEmployees,
        description: '',
        priority: 'medium' as const
      }
    })

  // Use database work areas if available, otherwise fall back to props
  const workAreas = dbWorkAreasTransformed.length > 0 ? dbWorkAreasTransformed : propWorkAreas

  // Use real employees if available, otherwise fall back to props
  const realAvailableEmployees = selectedEmployeesForEvent.length > 0 ? selectedEmployeesForEvent : availableEmployees

  // Check if all employees are distributed
  const totalRequired = workAreas.reduce((total, area) => total + area.maxCapacity, 0)
  const totalAssigned = workAreas.reduce((total, area) => total + area.currentAssigned, 0)
  const unassignedEmployees = realAvailableEmployees.filter(employee => {
    return !workAreas.some(area => 
      area.assignedEmployees.some(assignedEmp => assignedEmp.id === employee.id)
    )
  })
  const allEmployeesDistributed = totalAssigned >= totalRequired || unassignedEmployees.length === 0

  // Auto assignment hook
  const { handleAutoAssign, handleRedoAssignment } = useAutoAssignment({
    workAreas,
    availableEmployees: realAvailableEmployees,
    onAssignEmployee: async (workAreaId: string, employee: Employee) => {
      if (selectedEvent?.id) {
        try {
          await assignEmployee(employee.id, workAreaId, selectedEvent.id)
          console.log(`Assigned ${employee.name} to work area ${workAreaId}`)
        } catch (error) {
          console.error('Failed to assign employee:', error)
        }
      }
    },
    onRemoveEmployee: async (workAreaId: string, employeeId: string) => {
      if (selectedEvent?.id) {
        try {
          await removeAssignment(employeeId, selectedEvent.id)
          console.log(`Removed employee ${employeeId} from work area ${workAreaId}`)
        } catch (error) {
          console.error('Failed to remove employee assignment:', error)
        }
      }
    }
  })

  // Listen for work areas changes
  useEffect(() => {
    const handleWorkAreasChanged = () => {
      if (selectedEvent?.id) {
        fetchWorkAreasByEvent(selectedEvent.id)
      }
    }
    
    window.addEventListener('workAreasChanged', handleWorkAreasChanged)
    return () => window.removeEventListener('workAreasChanged', handleWorkAreasChanged)
  }, [selectedEvent?.id, fetchWorkAreasByEvent])

  // Hide sidebar and show employee list when component mounts
  useEffect(() => {
    setOpen(false)
    // Small delay to ensure sidebar animation completes first
    const timer = setTimeout(() => {
      setShowEmployeeList(true)
    }, ANIMATION_DELAYS.SIDEBAR_TRANSITION)
    
    return () => {
      clearTimeout(timer)
      // Show sidebar again when component unmounts
      setOpen(true)
    }
  }, [setOpen])

  // Reset save success state after animation
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false)
      }, ANIMATION_DELAYS.SAVE_SUCCESS_RESET)
      return () => clearTimeout(timer)
    }
  }, [saveSuccess])

  // Now handle conditional returns AFTER all hooks
  if (!workAreas || workAreas.length === 0) {
    return (
      <EmptyState onConfigureWorkAreas={() => setActiveView?.('work-area-management')} />
    )
  }

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, employee: Employee, fromAreaId?: string) => {
    setDraggedEmployee(employee)
    setDraggedFromArea(fromAreaId || null)
    e.dataTransfer.setData('text/plain', employee.id)
    e.dataTransfer.effectAllowed = 'move'
    // Add a small delay to prevent immediate flickering
    setTimeout(() => {
      setDraggedEmployee(employee)
    }, 0)
  }

  const handleDragEnd = () => {
    setDraggedEmployee(null)
    setDragOverArea(null)
    setDraggedFromArea(null)
  }

  const handleDragOver = (e: React.DragEvent, areaId: string) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    
    // Only update if it's actually different to prevent flickering
    if (dragOverArea !== areaId) {
      setDragOverArea(areaId)
    }
  }

  const handleDragLeave = (e: React.DragEvent, areaId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Only clear if we're actually leaving the area (not just moving to a child element)
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverArea(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, areaId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (draggedEmployee && selectedEvent?.id) {
      try {
        // If dragging from another work area, the assignment will be updated automatically
        // If dragging from unassigned list, create new assignment
        await assignEmployee(draggedEmployee.id, areaId, selectedEvent.id)
        console.log(`Assigned ${draggedEmployee.name} to work area ${areaId}`)
      } catch (error) {
        console.error('Failed to assign employee:', error)
      }
    }
    setDraggedEmployee(null)
    setDragOverArea(null)
    setDraggedFromArea(null)
  }

  // Handle save action with animation
  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      console.log("Saving employee assignments...")
      console.log("Work areas with assignments:", workAreas)
      
      // Configuration saved successfully
      console.log('✅ Übersicht: Configuration saved for event:', selectedEvent?.id)
      
      setSaveSuccess(true)
      
      // Show configuration dialog after successful save
      setTimeout(() => {
        setShowConfigDialog(true)
      }, ANIMATION_DELAYS.CONFIG_DIALOG_DELAY)
      
    } catch (error) {
      console.error("Error saving assignments:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle event selection
  const handleEventSelect = (event: any) => {
    // Find the database event and transform to UI format
    const dbEvent = events.find(e => e.id === event.id)
    if (dbEvent) {
      const transformedEvent = {
        id: dbEvent.id,
        name: dbEvent.title || '',
        date: dbEvent.event_date ? new Date(dbEvent.event_date).toLocaleDateString() : new Date().toLocaleDateString(),
        employeesNeeded: dbEvent.employees_needed || 0,
        employeesToAsk: dbEvent.employees_to_ask || 0,
        status: dbEvent.status || ''
      }
      setActiveView?.("event") // Navigate back to event selection to update
    }
  }

  // Handle employees to ask change
  const handleEmployeesToAskChange = (value: number) => {
    // Note: This would need proper state management in a real implementation
    console.log('Update employees to ask:', value)
  }

  return (
    <div className="relative">
      {/* Configuration Status Dialog */}
      <ConfigurationDialog
        open={showConfigDialog}
        onOpenChange={setShowConfigDialog}
        events={events}
        onEventSelect={handleEventSelect}
        setActiveView={setActiveView}
      />

      {/* Employee Sidebar */}
      <EmployeeSidebar
        showEmployeeList={showEmployeeList}
        unassignedEmployees={unassignedEmployees}
        draggedEmployee={draggedEmployee}
        onDragStart={(e, employee) => handleDragStart(e, employee)}
        onDragEnd={handleDragEnd}
      />

      {/* Main Content - Shifted Right */}
      <div className={`transition-all duration-500 ease-in-out ${showEmployeeList ? 'ml-80' : 'ml-0'}`}>
        {/* Event Header */}
        <EventHeader
          selectedEvent={selectedEvent}
          events={events}
          allEmployeesDistributed={allEmployeesDistributed}
          isSaving={isSaving}
          saveSuccess={saveSuccess}
          onEventSelect={handleEventSelect}
          onConfigClick={() => setShowConfigDialog(true)}
          onEmployeesToAskChange={handleEmployeesToAskChange}
          onAutoAssign={async () => {
            if (selectedEvent?.id) {
              try {
                await autoAssignEmployees(selectedEvent.id, realAvailableEmployees, workAreas)
                console.log('Auto-assignment completed')
              } catch (error) {
                console.error('Auto-assignment failed:', error)
              }
            }
          }}
          onRedoAssignment={handleRedoAssignment}
          onSave={handleSave}
        />

        {/* Work Areas Grid */}
        <WorkAreasGrid
          workAreas={workAreas}
          availableEmployees={realAvailableEmployees}
          draggedEmployee={draggedEmployee}
          dragOverArea={dragOverArea}
          onAssignEmployee={async (workAreaId: string, employee: Employee) => {
            if (selectedEvent?.id) {
              try {
                await assignEmployee(employee.id, workAreaId, selectedEvent.id)
                console.log(`Assigned ${employee.name} to work area ${workAreaId}`)
              } catch (error) {
                console.error('Failed to assign employee:', error)
              }
            }
          }}
          onRemoveEmployee={async (workAreaId: string, employeeId: string) => {
            if (selectedEvent?.id) {
              try {
                await removeAssignment(employeeId, selectedEvent.id)
                console.log(`Removed employee ${employeeId} from work area ${workAreaId}`)
              } catch (error) {
                console.error('Failed to remove employee assignment:', error)
              }
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onDragStart={(e, employee, areaId) => handleDragStart(e, employee, areaId)}
          onDragEnd={handleDragEnd}
        />

        {/* Available Employees - Hidden when employee list is shown */}
        <div className={`transition-opacity duration-300 ${showEmployeeList ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <EmployeeList
            employees={getSelectedEmployeesForDisplay()}
            selectedEmployees={selectedEmployees}
            searchQuery={searchQuery}
            onEmployeeSelect={onEmployeeSelect}
            onClearSelection={onClearSelection}
          />
        </div>
      </div>
    </div>
  )
} 