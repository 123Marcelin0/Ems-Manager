import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface EmployeeListHeaderProps {
  selectedCount: number
  onClearSelection: () => void
}

export function EmployeeListHeader({ selectedCount, onClearSelection }: EmployeeListHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-gray-900">
        {selectedCount > 0 ? "Selected Employees" : "Available Employees"}
      </h2>
      {selectedCount > 0 && (
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
  )
} 