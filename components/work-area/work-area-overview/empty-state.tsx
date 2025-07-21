import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"

interface EmptyStateProps {
  onConfigureWorkAreas: () => void
}

export function EmptyState({ onConfigureWorkAreas }: EmptyStateProps) {
  return (
    <div className="p-8 text-center text-gray-500">
      <div className="mb-4">
        <MapPin className="h-12 w-12 text-gray-300 mx-auto" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Arbeitsbereiche konfiguriert</h3>
      <p className="text-gray-600 mb-4">
        Für dieses Event wurden noch keine Arbeitsbereiche eingerichtet.
      </p>
      <Button 
        onClick={onConfigureWorkAreas}
        className="bg-blue-600 hover:bg-blue-700"
      >
        Arbeitsbereiche konfigurieren
      </Button>
    </div>
  )
} 