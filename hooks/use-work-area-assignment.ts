import { useState, useEffect, useCallback } from "react"
import { useEventContext } from "./use-event-context"
import { useEmployees } from "./use-employees"
import { useEventWorkAreaSync } from "./use-event-work-area-sync"

export interface Employee {
  id: string
  name: string
  role: "allrounder" | "versorger" | "verkauf" | "manager" | "essen"
  skills: string[]
  availability: "available" | "unavailable" | "assigned"
}

export interface WorkArea {
  id: string
  name: string
  location: string
  requiredRoles: string[]
  maxCapacity: number
  currentAssigned: number
  assignedEmployees: Employee[]
}

const mockWorkAreas: WorkArea[] = [
  {
    id: "WA001",
    name: "Emslandarena - Main Entrance",
    location: "Emslandarena",
    requiredRoles: ["allrounder", "versorger"],
    maxCapacity: 4,
    currentAssigned: 2,
    assignedEmployees: [
      {
        id: "EMP001",
        name: "Anna Schmidt",
        role: "allrounder",
        skills: ["Customer Service", "Security"],
        availability: "assigned",
      },
      {
        id: "EMP002",
        name: "Max Müller",
        role: "versorger",
        skills: ["Logistics", "Inventory"],
        availability: "assigned",
      },
    ],
  },
  {
    id: "WA002",
    name: "Emslandhalle - Food Court",
    location: "Emslandhalle",
    requiredRoles: ["essen", "verkauf"],
    maxCapacity: 6,
    currentAssigned: 1,
    assignedEmployees: [
      {
        id: "EMP005",
        name: "Sarah Klein",
        role: "essen",
        skills: ["Food Preparation", "Hygiene"],
        availability: "assigned",
      },
    ],
  },
  {
    id: "WA003",
    name: "Mobile Counter - Outdoor",
    location: "Outdoor Area",
    requiredRoles: ["verkauf", "allrounder"],
    maxCapacity: 3,
    currentAssigned: 0,
    assignedEmployees: [],
  },
]

const availableEmployees: Employee[] = [
  {
    id: "EMP003",
    name: "Lisa Weber",
    role: "versorger",
    skills: ["Logistics", "Quality Control"],
    availability: "available",
  },
  {
    id: "EMP004",
    name: "Tom Fischer",
    role: "verkauf",
    skills: ["Sales", "Customer Relations"],
    availability: "available",
  },
  {
    id: "EMP006",
    name: "Michael Berg",
    role: "manager",
    skills: ["Leadership", "Operations"],
    availability: "available",
  },
  {
    id: "EMP007",
    name: "Julia Hoffmann",
    role: "allrounder",
    skills: ["Multi-tasking", "Problem Solving"],
    availability: "available",
  },
]

