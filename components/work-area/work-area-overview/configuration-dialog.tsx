import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Check } from "lucide-react"

interface ConfigurationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  events: any[]
  onEventSelect: (eventId: string) => void
  setActiveView?: (view: string) => void
}

export function ConfigurationDialog({
  open,
  onOpenChange,
  events,
  onEventSelect,
  setActiveView
}: ConfigurationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle className="text-center">Event auswählen</DialogTitle>
        <div className="grid gap-4 mt-4">
          {events.map((event) => (
            <Button
              key={event.id}
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                // Transform the event to match the expected format
                const transformedEvent = {
                  id: event.id,
                  name: event.title || '',
                  date: event.event_date ? new Date(event.event_date).toLocaleDateString() : new Date().toLocaleDateString(),
                  employeesNeeded: event.employees_needed || 0,
                  employeesToAsk: event.employees_to_ask || 0,
                  status: event.status || ''
                };
                setActiveView?.("event"); // Navigate back to event selection to update
                onOpenChange(false);
              }}
            >
              <Check className="h-4 w-4 mr-2" />
              {event.title || ''}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
} 