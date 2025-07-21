import { useCallback } from 'react'
import type { WorkArea, Employee } from "@/hooks/use-work-area-assignment"

interface UseAutoAssignmentProps {
  workAreas: WorkArea[]
  availableEmployees: Employee[]
  onAssignEmployee: (workAreaId: string, employee: Employee) => void
  onRemoveEmployee: (workAreaId: string, employeeId: string) => void
}

export function useAutoAssignment({
  workAreas,
  availableEmployees,
  onAssignEmployee,
  onRemoveEmployee
}: UseAutoAssignmentProps) {
  // Auto-assignment logic
  const handleAutoAssign = useCallback((shuffle = false) => {
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
  }, [workAreas, availableEmployees, onAssignEmployee])

  // Redo assignment - unassign all and reassign with variation
  const handleRedoAssignment = useCallback(() => {
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
  }, [workAreas, onRemoveEmployee, handleAutoAssign])

  return {
    handleAutoAssign,
    handleRedoAssignment
  }
} 