"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, X, Trash2, Users, Plus } from "lucide-react"

interface WorkArea {
  id: string
  name: string
  isActive: boolean
  roleRequirements: string[]
}

interface AdvancedSettingsProps {
  onBack: () => void
}

export function AdvancedSettings({ onBack }: AdvancedSettingsProps) {
  const [locationSettings, setLocationSettings] = useState({
    indoor: true,
    outdoor: false,
  })

  const [eventLocation, setEventLocation] = useState("emslandarena")
  const [mobileCountersEnabled, setMobileCountersEnabled] = useState(false)

  const [workAreas, setWorkAreas] = useState<WorkArea[]>([
    { id: "1", name: "New Area", isActive: false, roleRequirements: [] },
    { id: "2", name: "New Area", isActive: false, roleRequirements: [] },
  ])

  const handleAddWorkArea = () => {
    const newArea: WorkArea = {
      id: Date.now().toString(),
      name: "New Area",
      isActive: false,
      roleRequirements: [],
    }
    setWorkAreas([...workAreas, newArea])
  }

  const handleRemoveWorkArea = (id: string) => {
    setWorkAreas(workAreas.filter((area) => area.id !== id))
  }

  const handleWorkAreaChange = (id: string, field: keyof WorkArea, value: any) => {
    setWorkAreas(workAreas.map((area) => (area.id === id ? { ...area, [field]: value } : area)))
  }

  const handleSave = () => {
    // Save settings logic here
    console.log("Saving settings:", {
      locationSettings,
      eventLocation,
      mobileCountersEnabled,
      workAreas,
    })
    onBack()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="h-9 w-9 rounded-lg p-0 hover:bg-gray-100">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Advanced Settings</h2>
              <p className="text-sm text-gray-600">Configure workplaces and locations</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onBack} className="h-9 w-9 rounded-lg p-0 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-8">
            {/* Location Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Location</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl">
                  <Label htmlFor="indoor" className="text-blue-600 font-medium cursor-pointer">
                    Indoor
                  </Label>
                  <Switch
                    id="indoor"
                    checked={locationSettings.indoor}
                    onCheckedChange={(checked) => setLocationSettings((prev) => ({ ...prev, indoor: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl">
                  <Label htmlFor="outdoor" className="font-medium cursor-pointer">
                    Outdoor
                  </Label>
                  <Switch
                    id="outdoor"
                    checked={locationSettings.outdoor}
                    onCheckedChange={(checked) => setLocationSettings((prev) => ({ ...prev, outdoor: checked }))}
                  />
                </div>
              </div>
            </div>

            {/* Event Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Event Location</h3>
              <RadioGroup value={eventLocation} onValueChange={setEventLocation}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="emslandarena" id="emslandarena" />
                  <Label htmlFor="emslandarena" className="font-medium cursor-pointer">
                    Emslandarena
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="emslandhalle" id="emslandhalle" />
                  <Label htmlFor="emslandhalle" className="font-medium cursor-pointer">
                    Emslandhalle
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Mobile Counters */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Mobile Counters</h3>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mobile-counters"
                  checked={mobileCountersEnabled}
                  onCheckedChange={(checked) => setMobileCountersEnabled(checked as boolean)}
                />
                <Label htmlFor="mobile-counters" className="font-medium cursor-pointer">
                  Activate Mobile Counters
                </Label>
              </div>
            </div>

            {/* Work Areas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Work Areas</h3>
                  <p className="text-sm text-gray-600">QWEF</p>
                </div>
                <Button
                  onClick={handleAddWorkArea}
                  className="gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 font-medium shadow-sm transition-all duration-200 hover:from-blue-600 hover:to-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Area
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {workAreas.map((area) => (
                  <div key={area.id} className="border border-gray-200 rounded-xl p-4 space-y-4 bg-white">
                    <div className="flex items-center justify-between">
                      <Input
                        value={area.name}
                        onChange={(e) => handleWorkAreaChange(area.id, "name", e.target.value)}
                        className="font-medium border-none p-0 h-auto text-lg focus-visible:ring-0"
                        placeholder="Area name"
                      />
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={area.isActive}
                          onCheckedChange={(checked) => handleWorkAreaChange(area.id, "isActive", checked)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveWorkArea(area.id)}
                          className="h-8 w-8 rounded-lg p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full gap-2 rounded-xl border-gray-200 bg-gray-50/50 font-medium transition-all duration-200 hover:bg-gray-100"
                    >
                      <Users className="h-4 w-4" />
                      Role Requirements
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50/50">
          <Button
            onClick={handleSave}
            className="flex-1 gap-2 rounded-xl bg-gray-900 font-medium transition-all duration-200 hover:bg-gray-800 mr-3"
          >
            Save as Default
          </Button>
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              className="gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 font-medium shadow-sm transition-all duration-200 hover:from-blue-600 hover:to-blue-700"
            >
              Save
            </Button>
            <Button
              variant="outline"
              onClick={onBack}
              className="rounded-xl border-gray-200 bg-white font-medium transition-all duration-200 hover:bg-gray-50"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
