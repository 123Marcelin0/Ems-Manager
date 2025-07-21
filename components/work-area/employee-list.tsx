"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import type { Employee } from "@/hooks/use-work-area-assignment"

const roleConfig = {
  allrounder: { label: "Allrounder", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  versorger: { label: "Versorger", color: "bg-blue-100 text-blue-700 border-blue-200" },
  verkauf: { label: "Verkauf", color: "bg-amber-100 text-amber-700 border-amber-200" },
  manager: { label: "Manager", color: "bg-red-100 text-red-700 border-red-200" },
  essen: { label: "Essen", color: "bg-gray-100 text-gray-700 border-gray-200" },
}

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
  return (
    <div className="rounded-2xl border border-gray-100/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {selectedEmployees.length > 0 ? "Selected Employees" : "Available Employees"}
        </h2>
        {selectedEmployees.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            className="h-8 gap-2 rounded-lg border-gray-200 bg-white/50 text-xs"
          >
            <X className="h-3 w-3" />
            Clear Selection
          </Button>
        )}
      </div>
      
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {employees.map((employee) => (
          <div key={employee.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl">
            <div>
              <div className="font-medium text-gray-900">{employee.name}</div>
              <div className="text-sm text-gray-600">
                <Badge className={`text-xs mr-2 ${roleConfig[employee.role].color}`}>
                  {roleConfig[employee.role].label}
                </Badge>
                {employee.skills.join(", ")}
              </div>
            </div>
            {selectedEmployees.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEmployeeSelect(employee.id)}
                className="h-8 w-8 rounded-lg p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
      
      {employees.length === 0 && selectedEmployees.length > 0 && (
        <div className="text-center py-8 text-sm text-gray-500">
          No employees selected yet. Use the search above to find and select employees.
        </div>
      )}
    </div>
  )
}