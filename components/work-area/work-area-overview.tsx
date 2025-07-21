"use client"

import React, { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { WorkAreaCard } from "./work-area-card"
import { EmployeeList } from "./employee-list"
import { useSidebar } from "@/components/ui/sidebar"
import { Zap, Sparkles, RotateCcw, ArrowLeft, Calendar, ChevronDown, Save, CheckCircle, MapPin, Check } from "lucide-react"
import { useWorkAreas } from "@/hooks/use-work-areas"
import { useEventContext } from "@/hooks/use-event-context"

import { EventSelectorButton } from "../event-selector-button"
import type { WorkArea, Employee } from "@/hooks/use-work-area-assignment"

const roleConfig = {
  allrounder: { label: "Allrounder", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  versorger: { label: "Versorger", color: "bg-blue-100 text-blue-700 border-blue-200" },
  verkauf: { label: "Verkauf", color: "bg-amber-100 text-amber-700 border-amber-200" },
  manager: { label: "Manager", color: "bg-red-100 text-red-700 border-red-200" },
  essen: { label: "Essen", color: "bg-gray-100 text-gray-700 border-gray-200" },
}

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
  const { selectedEvent, setSelectedEvent, events } = useEventContext()
  // Configuration history removed - no more locking system
  const [showEmployeeList, setShowEmployeeList] = useState(false)
  const [draggedEmployee, setDraggedEmployee] = useState<Employee | null>(null)
  const [dragOverArea, setDragOverArea] = useState<string | null>(null)
  const [draggedFromArea, setDraggedFromArea] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  // Fetch work areas when component mounts or event changes
  useEffect(() => {
    if (selectedEvent?.id) {
      fetchWorkAreasByEvent(selectedEvent.id)
    }
  }, [selectedEvent?.id, fetchWorkAreasByEvent])

  // Transform database work areas to UI format and only include active ones
  const dbWorkAreasTransformed = dbWorkAreas
    .filter(area => area.is_active) // Only show work areas that are active (toggle switched on)
    .map(area => ({
      id: area.id,
      name: area.name,
      location: area.location,
      requiredSkills: [],
      requiredRoles: Object.keys(area.role_requirements).filter(role => area.role_requirements[role] > 0),
      maxCapacity: area.max_capacity,
      currentAssigned: 0, // Will be calculated based on assignments
      assignedEmployees: [] as Employee[],
      description: '',
      priority: 'medium' as const
    }))

  // Use database work areas if available, otherwise fall back to props
  const workAreas = dbWorkAreasTransformed.length > 0 ? dbWorkAreasTransformed : propWorkAreas

  // Check if all employees are distributed
  const totalRequired = workAreas.reduce((total, area) => total + area.maxCapacity, 0)
  const totalAssigned = workAreas.reduce((total, area) => total + area.currentAssigned, 0)
  const unassignedEmployees = availableEmployees.filter(employee => {
    return !workAreas.some(area => 
      area.assignedEmployees.some(assignedEmp => assignedEmp.id === employee.id)
    )
  })
  const allEmployeesDistributed = totalAssigned >= totalRequired || unassignedEmployees.length === 0

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
    }, 300)
    
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
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [saveSuccess])

  // Now handle conditional returns AFTER all hooks
  if (!workAreas || workAreas.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="mb-4">
          <MapPin className="h-12 w-12 text-gray-300 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Arbeitsbereiche konfiguriert</h3>
        <p className="text-gray-600 mb-4">
          Für dieses Event wurden noch keine Arbeitsbereiche eingerichtet.
        </p>
        <Button 
          onClick={() => setActiveView?.('work-area-management')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Arbeitsbereiche konfigurieren
        </Button>
      </div>
    )
  }

  // Work areas are already defined above from database or props
  
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

  const handleDrop = (e: React.DragEvent, areaId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (draggedEmployee) {
      // If dragging from another work area, remove from the source area first
      if (draggedFromArea && draggedFromArea !== areaId) {
        onRemoveEmployee(draggedFromArea, draggedEmployee.id)
      }
      
      // Only assign if not dropping in the same area
      if (draggedFromArea !== areaId) {
        onAssignEmployee(areaId, draggedEmployee)
      }
    }
    setDraggedEmployee(null)
    setDragOverArea(null)
    setDraggedFromArea(null)
  }

  // Auto-assignment logic
  const handleAutoAssign = (shuffle = false) => {
    // Get available employees (not already assigned)
    const currentUnassignedEmployees = availableEmployees.filter(employee => {
      return !workAreas.some(area => 
        area.assignedEmployees.some(assignedEmp => assignedEmp.id === employee.id)
      )
    })

    // Create a copy of work areas to track assignments
    const areasNeedingEmployees = workAreas.filter(area => area.currentAssigned < area.maxCapacity)
    
    // Sort areas by priority (areas with fewer assigned employees first)
    // If shuffle is true, randomize the order for variation
    if (shuffle) {
      areasNeedingEmployees.sort(() => Math.random() - 0.5)
    } else {
      areasNeedingEmployees.sort((a, b) => a.currentAssigned - b.currentAssigned)
    }

    // Track which employees have been assigned
    const assignedEmployeeIds = new Set<string>()

    // For each area that needs employees
    areasNeedingEmployees.forEach(area => {
      const spotsNeeded = area.maxCapacity - area.currentAssigned
      
      // For each required role in the area
      area.requiredRoles.forEach(requiredRole => {
        // Find available employees with this role who haven't been assigned yet
        let suitableEmployees = currentUnassignedEmployees.filter(employee => 
          employee.role === requiredRole && !assignedEmployeeIds.has(employee.id)
        )

        // If shuffle is true, randomize employee order for variation
        if (shuffle) {
          suitableEmployees = suitableEmployees.sort(() => Math.random() - 0.5)
        }

        // Assign employees up to the spots needed
        let assigned = 0
        suitableEmployees.forEach(employee => {
          if (assigned < spotsNeeded && !assignedEmployeeIds.has(employee.id)) {
            onAssignEmployee(area.id, employee)
            assignedEmployeeIds.add(employee.id)
            assigned++
          }
        })
      })
    })
  }

  // Redo assignment - unassign all and reassign with variation
  const handleRedoAssignment = () => {
    // First, unassign all employees from all work areas
    workAreas.forEach(area => {
      area.assignedEmployees.forEach(employee => {
        onRemoveEmployee(area.id, employee.id)
      })
    })

    // Wait a bit for the state to update, then reassign with shuffle
    setTimeout(() => {
      handleAutoAssign(true)
    }, 100)
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
      }, 1000)
      
    } catch (error) {
      console.error("Error saving assignments:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle configuration dialog navigation
  const handleNavigateToStep = (step: string) => {
    if (setActiveView) {
      setActiveView(step)
    }
  }

  return (
    <div className="relative">
      {/* Configuration Status Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent>
          <DialogTitle className="text-center">Event auswählen</DialogTitle>
          <div className="grid gap-4 mt-4">
            {events.map((event) => (
              <Button
                key={event.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  // Transform the event to match the expected format
                  const transformedEvent = {
                    id: event.id,
                    name: event.title,
                    date: new Date(event.event_date).toLocaleDateString(),
                    employeesNeeded: event.employees_needed,
                    employeesToAsk: event.employees_to_ask
                  };
                  setActiveView?.("event"); // Navigate back to event selection to update
                  setShowConfigDialog(false);
                }}
              >
                <Check className="h-4 w-4 mr-2" />
                {event.title}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Animated Employee List - Left Side */}
      <div 
        className={`fixed left-0 top-0 h-full w-80 bg-white/95 backdrop-blur-sm shadow-xl border-r border-gray-200 z-40 transform transition-transform duration-500 ease-in-out ${
          showEmployeeList ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 h-full overflow-y-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900">Mitarbeiter Zuweisen</h2>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                  {availableEmployees.length}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600">Einfach automatisch zuteilen oder in Arbeitsbereiche ziehen!</p>
          </div>
          
          <div className="space-y-3">
            {unassignedEmployees.map((employee, index) => (
              <div 
                key={employee.id}
                draggable
                onDragStart={(e) => handleDragStart(e, employee)}
                onDragEnd={handleDragEnd}
                className={`p-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 transform cursor-grab active:cursor-grabbing ${
                  showEmployeeList ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                } ${draggedEmployee?.id === employee.id ? 'opacity-50 scale-95' : ''}`}
                style={{ 
                  transitionDelay: showEmployeeList ? `${index * 50}ms` : '0ms'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-900">{employee.name}</div>
                      <Badge className={`text-xs ${roleConfig[employee.role as keyof typeof roleConfig]?.color || 'bg-gray-100 text-gray-700'}`}>
                        {roleConfig[employee.role as keyof typeof roleConfig]?.label || employee.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {unassignedEmployees.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Alle Mitarbeiter zugewiesen</h3>
              <p className="text-gray-600">Alle verfügbaren Mitarbeiter wurden den Arbeitsbereichen zugewiesen</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Shifted Right */}
      <div className={`transition-all duration-500 ease-in-out ${showEmployeeList ? 'ml-80' : 'ml-0'}`}>
        {/* Event Header - Matching Event and Arbeitsbereiche page style */}
        <div className="flex items-center justify-between p-6 bg-blue-50/50 border border-blue-200 rounded-xl shadow-sm mb-6">
          {/* Left side - Event Information */}
          {selectedEvent && (
            <div className="flex items-center gap-4">
              <EventSelectorButton
                selectedEvent={selectedEvent ? {
                  id: selectedEvent.id || '',
                  name: selectedEvent.name || 'Event',
                  date: selectedEvent.date || '',
                  employeesNeeded: selectedEvent.employeesNeeded || 0,
                  employeesToAsk: selectedEvent.employeesToAsk || 0,
                  status: selectedEvent.status
                } : null}
                events={events.map(event => ({
                  id: event.id,
                  name: event.title,
                  date: new Date(event.event_date).toLocaleDateString('de-DE'),
                  employeesNeeded: event.employees_needed,
                  employeesToAsk: event.employees_to_ask,
                  status: event.status
                }))}
                onEventSelect={(event) => {
                  // Find the database event and transform to UI format
                  const dbEvent = events.find(e => e.id === event.id);
                  if (dbEvent) {
                    const transformedEvent = {
                      id: dbEvent.id,
                      name: dbEvent.title,
                      date: new Date(dbEvent.event_date).toLocaleDateString(),
                      employeesNeeded: dbEvent.employees_needed,
                      employeesToAsk: dbEvent.employees_to_ask,
                      status: dbEvent.status
                    };
                    setActiveView?.("event"); // Navigate back to event selection to update
                  }
                }}
                onConfigClick={() => setShowConfigDialog(true)}
              />
              
              {/* Request Counter */}
              {selectedEvent && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Anfragen:</span>
                  <input
                    type="number"
                    min="1"
                    value={selectedEvent.employeesToAsk || 1}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      // Note: This would need proper state management in a real implementation
                      console.log('Update employees to ask:', value);
                    }}
                    className="h-8 w-16 text-center border border-gray-300 bg-white text-sm font-medium text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  />
                </div>
              )}
            </div>
          )}

          {/* Right side - Action Buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Auto-Assign Button / Save Button */}
            {allEmployeesDistributed ? (
              <Button
                onClick={handleSave}
                disabled={isSaving || saveSuccess}
                className={`group relative overflow-hidden font-medium px-4 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 ${
                  saveSuccess 
                    ? 'bg-green-600 text-white scale-105' 
                    : isSaving 
                      ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white' 
                      : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                }`}
              >
                <div className="relative flex items-center gap-2">
                  {saveSuccess ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Gespeichert!</span>
                    </>
                  ) : isSaving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Speichert...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                      <span>Speichern</span>
                    </>
                  )}
                </div>
              </Button>
            ) : (
              <Button
                onClick={() => handleAutoAssign(false)}
                variant="outline"
                className="group relative overflow-hidden bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-purple-300 text-gray-700 hover:text-purple-700 font-medium px-4 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105"
              >
                <div className="relative flex items-center gap-2">
                  <Zap className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                  <span>Zuteilen</span>
                </div>
              </Button>
            )}

            {/* Redo Button */}
            <Button
              onClick={handleRedoAssignment}
              variant="outline"
              size="sm"
              disabled={isSaving}
              className="group relative overflow-hidden bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-purple-300 text-gray-700 hover:text-purple-700 h-10 w-10 p-0 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
            </Button>
          </div>
        </div>

        {/* Work Areas */}
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {workAreas.map((area) => (
              <WorkAreaCard
                key={area.id}
                area={area}
                availableEmployees={availableEmployees}
                onAssignEmployee={onAssignEmployee}
                onRemoveEmployee={onRemoveEmployee}
                onDragOver={(e) => handleDragOver(e, area.id)}
                onDragLeave={(e) => handleDragLeave(e, area.id)}
                onDrop={(e) => handleDrop(e, area.id)}
                isDragOver={dragOverArea === area.id}
                draggedEmployee={draggedEmployee}
                onDragStart={(e, employee) => handleDragStart(e, employee, area.id)}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>
        </div>

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