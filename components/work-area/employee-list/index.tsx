"use client"

import type { Employee } from "@/hooks/use-work-area-assignment"
import { EmployeeListHeader } from "./employee-list-header"
import { EmployeeGrid } from "./employee-grid"
import { EmployeeListEmpty } from "./employee-list-empty"

interface EmployeeListProps {
  employees: Employee[]
  selectedEmployees: string[]
  searchQuery: string
  onEmployeeSelect: (employeeId: string) => void
  onClearSelection: () => void
}

export function EmployeeList({ 
  employees, 
  selectedEmployees, 
  searchQuery, 
  onEmployeeSelect, 
  onClearSelection 
}: EmployeeListProps) {
  const isEmpty = employees.length === 0 && selectedEmployees.length > 0

  return (
    <div className="rounded-2xl border border-gray-100/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
      <EmployeeListHeader
        selectedCount={selectedEmployees.length}
        onClearSelection={onClearSelection}
      />
      
      <EmployeeGrid
        employees={employees}
        selectedEmployees={selectedEmployees}
        onEmployeeSelect={onEmployeeSelect}
      />
      
      <EmployeeListEmpty hasSelection={isEmpty} />
    </div>
  )
} 