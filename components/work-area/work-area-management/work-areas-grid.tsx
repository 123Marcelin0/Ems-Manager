import { WorkAreaCard } from "./work-area-card"
import { EmptyState } from "./empty-state"
import type { WorkArea } from "./constants"

interface WorkAreasGridProps {
  areas: WorkArea[]
  selectedLocation: string
  onWorkAreaChange: (id: string, field: keyof WorkArea, value: any) => void
  onRoleCountChange: (areaId: string, roleId: string, change: number) => void
  onRemoveWorkArea: (id: string) => void
  onCloneWorkArea: (area: WorkArea) => void
  onAddWorkArea: () => void
}

export function WorkAreasGrid({
  areas,
  selectedLocation,
  onWorkAreaChange,
  onRoleCountChange,
  onRemoveWorkArea,
  onCloneWorkArea,
  onAddWorkArea
}: WorkAreasGridProps) {
  if (areas.length === 0 && selectedLocation !== "emslandarena-outdoor") {
    return <EmptyState onAddWorkArea={onAddWorkArea} />
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {areas.map((area) => (
        <WorkAreaCard
          key={area.id}
          area={area}
          selectedLocation={selectedLocation}
          onWorkAreaChange={onWorkAreaChange}
          onRoleCountChange={onRoleCountChange}
          onRemoveWorkArea={onRemoveWorkArea}
          onCloneWorkArea={onCloneWorkArea}
        />
      ))}
    </div>
  )
} 