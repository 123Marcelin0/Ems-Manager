import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import { EventSelectorButton } from "../../event-selector-button"
import type { Event } from "./constants"

interface ManagementHeaderProps {
  selectedEvent: any
  events: Event[]
  isSaved: boolean
  isSaving: boolean
  onEventSelect: (event: Event) => void
  onConfigClick: () => void
  onEmployeesToAskChange: (value: number) => void
  onSaveWorkAreas: () => void
  onContinue: () => void
}

export function ManagementHeader({
  selectedEvent,
  events,
  isSaved,
  isSaving,
  onEventSelect,
  onConfigClick,
  onEmployeesToAskChange,
  onSaveWorkAreas,
  onContinue
}: ManagementHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 bg-blue-50/50 border border-blue-200 rounded-xl shadow-sm">
      {/* Event Selector Button - Left side */}
      <div className="flex items-center gap-4">
        <EventSelectorButton
          selectedEvent={selectedEvent ? {
            id: selectedEvent.id,
            name: selectedEvent.title || 'Event',
            date: selectedEvent.event_date ? new Date(selectedEvent.event_date).toLocaleDateString('de-DE') : '',
            employeesNeeded: selectedEvent.employees_needed || 0,
            employeesToAsk: selectedEvent.employees_to_ask || 0,
            status: selectedEvent.status
          } : null}
                     events={events.map(event => ({
             id: event.id,
             name: (event as any).title || event.name,
             date: (event as any).event_date ? new Date((event as any).event_date).toLocaleDateString('de-DE') : event.date,
             employeesNeeded: (event as any).employees_needed || event.employeesNeeded,
             employeesToAsk: (event as any).employees_to_ask || event.employeesToAsk,
             status: event.status
           }))}
          onEventSelect={onEventSelect}
          onConfigClick={onConfigClick}
        />
        
        {/* Request Button/Counter */}
        {selectedEvent && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Anfragen:</span>
            <input
              type="number"
              min="1"
              value={selectedEvent.employees_to_ask || 1}
              onChange={(e) => onEmployeesToAskChange(parseInt(e.target.value) || 1)}
              className="h-8 w-16 text-center border border-gray-300 bg-white text-sm font-medium text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
          </div>
        )}
      </div>
      
      {/* Save/Continue Button - Right side */}
      <Button
        onClick={isSaved ? onContinue : onSaveWorkAreas}
        disabled={isSaving}
        className="gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 font-medium shadow-sm transition-all duration-200 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50"
      >
        {isSaving ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Speichern...
          </>
        ) : isSaved ? (
          <>
            Fortsetzen
            <svg className="h-4 w-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Speichern
          </>
        )}
      </Button>
    </div>
  )
} 