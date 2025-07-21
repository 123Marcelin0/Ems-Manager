import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import type { Employee } from "@/hooks/use-work-area-assignment"
import { RoleBadge } from "./role-badge"
import type { RoleType } from "./constants"

interface EmployeeCardProps {
  employee: Employee
  isSelected: boolean
  showRemoveButton: boolean
  onEmployeeSelect: (employeeId: string) => void
}

export function EmployeeCard({ 
  employee, 
  isSelected, 
  showRemoveButton, 
  onEmployeeSelect 
}: EmployeeCardProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl">
      <div>
        <div className="font-medium text-gray-900">{employee.name}</div>
        <div className="text-sm text-gray-600">
          <RoleBadge role={employee.role as RoleType} className="mr-2" />
          {employee.skills.join(", ")}
        </div>
      </div>
      {showRemoveButton && (
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
  )
} 