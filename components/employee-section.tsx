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
  onStatusChange: (employeeId: string, newStatus: "available" | "selected" | "unavailable" | "always-needed" | "not-selected") => void
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
  return (
    <div className="overflow-hidden bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
      <EmployeeTable 
        employees={employees} 
        onStatusChange={onStatusChange}
        authorizationMode={authorizationMode}
        selectedForAuth={selectedForAuth}
        setSelectedForAuth={setSelectedForAuth}
        authorizedUsers={authorizedUsers}
      />
    </div>
  )
}
