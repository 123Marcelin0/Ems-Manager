import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface TemplateSaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateName: string
  onTemplateNameChange: (name: string) => void
  onSaveTemplate: () => void
  onSaveWithoutTemplate: () => void
}

export function TemplateSaveDialog({
  open,
  onOpenChange,
  templateName,
  onTemplateNameChange,
  onSaveTemplate,
  onSaveWithoutTemplate
}: TemplateSaveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Als Vorlage speichern?</DialogTitle>
          <DialogDescription>
            Möchten Sie diese Konfiguration als Vorlage speichern? Sie können ihr einen Namen geben und später wiederverwenden.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Vorlagenname</Label>
            <Input
              id="template-name"
              placeholder="z.B. Standard Event Setup"
              value={templateName}
              onChange={(e) => onTemplateNameChange(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="flex flex-row justify-end gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onSaveWithoutTemplate}
          >
            Nur speichern
          </Button>
          <Button 
            type="button" 
            onClick={onSaveTemplate}
            disabled={!templateName.trim()}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            Als Vorlage speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 