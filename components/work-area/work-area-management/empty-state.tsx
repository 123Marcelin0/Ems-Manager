import { Button } from "@/components/ui/button"
import { Plus, Users } from "lucide-react"

interface EmptyStateProps {
  onAddWorkArea: () => void
}

export function EmptyState({ onAddWorkArea }: EmptyStateProps) {
  return (
    <div className="text-center py-12 bg-gray-50/50 rounded-2xl">
      <div className="text-gray-400 mb-4">
        <Users className="h-12 w-12 mx-auto" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Arbeitsbereiche</h3>
      <p className="text-gray-600 mb-4">Erstellen Sie Ihren ersten Arbeitsbereich</p>
      <Button
        onClick={onAddWorkArea}
        className="gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 font-medium shadow-sm transition-all duration-200 hover:from-blue-600 hover:to-blue-700"
      >
        <Plus className="h-4 w-4" />
        Bereich hinzufügen
      </Button>
    </div>
  )
} 