import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface ConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedEvent: any
  events: any[]
  onEventSelect: (eventId: string) => void
}

export function ConfigDialog({
  open,
  onOpenChange,
  selectedEvent,
  events,
  onEventSelect
}: ConfigDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Event auswählen</DialogTitle>
          <DialogDescription>
            Wählen Sie das Event, für das Sie die Arbeitsbereiche konfigurieren möchten.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="event-select">Event</Label>
            <select
              id="event-select"
              value={selectedEvent?.id || ''}
              onChange={(e) => {
                const eventId = e.target.value;
                if (eventId) {
                  onEventSelect(eventId);
                  onOpenChange(false);
                }
              }}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Bitte wählen Sie ein Event</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.title} ({new Date(event.event_date).toLocaleDateString('de-DE')})
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter className="flex flex-row justify-end gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (selectedEvent?.id) {
                onEventSelect(selectedEvent.id);
                onOpenChange(false);
              }
            }}
            disabled={!selectedEvent?.id}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            Event auswählen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 