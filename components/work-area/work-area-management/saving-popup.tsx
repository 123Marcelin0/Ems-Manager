import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

interface SavingPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  showSuccessState: boolean
}

export function SavingPopup({
  open,
  onOpenChange,
  showSuccessState
}: SavingPopupProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="sr-only">
          {showSuccessState ? "Arbeitsbereiche gespeichert" : "Arbeitsbereiche werden gespeichert"}
        </DialogTitle>
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="relative">
            {showSuccessState ? (
              <>
                <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="absolute inset-0 rounded-full bg-green-200 animate-pulse opacity-30"></div>
              </>
            ) : (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <div className="absolute inset-0 rounded-full bg-blue-100 animate-pulse opacity-50"></div>
              </>
            )}
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {showSuccessState ? "Arbeitsbereiche gespeichert!" : "Arbeitsbereiche werden gespeichert"}
            </h3>
            <p className="text-sm text-gray-600">
              {showSuccessState ? "Erfolgreich gespeichert" : "Bitte warten Sie einen Moment..."}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 