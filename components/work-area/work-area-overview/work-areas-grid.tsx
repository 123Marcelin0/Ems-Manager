import { WorkAreaCard } from "../work-area-card"
import type { WorkArea, Employee } from "@/hooks/use-work-area-assignment"

interface WorkAreasGridProps {
  workAreas: WorkArea[]
  availableEmployees: Employee[]
  draggedEmployee: Employee | null
  dragOverArea: string | null
  onAssignEmployee: (workAreaId: string, employee: Employee) => void
  onRemoveEmployee: (workAreaId: string, employeeId: string) => void
  onDragOver: (e: React.DragEvent, areaId: string) => void
  onDragLeave: (e: React.DragEvent, areaId: string) => void
  onDrop: (e: React.DragEvent, areaId: string) => void
  onDragStart: (e: React.DragEvent, employee: Employee, areaId: string) => void
  onDragEnd: () => void
}

export function WorkAreasGrid({
  workAreas,
  availableEmployees,
  draggedEmployee,
  dragOverArea,
  onAssignEmployee,
  onRemoveEmployee,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onDragEnd
}: WorkAreasGridProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {workAreas.map((area) => (
          <WorkAreaCard
            key={area.id}
            area={area}
            availableEmployees={availableEmployees}
            onAssignEmployee={onAssignEmployee}
            onRemoveEmployee={onRemoveEmployee}
            onDragOver={(e) => onDragOver(e, area.id)}
            onDragLeave={(e) => onDragLeave(e, area.id)}
            onDrop={(e) => onDrop(e, area.id)}
            isDragOver={dragOverArea === area.id}
            draggedEmployee={draggedEmployee}
            onDragStart={(e, employee) => onDragStart(e, employee, area.id)}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  )
} 