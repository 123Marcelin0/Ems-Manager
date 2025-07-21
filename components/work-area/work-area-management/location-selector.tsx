import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { locations } from "./constants"

interface LocationSelectorProps {
  selectedLocation: string
  onLocationChange: (location: string) => void
}

export function LocationSelector({ selectedLocation, onLocationChange }: LocationSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">Veranstaltungsort</label>
      <RadioGroup value={selectedLocation} onValueChange={onLocationChange} className="grid grid-cols-3 gap-3">
        {locations.map((location) => (
          <div key={location.id} className="relative">
            <RadioGroupItem 
              value={location.id} 
              id={location.id} 
              className="peer sr-only"
            />
            <Label 
              htmlFor={location.id} 
              className="flex items-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl cursor-pointer transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/30 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 peer-data-[state=checked]:shadow-sm"
            >
              <span className="text-lg">{location.icon}</span>
              <span className="font-medium text-gray-900 text-sm">{location.label}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
} 