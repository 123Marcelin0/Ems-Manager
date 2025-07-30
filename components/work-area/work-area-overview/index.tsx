"use client"

import React, { useState, useEffect } from 'react'
import { useSidebar } from "@/components/ui/sidebar"
import { useWorkAreas } from "@/hooks/use-work-areas"
import { useWorkAssignments } from "@/hooks/use-work-assignments"
import { useEventContext } from "@/hooks/use-event-context"
import { useEmployees } from "@/hooks/use-employees"
import { supabase } from "@/lib/supabase"
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

  // State for employee event statuses
  const [employeeEventStatuses, setEmployeeEventStatuses] = useState<any[]>([])
  const [statusLoading, setStatusLoading] = useState(false)

  // Fetch employee event statuses for the current event
  const fetchEmployeeEventStatuses = async (eventId: string) => {
    if (!eventId) return
    
    setStatusLoading(true)
    try {
      const { data, error } = await supabase
        .from('employee_event_status')
        .select(`
          *,
          employees (
            id,
            name,
            role,
            skills
          )
        `)
        .eq('event_id', eventId)
        .eq('status', 'available') // Only get employees with "available" status

      if (error) throw error
      
      // Transform to UI format
      const availableEmployeesFromDB = data?.map(item => ({
        id: item.employees.id,
        name: item.employees.name,
        role: item.employees.role as "allrounder" | "versorger" | "verkauf" | "manager" | "essen",
        skills: item.employees.skills || [],
        availability: "available" as const
      })) || []
      
      setEmployeeEventStatuses(availableEmployeesFromDB)
      console.log(`📋 WorkAreaOverview: Loaded ${availableEmployeesFromDB.length} available employees for event ${eventId}`)
    } catch (error) {
      console.error('Error fetching available employees for work areas:', error)
      setEmployeeEventStatuses([])
    } finally {
      setStatusLoading(false)
    }
  }

  // Fetch employee statuses when event changes
  useEffect(() => {
    if (selectedEvent?.id) {
      fetchEmployeeEventStatuses(selectedEvent.id)
    }
  }, [selectedEvent?.id])

  // Set up real-time subscription for employee status changes
  useEffect(() => {
    if (!selectedEvent?.id) return

    const subscription = supabase
      .channel('work-area-employee-status-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'employee_event_status',
        filter: `event_id=eq.${selectedEvent.id}`
      }, () => {
        console.log('📡 WorkAreaOverview: Received employee status change, refreshing available employees...')
        fetchEmployeeEventStatuses(selectedEvent.id)
      })
      .subscribe()

    // Listen for custom employee status change events
    const handleEmployeeStatusChange = (event: CustomEvent) => {
      const { eventId } = event.detail
      if (eventId === selectedEvent.id) {
        console.log('📡 WorkAreaOverview: Received custom employee status change event, refreshing...')
        fetchEmployeeEventStatuses(selectedEvent.id)
      }
    }

    window.addEventListener('employeeStatusChanged', handleEmployeeStatusChange as EventListener)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('employeeStatusChanged', handleEmployeeStatusChange as EventListener)
    }
  }, [selectedEvent?.id])

  // Get employees that are available for this event (from database status)
  const selectedEmployeesForEvent = employeeEventStatuses.filter(emp => {
    // Only include real employees (not example employees) for work area assignments
    return !emp.id.startsWith('emp-') // Filter out example employees
  })

  // Transform database employees to UI format (for assignments)
  const transformedEmployees = dbEmployees.map(emp => ({
    id: emp.id,
    name: emp.name,
    role: emp.role as "allrounder" | "versorger" | "verkauf" | "manager" | "essen",
    skills: emp.skills || [],
    availability: "available" as const
  }))

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

  // Use employees with "available" status from database
  // IMPORTANT: Only show employees who are currently marked as "available" in Mitteilungen
  const displayEmployees = selectedEmployeesForEvent // These are already filtered to "available" status

  // Check if all employees are distributed
  const totalRequired = workAreas.reduce((total, area) => total + area.maxCapacity, 0)
  const totalAssigned = workAreas.reduce((total, area) => total + area.currentAssigned, 0)
  const unassignedEmployees = displayEmployees.filter(employee => {
    return !workAreas.some(area => 
      area.assignedEmployees.some(assignedEmp => assignedEmp.id === employee.id)
    )
  })
  const allEmployeesDistributed = totalAssigned >= totalRequired || unassignedEmployees.length === 0

  // Auto assignment hook
  const { handleAutoAssign, handleRedoAssignment } = useAutoAssignment({
    workAreas,
    availableEmployees: displayEmployees,
    onAssignEmployee: async (workAreaId: string, employee: Employee) => {
      if (selectedEvent?.id) {
        try {
          // Check if this is an example employee
          if (employee.id.startsWith('emp-')) {
            console.warn('Cannot assign example employee to work area')
            return
          }
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
          // Check if this is an example employee
          if (employeeId.startsWith('emp-')) {
            console.warn('Cannot remove example employee assignment')
            return
          }
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

  // Check if there are no employees available for display at all
  if (displayEmployees.length === 0 && selectedEmployeesForEvent.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="mb-4">
          <span className="text-4xl">👥</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Mitarbeiter verfügbar</h3>
        <p className="text-gray-600 mb-4">
          Es sind keine Mitarbeiter verfügbar, die angezeigt werden können.
        </p>
        {selectedEmployeesForEvent.length === 0 && displayEmployees.some(emp => emp.id.startsWith('emp-')) && (
          <p className="text-sm text-gray-500">
            Hinweis: Beispiel-Mitarbeiter können nicht zu Arbeitsbereichen zugewiesen werden.
          </p>
        )}
      </div>
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
        // Check if this is an example employee
        if (draggedEmployee.id.startsWith('emp-')) {
          console.warn('Cannot assign example employee to work area')
          return
        }
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
                await autoAssignEmployees(selectedEvent.id, displayEmployees, workAreas)
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
          availableEmployees={displayEmployees}
          draggedEmployee={draggedEmployee}
          dragOverArea={dragOverArea}
          onAssignEmployee={async (workAreaId: string, employee: Employee) => {
            if (selectedEvent?.id) {
              try {
                // Check if this is an example employee
                if (employee.id.startsWith('emp-')) {
                  console.warn('Cannot assign example employee to work area')
                  return
                }
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
                // Check if this is an example employee
                if (employeeId.startsWith('emp-')) {
                  console.warn('Cannot remove example employee assignment')
                  return
                }
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
          {statusLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                Lade verfügbare Mitarbeiter...
              </div>
            </div>
          ) : displayEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-gray-400 text-2xl">👥</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine verfügbaren Mitarbeiter</h3>
              <p className="text-gray-600 max-w-md">
                Für dieses Event sind aktuell keine Mitarbeiter als "verfügbar" markiert. 
                Gehen Sie zu Mitteilungen, um Mitarbeiter-Status zu ändern.
              </p>
            </div>
          ) : (
            <EmployeeList
              employees={displayEmployees}
              selectedEmployees={selectedEmployees}
              searchQuery={searchQuery}
              onEmployeeSelect={onEmployeeSelect}
              onClearSelection={onClearSelection}
            />
          )}
        </div>
      </div>
    </div>
  )
} 