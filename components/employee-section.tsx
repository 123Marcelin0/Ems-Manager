"use client"

import { EmployeeFilters } from "./employee-filters"
import { EmployeeTable } from "./employee-table"
import { ActionButtons } from "./action-buttons"

interface Employee {
  id: string
  name: string
  userId: string
  lastSelection: string
  status: string
  notes: string
}

interface EmployeeSectionProps {
  employees: Employee[]
  activeFilter: string
  setActiveFilter: (filter: string) => void
  stats: {
    total: number
    available: number
    selected: number
    unavailable: number
  }
  onStatusChange: (employeeId: string, newStatus: string) => void
  authorizationMode: boolean
  selectedForAuth: string[]
  setSelectedForAuth: (selected: string[]) => void
  authorizedUsers: string[]
}

export function EmployeeSection({
  employees,
  activeFilter,
  setActiveFilter,
  stats,
  onStatusChange,
  authorizationMode,
  selectedForAuth,
  setSelectedForAuth,
  authorizedUsers,
}: EmployeeSectionProps) {
  
  // Define status priority order for sorting
  const statusPriority = {
    "available": 1,        // Verfügbar - highest priority
    "always-needed": 2,    // Immer Gebraucht - second priority  
    "selected": 3,         // Ausgewählt - third priority
    "unavailable": 4,      // Nicht Verfügbar - fourth priority
    "not-selected": 5      // Nicht Ausgewählt - lowest priority
  }
  
  // Sort employees by status priority, then by name
  const sortedEmployees = [...employees].sort((a, b) => {
    const priorityA = statusPriority[a.status as keyof typeof statusPriority] || 999
    const priorityB = statusPriority[b.status as keyof typeof statusPriority] || 999
    
    // First sort by status priority
    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }
    
    // If same status, sort alphabetically by name
    return a.name.localeCompare(b.name)
  })
  
  return (
    <div className="overflow-hidden bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
      <EmployeeTable 
        employees={sortedEmployees} 
        onStatusChange={onStatusChange}
        authorizationMode={authorizationMode}
        selectedForAuth={selectedForAuth}
        setSelectedForAuth={setSelectedForAuth}
        authorizedUsers={authorizedUsers}
      />
    </div>
  )
}
