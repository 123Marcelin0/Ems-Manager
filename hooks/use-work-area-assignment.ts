import { useState } from "react"

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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [workAreas, setWorkAreas] = useState<WorkArea[]>(mockWorkAreas)
  
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>(availableEmployees)


  // Handle search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim() === "") {
      setFilteredEmployees(availableEmployees)
    } else {
      const filtered = availableEmployees.filter(employee =>
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

  // Get selected employees for display
  const getSelectedEmployeesForDisplay = () => {
    if (selectedEmployees.length === 0) {
      return availableEmployees
    }
    return availableEmployees.filter((emp: Employee) => selectedEmployees.includes(emp.id))
  }

  const handleAssignEmployee = (workAreaId: string, employee: Employee) => {
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
  }

  const handleRemoveEmployee = (workAreaId: string, employeeId: string) => {
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
  }

  return {
    // State
    selectedDate,
    workAreas,
    showAdvancedSettings,
    isSearchOpen,
    searchQuery,
    selectedEmployees,
    filteredEmployees,
    availableEmployees,

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
  }
}