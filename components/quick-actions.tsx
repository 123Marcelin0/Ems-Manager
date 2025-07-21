"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Shuffle, RotateCcw, Info } from "lucide-react"
import type { Event } from "@/components/event-selector"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { EmployeeRecruitmentStatus } from "@/components/employee-recruitment-status"

interface QuickActionsProps {
  requiredEmployees: string
  setRequiredEmployees: (value: string) => void
  onRandomSelection: () => void
  onResetAll: () => void
  selectedEvent: Event | null
  alwaysNeededCount: number
}

export function QuickActions({
  requiredEmployees,
  setRequiredEmployees,
  onRandomSelection,
  onResetAll,
  selectedEvent,
  alwaysNeededCount,
}: QuickActionsProps) {
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)

  return (
    <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-4">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={onResetAll}
          disabled={!selectedEvent}
          className="h-10 w-10 p-0 rounded-lg border-gray-200 bg-white/50 transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50"
          aria-label="Reset all employee statuses"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        
        <Button
          onClick={onRandomSelection}
          disabled={!selectedEvent || !requiredEmployees || Number.parseInt(requiredEmployees) <= 0}
          className="h-10 gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 font-medium shadow-sm transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-md disabled:opacity-50"
          aria-label="Randomly select employees"
        >
          <Shuffle className="h-4 w-4" />
          Zufällige Auswahl
        </Button>
        
        <div className="relative flex-1">
          <Input
            id="required-employees"
            type="number"
            placeholder={selectedEvent ? "# Mitarbeiter auswählen" : "Zuerst Veranstaltung auswählen"}
            value={requiredEmployees}
            onChange={(e) => setRequiredEmployees(e.target.value)}
            className="h-10 w-full rounded-lg border-gray-200 bg-white/50 transition-all duration-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 pr-8"
            min="0"
            disabled={!selectedEvent}
            aria-label="Number of required employees"
          />
        </div>

        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={!selectedEvent}
              className="h-10 w-10 p-0 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              aria-label="Show event status and progress"
            >
              <Info className="h-4 w-4 text-gray-500" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogTitle className="sr-only">Event Status und Fortschritt</DialogTitle>
            <EmployeeRecruitmentStatus selectedEvent={selectedEvent} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
