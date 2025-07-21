import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, BookOpen, ChevronDown } from "lucide-react"
import type { Template } from "./constants"

interface ActionsSectionProps {
  selectedLocation: string
  templates: Template[]
  isSaved: boolean
  onAddWorkArea: () => void
  onLoadTemplate: (template: Template) => void
}

export function ActionsSection({
  selectedLocation,
  templates,
  isSaved,
  onAddWorkArea,
  onLoadTemplate
}: ActionsSectionProps) {
  return (
    <div className="flex items-center justify-between pt-2">
      <div className="flex gap-3">
        {/* Add Work Area Button */}
        <Button
          onClick={onAddWorkArea}
          className="gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 font-medium shadow-sm transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-md px-6 py-2.5"
        >
          <Plus className="h-4 w-4" />
          Bereich hinzufügen
        </Button>
        
        {/* Templates Dropdown - Only for non-outdoor */}
        {selectedLocation !== "emslandarena-outdoor" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 rounded-xl border-gray-200 hover:bg-gray-50 px-6 py-2.5">
                <BookOpen className="h-4 w-4" />
                Vorlagen
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {templates.filter(t => t.location === selectedLocation).length > 0 ? (
                templates
                  .filter(t => t.location === selectedLocation)
                  .map((template) => (
                    <DropdownMenuItem 
                      key={template.id}
                      onClick={() => onLoadTemplate(template)}
                      className="flex flex-col items-start gap-1 py-3"
                    >
                      <span className="font-medium">{template.name}</span>
                      <span className="text-xs text-gray-500">
                        {template.workAreas.length} Bereiche • {template.createdAt}
                      </span>
                    </DropdownMenuItem>
                  ))
              ) : (
                <DropdownMenuItem disabled>
                  Keine Vorlagen für diesen Standort
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Status Info */}
      <div className="text-sm text-gray-600">
        {isSaved 
          ? "Klicken Sie auf \"Fortsetzen\", um mit der Übersicht fortzufahren"
          : "Klicken Sie auf \"Speichern\", um die Konfiguration zu speichern"
        }
      </div>
    </div>
  )
} 