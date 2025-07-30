import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Save, BookOpen } from "lucide-react"

interface SaveChoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveNormal: () => void
  onSaveAsTemplate: () => void
}

export function SaveChoiceDialog({
  open,
  onOpenChange,
  onSaveNormal,
  onSaveAsTemplate
}: SaveChoiceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Arbeitsbereiche speichern</DialogTitle>
          <DialogDescription>
            Wie möchten Sie die Arbeitsbereiche speichern?
          </DialogDescription>
        </DialogHeader>
        
        {/* Overwrite Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
          <div className="flex items-start gap-2">
            <div className="h-4 w-4 bg-amber-500 rounded-full mt-0.5 flex-shrink-0"></div>
            <div className="text-sm text-amber-800">
              <strong>Hinweis:</strong> Das Speichern überschreibt alle bestehenden Arbeitsbereiche für dieses Event. 
              Bereits zugewiesene Mitarbeiter werden automatisch entfernt.
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 py-4">
          <Button
            onClick={onSaveNormal}
            className="justify-start gap-3 h-auto p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <Save className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Normal speichern</div>
              <div className="text-sm opacity-90">Überschreibt bestehende Konfiguration für dieses Event</div>
            </div>
          </Button>
          <Button
            onClick={onSaveAsTemplate}
            variant="outline"
            className="justify-start gap-3 h-auto p-4"
          >
            <BookOpen className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Als Vorlage speichern</div>
              <div className="text-sm opacity-90">Für zukünftige Events wiederverwenden</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 