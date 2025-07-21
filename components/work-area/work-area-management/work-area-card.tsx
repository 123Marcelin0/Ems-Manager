import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Users, MapPin, Minus, Copy } from "lucide-react"
import type { WorkArea } from "./constants"
import { availableRoles, locations } from "./constants"

interface WorkAreaCardProps {
  area: WorkArea
  selectedLocation: string
  onWorkAreaChange: (id: string, field: keyof WorkArea, value: any) => void
  onRoleCountChange: (areaId: string, roleId: string, change: number) => void
  onRemoveWorkArea: (id: string) => void
  onCloneWorkArea: (area: WorkArea) => void
}

export function WorkAreaCard({
  area,
  selectedLocation,
  onWorkAreaChange,
  onRoleCountChange,
  onRemoveWorkArea,
  onCloneWorkArea
}: WorkAreaCardProps) {
  return (
    <div className={`border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-200 ${
      area.isActive ? 'bg-white' : 'bg-gray-200 opacity-60'
    }`}>
      {/* Area Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Input
            value={area.name}
            onChange={(e) => onWorkAreaChange(area.id, "name", e.target.value)}
            className={`font-semibold border-none p-0 h-auto text-lg focus-visible:ring-0 bg-transparent ${
              !area.isActive ? 'text-gray-500' : 'text-gray-900'
            }`}
            placeholder="Bereichsname"
          />
          <div className="flex items-center gap-2">
            <MapPin className={`h-4 w-4 ${!area.isActive ? 'text-gray-400' : 'text-gray-500'}`} />
            <span className={`text-sm ${!area.isActive ? 'text-gray-400' : 'text-gray-600'}`}>
              {locations.find(l => l.id === area.location)?.label}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 relative z-10">
          {/* Only show switch for non-outdoor locations */}
          {selectedLocation !== "emslandarena-outdoor" && (
            <Switch
              checked={area.isActive}
              onCheckedChange={(checked) => onWorkAreaChange(area.id, "isActive", checked)}
              className="data-[state=checked]:bg-blue-600"
            />
          )}
          
          {/* Show clone button for all locations */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCloneWorkArea(area)}
            className="h-8 w-8 rounded-lg p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            title="Bereich klonen"
          >
            <Copy className="h-4 w-4" />
          </Button>
          
          {/* Always show delete button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveWorkArea(area.id)}
            className="h-8 w-8 rounded-lg p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
            title="Bereich löschen"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Capacity */}
      <div className="space-y-2">
        <Label className={`text-sm font-medium ${!area.isActive ? 'text-gray-500' : 'text-gray-700'}`}>Kapazität</Label>
        <div className="flex items-center gap-2">
          <Users className={`h-4 w-4 ${!area.isActive ? 'text-gray-400' : 'text-gray-500'}`} />
          <Input
            type="number"
            min="1"
            max="20"
            value={area.maxCapacity}
            onChange={(e) => onWorkAreaChange(area.id, "maxCapacity", parseInt(e.target.value) || 1)}
            className="w-20 h-8 text-center"
          />
          <span className={`text-sm ${!area.isActive ? 'text-gray-400' : 'text-gray-600'}`}>Personen</span>
        </div>
      </div>

      {/* Role Requirements - Fixed order with stable keys */}
      <div className="space-y-3">
        <Label className={`text-sm font-medium ${!area.isActive ? 'text-gray-500' : 'text-gray-700'}`}>Rollenanforderungen</Label>
        <div className="space-y-3">
          {availableRoles.map((role) => {
            const count = area.roleRequirements[role.id] || 0
            const totalAssigned = Object.values(area.roleRequirements).reduce((sum, val) => sum + val, 0)
            
            return (
              <div key={`${area.id}-${role.id}`} className={`flex items-center justify-between p-3 rounded-lg ${
                !area.isActive ? 'bg-gray-300' : 'bg-gray-50'
              }`}>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${!area.isActive ? 'bg-gray-400 text-gray-500 border-gray-500' : role.color}`}>
                    {role.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRoleCountChange(area.id, role.id, -1)}
                    disabled={count === 0 || !area.isActive}
                    className="h-7 w-7 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-medium">{count}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRoleCountChange(area.id, role.id, 1)}
                    disabled={totalAssigned >= area.maxCapacity || !area.isActive}
                    className="h-7 w-7 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Status Indicator */}
      <div className="pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className={`text-xs ${!area.isActive ? 'text-gray-400' : 'text-gray-500'}`}>Status</span>
          <Badge className={area.isActive ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-700 border-gray-200"}>
            {area.isActive ? "Aktiv" : "Inaktiv"}
          </Badge>
        </div>
      </div>
    </div>
  )
} 