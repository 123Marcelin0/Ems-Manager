import { Button } from "@/components/ui/button"
import { Zap, RotateCcw, Save, CheckCircle } from "lucide-react"
import { EventSelectorButton } from "../../event-selector-button"

interface EventHeaderProps {
  selectedEvent: any
  events: any[]
  allEmployeesDistributed: boolean
  isSaving: boolean
  saveSuccess: boolean
  onEventSelect: (event: any) => void
  onConfigClick: () => void
  onEmployeesToAskChange: (value: number) => void
  onAutoAssign: () => void
  onRedoAssignment: () => void
  onSave: () => void
}

export function EventHeader({
  selectedEvent,
  events,
  allEmployeesDistributed,
  isSaving,
  saveSuccess,
  onEventSelect,
  onConfigClick,
  onEmployeesToAskChange,
  onAutoAssign,
  onRedoAssignment,
  onSave
}: EventHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 bg-blue-50/50 border border-blue-200 rounded-xl shadow-sm mb-6">
      {/* Left side - Event Information */}
      {selectedEvent && (
        <div className="flex items-center gap-4">
          <EventSelectorButton
            selectedEvent={selectedEvent ? {
              id: selectedEvent.id || '',
              name: selectedEvent.name || 'Event',
              date: selectedEvent.date || '',
              employeesNeeded: selectedEvent.employeesNeeded || 0,
              employeesToAsk: selectedEvent.employeesToAsk || 0,
              status: selectedEvent.status || ''
            } : null}
            events={events.map(event => ({
              id: event.id,
              name: event.title || '',
              date: event.event_date ? new Date(event.event_date).toLocaleDateString('de-DE') : new Date().toLocaleDateString('de-DE'),
              employeesNeeded: event.employees_needed || 0,
              employeesToAsk: event.employees_to_ask || 0,
              status: event.status || ''
            }))}
            onEventSelect={onEventSelect}
            onConfigClick={onConfigClick}
          />
          
          {/* Request Counter */}
          {selectedEvent && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Anfragen:</span>
              <input
                type="number"
                min="1"
                value={selectedEvent.employeesToAsk || 1}
                onChange={(e) => onEmployeesToAskChange(parseInt(e.target.value) || 1)}
                className="h-8 w-16 text-center border border-gray-300 bg-white text-sm font-medium text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
            </div>
          )}
        </div>
      )}

      {/* Right side - Action Buttons */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Auto-Assign Button / Save Button */}
        {allEmployeesDistributed ? (
          <Button
            onClick={onSave}
            disabled={isSaving || saveSuccess}
            className={`group relative overflow-hidden font-medium px-4 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 ${
              saveSuccess 
                ? 'bg-green-600 text-white scale-105' 
                : isSaving 
                  ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white' 
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
            }`}
          >
            <div className="relative flex items-center gap-2">
              {saveSuccess ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Gespeichert!</span>
                </>
              ) : isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Speichert...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                  <span>Speichern</span>
                </>
              )}
            </div>
          </Button>
        ) : (
          <Button
            onClick={onAutoAssign}
            variant="outline"
            className="group relative overflow-hidden bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-purple-300 text-gray-700 hover:text-purple-700 font-medium px-4 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105"
          >
            <div className="relative flex items-center gap-2">
              <Zap className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
              <span>Zuteilen</span>
            </div>
          </Button>
        )}

        {/* Redo Button */}
        <Button
          onClick={onRedoAssignment}
          variant="outline"
          size="sm"
          disabled={isSaving}
          className="group relative overflow-hidden bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-purple-300 text-gray-700 hover:text-purple-700 h-10 w-10 p-0 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
        </Button>
      </div>
    </div>
  )
} 