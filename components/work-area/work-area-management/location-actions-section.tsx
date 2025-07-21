import { LocationSelector } from "./location-selector"
import { ActionsSection } from "./actions-section"
import type { Template } from "./constants"

interface LocationActionsSectionProps {
  selectedLocation: string
  onLocationChange: (location: string) => void
  templates: Template[]
  isSaved: boolean
  onAddWorkArea: () => void
  onLoadTemplate: (template: Template) => void
}

export function LocationActionsSection({
  selectedLocation,
  onLocationChange,
  templates,
  isSaved,
  onAddWorkArea,
  onLoadTemplate
}: LocationActionsSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Standort & Aktionen</h3>
            <p className="text-sm text-gray-600 mt-1">
              Wählen Sie den Veranstaltungsort und verwalten Sie Arbeitsbereiche
            </p>
          </div>
        </div>

        {/* Location Selection */}
        <LocationSelector 
          selectedLocation={selectedLocation}
          onLocationChange={onLocationChange}
        />

        {/* Action Buttons */}
        <ActionsSection
          selectedLocation={selectedLocation}
          templates={templates}
          isSaved={isSaved}
          onAddWorkArea={onAddWorkArea}
          onLoadTemplate={onLoadTemplate}
        />
      </div>
    </div>
  )
} 