export function useWorkAreaAssignment() {
  // Use global event context and real data hooks
  const { selectedEvent } = useEventContext()
  const { employees: dbEmployees, fetchEmployeesWithStatus, updateEmployeeStatus } = useEmployees()
  const { syncedWorkAreas, assignEmployeeToWorkArea, removeEmployeeFromWorkArea } = useEventWorkAreaSync()
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [workAreas, setWorkAreas] = useState<WorkArea[]>(mockWorkAreas)
  const [realEmployees, setRealEmployees] = useState<Employee[]>([])
  
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>(availableEmployees)
  const [isLoading, setIsLoading] = useState(false)

  // Force refresh employee statuses
  const refreshEmployeeStatuses = useCallback(async () => {
    if (!selectedEvent?.id) return

    console.log(`Work Area Assignment: Force refreshing employee statuses for event: ${selectedEvent.id}`)
    
    try {
      const response = await fetch(`/api/work-areas/employee-status?eventId=${selectedEvent.id}`)
      
      if (response.ok) {
        const result = await response.json()
        const employeesWithStatus = result.data || []
        
        const transformedEmployees = employeesWithStatus.map((emp: any) => {
          const eventStatus = emp.employee_event_status?.[0]?.status
          let availability: "available" | "unavailable" | "assigned" = "available"
          
          if (eventStatus) {
            switch (eventStatus) {
              case 'selected':
                availability = "assigned"
                break
              case 'unavailable':
                availability = "unavailable"
                break
              case 'available':
              case 'not_asked':
              default:
                availability = "available"
                break
            }
          } else if (emp.is_always_needed) {
            availability = "assigned"
          }
          
          return {
            id: emp.id,
            name: emp.name,
            role: emp.role as "allrounder" | "versorger" | "verkauf" | "manager" | "essen",
            skills: [],
            availability
          }
        })
        
        setRealEmployees(transformedEmployees)
        setFilteredEmployees(transformedEmployees.filter((emp: Employee) => emp.availability === "available"))
        console.log(`✅ Work Area Assignment: Refreshed ${transformedEmployees.length} employee statuses`)
      }
    } catch (error) {
      console.error('Work Area Assignment: Error refreshing employee statuses:', error)
    }
  }, [selectedEvent?.id])

  // Listen for employee status changes from other components (like Mitteilungen)
  useEffect(() => {
    const handleEmployeeStatusChanged = (event: CustomEvent) => {
      const { employeeId, newStatus, eventId } = event.detail
      
      if (eventId === selectedEvent?.id) {
        console.log(`Work Area Assignment: Received status change for employee ${employeeId}: ${newStatus}`)
        
        // Update local employee state
        setRealEmployees(prev => prev.map(emp => {
          if (emp.id === employeeId) {
            let availability: "available" | "unavailable" | "assigned" = "available"
            
            switch (newStatus) {
              case 'selected':
                availability = "assigned"
                break
              case 'unavailable':
                availability = "unavailable"
                break
              case 'available':
              case 'not-selected':
              default:
                availability = "available"
                break
            }
            
            return { ...emp, availability }
          }
          return emp
        }))
        
        // Update filtered employees
        refreshEmployeeStatuses()
      }
    }

    window.addEventListener('employeeStatusChanged', handleEmployeeStatusChanged as EventListener)
    return () => {
      window.removeEventListener('employeeStatusChanged', handleEmployeeStatusChanged as EventListener)
    }
  }, [selectedEvent?.id, refreshEmployeeStatuses])

  // Load employee statuses when event changes
  useEffect(() => {
    const loadEmployeeStatuses = async () => {
      if (!selectedEvent?.id) {
        console.log('Work Area Assignment: No selected event, using mock data')
        setRealEmployees([])
        setFilteredEmployees(availableEmployees)
        return
      }

      if (dbEmployees.length === 0) {
        console.log('Work Area Assignment: No database employees, using mock data')
        setRealEmployees([])
        setFilteredEmployees(availableEmployees)
        return
      }

      setIsLoading(true)
      try {
        console.log(`Work Area Assignment: Loading employee statuses for event: ${selectedEvent.id}`)
        
        // Use the specific work area employee status API
        const response = await fetch(`/api/work-areas/employee-status?eventId=${selectedEvent.id}`)
        
        if (response.ok) {
          const result = await response.json()
          const employeesWithStatus = result.data || []
          
          if (employeesWithStatus.length > 0) {
            // Transform to work area assignment format
            const transformedEmployees = employeesWithStatus.map((emp: any) => {
              const eventStatus = emp.employee_event_status?.[0]?.status
              
              // Map database status to work area assignment availability
              let availability: "available" | "unavailable" | "assigned" = "available"
              if (eventStatus) {
                switch (eventStatus) {
                  case 'selected':
                    availability = "assigned"
                    break
                  case 'unavailable':
                    availability = "unavailable"
                    break
                  case 'available':
                  case 'not_asked':
                  default:
                    availability = "available"
                    break
                }
              } else if (emp.is_always_needed) {
                availability = "assigned"
              }
              
              return {
                id: emp.id,
                name: emp.name,
                role: emp.role as "allrounder" | "versorger" | "verkauf" | "manager" | "essen",
                skills: [],
                availability
              }
            })
            
            setRealEmployees(transformedEmployees)
            setFilteredEmployees(transformedEmployees.filter((emp: Employee) => emp.availability === "available"))
            console.log(`✅ Work Area Assignment: Loaded ${transformedEmployees.length} employees with statuses for event ${selectedEvent.id}`)
            
          } else {
            // Fallback to database employees with default statuses
            const defaultEmployees = dbEmployees.map((emp: any) => ({
              id: emp.id,
              name: emp.name,
              role: emp.role as "allrounder" | "versorger" | "verkauf" | "manager" | "essen",
              skills: [],
              availability: emp.is_always_needed ? "assigned" as const : "available" as const
            }))
            
            setRealEmployees(defaultEmployees)
            setFilteredEmployees(defaultEmployees.filter((emp: Employee) => emp.availability === "available"))
            console.log(`✅ Work Area Assignment: Using ${defaultEmployees.length} employees with default statuses`)
          }
        } else {
          console.error('Work Area Assignment: Failed to fetch employee statuses from API')
          // Fallback to fetchEmployeesWithStatus
          const employeesWithStatus = await fetchEmployeesWithStatus(selectedEvent.id)
          
          if (employeesWithStatus && employeesWithStatus.length > 0) {
            const transformedEmployees = employeesWithStatus.map((emp: any) => {
              const eventStatus = emp.employee_event_status?.[0]?.status
              let availability: "available" | "unavailable" | "assigned" = "available"
              
              if (eventStatus) {
                switch (eventStatus) {
                  case 'selected':
                    availability = "assigned"
                    break
                  case 'unavailable':
                    availability = "unavailable"
                    break
                  case 'available':
                  case 'not_asked':
                  default:
                    availability = "available"
                    break
                }
              } else if (emp.is_always_needed) {
                availability = "assigned"
              }
              
              return {
                id: emp.id,
                name: emp.name,
                role: emp.role as "allrounder" | "versorger" | "verkauf" | "manager" | "essen",
                skills: [],
                availability
              }
            })
            
            setRealEmployees(transformedEmployees)
            setFilteredEmployees(transformedEmployees.filter((emp: Employee) => emp.availability === "available"))
            console.log(`✅ Work Area Assignment: Loaded ${transformedEmployees.length} employees with statuses (fallback)`)
          }
        }
        
      } catch (error) {
        console.error('Work Area Assignment: Error loading employee statuses:', error)
        // Fallback to mock data on error
        setRealEmployees([])
        setFilteredEmployees(availableEmployees)
      } finally {
        setIsLoading(false)
      }
    }

    loadEmployeeStatuses()
  }, [selectedEvent?.id, dbEmployees.length, fetchEmployeesWithStatus])

  // Update work areas from synced data
  useEffect(() => {
    if (syncedWorkAreas.length > 0) {
      const transformedWorkAreas = syncedWorkAreas.map(area => ({
        id: area.id,
        name: area.name,
        location: area.location,
        requiredRoles: Object.keys(area.role_requirements).filter(role => area.role_requirements[role] > 0),
        maxCapacity: area.max_capacity,
        currentAssigned: area.assigned_employees.length,
        assignedEmployees: area.assigned_employees.map(emp => ({
          id: emp.id,
          name: emp.name,
          role: emp.role as "allrounder" | "versorger" | "verkauf" | "manager" | "essen",
          skills: [],
          availability: "assigned" as const
        }))
      }))
      
      setWorkAreas(transformedWorkAreas)
      console.log(`✅ Work Area Assignment: Updated ${transformedWorkAreas.length} work areas from sync`)
    }
  }, [syncedWorkAreas])

  // Use real employees if available, otherwise fallback to mock data
  const employeesToUse = realEmployees.length > 0 ? realEmployees : availableEmployees


  // Handle search functionality with real employees
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    const availableEmployeesToSearch = employeesToUse.filter(emp => emp.availability === "available")
    
    if (query.trim() === "") {
      setFilteredEmployees(availableEmployeesToSearch)
    } else {
      const filtered = availableEmployeesToSearch.filter(employee =>
        employee.name.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredEmployees(filtered)
    }
  }

  // Handle employee selection for search
  const handleEmployeeSelect = (employeeId: string) => {
    if (selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(prev => prev.filter(id => id !== employeeId))
    } else {
      setSelectedEmployees(prev => [...prev, employeeId])
    }
  }

  // Get selected employees for display with real data
  const getSelectedEmployeesForDisplay = () => {
    const availableEmployeesToShow = employeesToUse.filter(emp => emp.availability === "available")
    
    if (selectedEmployees.length === 0) {
      return availableEmployeesToShow
    }
    return availableEmployeesToShow.filter((emp: Employee) => selectedEmployees.includes(emp.id))
  }

  // Enhanced assign employee with database persistence
  const handleAssignEmployee = useCallback(async (workAreaId: string, employee: Employee) => {
    // Update local state immediately for UI responsiveness
    setWorkAreas((prev: WorkArea[]) =>
      prev.map((area: WorkArea) =>
        area.id === workAreaId
          ? {
            ...area,
            assignedEmployees: [...area.assignedEmployees, { ...employee, availability: "assigned" }],
            currentAssigned: area.currentAssigned + 1,
          }
          : area,
      ),
    )

    // Update employee availability in local state
    setRealEmployees(prev => prev.map(emp => 
      emp.id === employee.id 
        ? { ...emp, availability: "assigned" as const }
        : emp
    ))

    // Update filtered employees to remove the assigned employee
    setFilteredEmployees(prev => prev.filter(emp => emp.id !== employee.id))

    // Update database if we have real data and selected event
    if (selectedEvent?.id && !employee.id.startsWith('EMP')) {
      try {
        console.log(`Work Area Assignment: Updating database for employee ${employee.name} (${employee.id}) in event ${selectedEvent.id}`)
        
        // Use the work area employee status API to update status
        const statusResponse = await fetch('/api/work-areas/employee-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            employeeId: employee.id,
            eventId: selectedEvent.id,
            status: 'selected',
            workAreaId: workAreaId
          })
        })

        if (statusResponse.ok) {
          console.log(`✅ Work Area Assignment: Employee ${employee.name} status updated to 'selected' for event ${selectedEvent.id}`)
        } else {
          console.error('Work Area Assignment: Failed to update employee status via API')
          // Fallback to original methods
          await updateEmployeeStatus(employee.id, selectedEvent.id, 'selected')
          await assignEmployeeToWorkArea(employee.id, workAreaId, selectedEvent.id)
        }
        
      } catch (error) {
        console.error('Work Area Assignment: Failed to update database:', error)
        // Optionally revert local state on database error
      }
    } else if (employee.id.startsWith('EMP')) {
      console.log(`Work Area Assignment: Skipping database update for mock employee ${employee.name}`)
    }
  }, [selectedEvent?.id, updateEmployeeStatus, assignEmployeeToWorkArea])

  // Enhanced remove employee with database persistence
  const handleRemoveEmployee = useCallback(async (workAreaId: string, employeeId: string) => {
    // Find the employee being removed
    const removedEmployee = workAreas
      .find(area => area.id === workAreaId)
      ?.assignedEmployees.find(emp => emp.id === employeeId)

    // Update local state immediately for UI responsiveness
    setWorkAreas((prev: WorkArea[]) =>
      prev.map((area: WorkArea) =>
        area.id === workAreaId
          ? {
            ...area,
            assignedEmployees: area.assignedEmployees.filter((emp: Employee) => emp.id !== employeeId),
            currentAssigned: area.currentAssigned - 1,
          }
          : area,
      ),
    )

    // Update employee availability in local state
    setRealEmployees(prev => prev.map(emp => 
      emp.id === employeeId 
        ? { ...emp, availability: "available" as const }
        : emp
    ))

    // Add employee back to filtered employees if they match search
    if (removedEmployee) {
      const matchesSearch = searchQuery.trim() === "" || 
        removedEmployee.name.toLowerCase().includes(searchQuery.toLowerCase())
      
      if (matchesSearch) {
        setFilteredEmployees(prev => [...prev, { ...removedEmployee, availability: "available" }])
      }
    }

    // Update database if we have real data and selected event
    if (selectedEvent?.id && !employeeId.startsWith('EMP')) {
      try {
        console.log(`Work Area Assignment: Removing employee ${employeeId} from database for event ${selectedEvent.id}`)
        
        // Use the work area employee status API to update status
        const statusResponse = await fetch('/api/work-areas/employee-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            employeeId: employeeId,
            eventId: selectedEvent.id,
            status: 'available'
          })
        })

        if (statusResponse.ok) {
          console.log(`✅ Work Area Assignment: Employee ${employeeId} status updated to 'available' for event ${selectedEvent.id}`)
        } else {
          console.error('Work Area Assignment: Failed to update employee status via API')
          // Fallback to original methods
          await updateEmployeeStatus(employeeId, selectedEvent.id, 'available')
          await removeEmployeeFromWorkArea(employeeId, selectedEvent.id)
        }
        
      } catch (error) {
        console.error('Work Area Assignment: Failed to update database:', error)
        // Optionally revert local state on database error
      }
    } else if (employeeId.startsWith('EMP')) {
      console.log(`Work Area Assignment: Skipping database update for mock employee ${employeeId}`)
    }
  }, [workAreas, searchQuery, selectedEvent?.id, updateEmployeeStatus, removeEmployeeFromWorkArea])

  return {
    // State
    selectedDate,
    workAreas,
    showAdvancedSettings,
    isSearchOpen,
    searchQuery,
    selectedEmployees,
    filteredEmployees,
    availableEmployees: employeesToUse, // Use real employees if available
    realEmployees,
    isLoading,

    // Setters
    setSelectedDate,
    setShowAdvancedSettings,
    setIsSearchOpen,
    setSelectedEmployees,
    setFilteredEmployees,

    // Handlers
    handleSearch,
    handleEmployeeSelect,
    getSelectedEmployeesForDisplay,
    handleAssignEmployee,
    handleRemoveEmployee,
    refreshEmployeeStatuses,
  }
}