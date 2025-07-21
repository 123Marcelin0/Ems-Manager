import type { Employee } from "@/hooks/use-work-area-assignment"
import { EmployeeCard } from "./employee-card"

interface EmployeeGridProps {
  employees: Employee[]
  selectedEmployees: string[]
  onEmployeeSelect: (employeeId: string) => void
}

export function EmployeeGrid({ employees, selectedEmployees, onEmployeeSelect }: EmployeeGridProps) {
  const showRemoveButtons = selectedEmployees.length > 0

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {employees.map((employee) => (
        <EmployeeCard
          key={employee.id}
          employee={employee}
          isSelected={selectedEmployees.includes(employee.id)}
          showRemoveButton={showRemoveButtons}
          onEmployeeSelect={onEmployeeSelect}
        />
      ))}
    </div>
  )
} 