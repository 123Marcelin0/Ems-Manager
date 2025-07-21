"use client"

import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, ChevronDown, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Event {
  id: string
  name: string
  date: string
  employeesNeeded: number
  employeesToAsk: number
  alwaysNeededCount?: number
  status?: string
}

interface EventSelectorButtonProps {
  selectedEvent: Event | null
  events: Event[]
  onEventSelect: (event: Event) => void
  onConfigClick?: () => void
}

export function EventSelectorButton({ selectedEvent, events, onEventSelect, onConfigClick }: EventSelectorButtonProps) {
  const [eventDialogOpen, setEventDialogOpen] = useState(false)

  const handleEventSelect = (event: Event) => {
    onEventSelect(event)
    setEventDialogOpen(false)
  }

  const handleButtonClick = () => {
    // Always open event selection dialog instead of config dialog
    setEventDialogOpen(true)
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleButtonClick}
        className="h-11 px-4 rounded-xl bg-white border border-gray-200 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 flex items-center gap-2"
        aria-label="Select event"
      >
        <Calendar className="h-4 w-4 text-blue-600" />
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-gray-900">
            {selectedEvent ? selectedEvent.name : "Event auswählen"}
          </span>
          {selectedEvent && (
            <span className="text-xs text-gray-600">
              {selectedEvent.date} • {selectedEvent.employeesNeeded} Mitarbeiter
            </span>
          )}
        </div>
        <ChevronDown className="h-3 w-3 text-gray-600 ml-1" />
      </Button>

      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogTitle className="sr-only">Event auswählen</DialogTitle>
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">Event auswählen</h2>
              <p className="text-sm text-gray-600 mt-1">
                Wählen Sie ein Event aus, um die Daten und Konfigurationen zu laden
              </p>
            </div>
            
            <div className="space-y-2">
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Keine Events verfügbar</p>
                </div>
              ) : (
                events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleEventSelect(event)}
                    className={`w-full p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                      selectedEvent?.id === event.id
                        ? "border-blue-300 bg-blue-50/50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{event.name}</h3>
                          {selectedEvent?.id === event.id && (
                            <Check className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{event.date}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {event.employeesNeeded} Mitarbeiter
                          </Badge>
                          {event.status && (
                            <Badge 
                              variant={event.status === "active" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {event.status === "active" ? "Aktiv" : event.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 