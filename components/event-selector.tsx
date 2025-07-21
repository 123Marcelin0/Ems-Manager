"use client"

import { useState, useEffect } from "react"
import { FileText, Users, CheckCircle, Play, AlertTriangle, ChevronDown, Send, Clock, Save, Plus, Minus } from "lucide-react"
import { EventSelectorButton } from "./event-selector-button"
import { Button } from "./ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu"

export interface Event {
  id: string
  name: string
  date: string
  employeesNeeded: number
  employeesToAsk: number
  alwaysNeededCount?: number
  status?: string
  recruitmentStatus?: any
}

interface EventSelectorProps {
  events: Event[]
  selectedEvent: Event | null
  onEventSelect: (event: Event) => void
  onEmployeesNeededChange: (eventId: string, needed: number) => void
  onEmployeesToAskChange: (eventId: string, toAsk: number) => void
  onConfigClick?: () => void
  // Save/Continue button props (optional - only used in Mitteilungen)
  isConfigurationComplete?: boolean
  isSaved?: boolean
  isSaving?: boolean
  onSave?: () => void
  onContinue?: () => void
}

const statusConfig = {
  draft: {
    label: "Entwurf",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: FileText,
  },
  recruiting: {
    label: "Rekrutierung",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Users,
  },
  planned: {
    label: "Geplant",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle,
  },
  active: {
    label: "Aktiv",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: Play,
  },
  completed: {
    label: "Abgeschlossen",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Storniert",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: AlertTriangle,
  },
}

export function EventSelector({ 
  events, 
  selectedEvent, 
  onEventSelect, 
  onEmployeesNeededChange,
  onEmployeesToAskChange,
  onConfigClick,
  // Save/Continue button props
  isConfigurationComplete = false,
  isSaved = false,
  isSaving: mitteilungenSaving = false,
  onSave,
  onContinue
}: EventSelectorProps) {
  const [selectedTiming, setSelectedTiming] = useState<string>("14")
  const [isSendNow, setIsSendNow] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
  }

  const handleEventSelect = (event: Event) => {
    onEventSelect(event)
  }

  const handleTimingChange = (value: string) => {
    setSelectedTiming(value)
    setIsSendNow(value === "send-now")
  }

  const getTimingDisplayText = (value: string) => {
    switch (value) {
      case "1": return "1 Tag vorher"
      case "7": return "1 Woche vorher"
      case "14": return "2 Wochen vorher"
      case "21": return "3 Wochen vorher"
      case "28": return "4 Wochen vorher"
      case "send-now": return "Jetzt senden"
      default: return `${value} Tage vorher`
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1500))
      setSaveSuccess(true)
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Reset save success state after animation
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [saveSuccess])

  return (
    <div className="space-y-6">
      {/* Header with selected event info only */}
      <div className="flex items-center justify-between p-6 bg-blue-50/50 border border-blue-200 rounded-xl shadow-sm">
        {/* Event Selector Button - Left side */}
        <div className="flex items-center gap-4">
          <EventSelectorButton
            selectedEvent={selectedEvent}
            events={events}
            onEventSelect={handleEventSelect}
            onConfigClick={onConfigClick}
          />
          
          {/* Request Button/Counter */}
          {selectedEvent && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Anfragen:</span>
              <input
                type="number"
                min="1"
                value={selectedEvent.employeesToAsk ?? 1}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  if (value >= 1) {
                    onEmployeesToAskChange(selectedEvent.id, value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    onEmployeesToAskChange(selectedEvent.id, (selectedEvent.employeesToAsk ?? 1) + 1);
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    onEmployeesToAskChange(selectedEvent.id, Math.max(1, (selectedEvent.employeesToAsk ?? 1) - 1));
                  }
                }}
                className="h-8 w-16 text-center border border-gray-300 bg-white text-sm font-medium text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
            </div>
          )}
        </div>
        
        {/* Timing controls - Right side */}
        {selectedEvent && (
          <div className="flex items-center gap-3">
            {/* Professional Timing Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="font-medium px-4 py-3 rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 justify-between min-w-[140px]"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {getTimingDisplayText(selectedTiming)}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* Send Now Option */}
                <DropdownMenuLabel className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  Sofortige Aktion
                </DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => handleTimingChange("send-now")}
                  className={`cursor-pointer ${selectedTiming === "send-now" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  <Send className="h-4 w-4 mr-2 text-blue-600" />
                  Jetzt senden
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Short Term Options */}
                <DropdownMenuLabel className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  Kurzfristig
                </DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => handleTimingChange("1")}
                  className={`cursor-pointer ${selectedTiming === "1" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  1 Tag vorher
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleTimingChange("2")}
                  className={`cursor-pointer ${selectedTiming === "2" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  2 Tage vorher
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleTimingChange("3")}
                  className={`cursor-pointer ${selectedTiming === "3" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  3 Tage vorher
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleTimingChange("4")}
                  className={`cursor-pointer ${selectedTiming === "4" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  4 Tage vorher
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleTimingChange("5")}
                  className={`cursor-pointer ${selectedTiming === "5" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  5 Tage vorher
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleTimingChange("6")}
                  className={`cursor-pointer ${selectedTiming === "6" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  6 Tage vorher
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleTimingChange("7")}
                  className={`cursor-pointer ${selectedTiming === "7" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  1 Woche vorher
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Medium Term Options */}
                <DropdownMenuLabel className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  Mittelfristig
                </DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => handleTimingChange("8")}
                  className={`cursor-pointer ${selectedTiming === "8" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  8 Tage vorher
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleTimingChange("9")}
                  className={`cursor-pointer ${selectedTiming === "9" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  9 Tage vorher
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleTimingChange("10")}
                  className={`cursor-pointer ${selectedTiming === "10" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  10 Tage vorher
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleTimingChange("11")}
                  className={`cursor-pointer ${selectedTiming === "11" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  11 Tage vorher
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleTimingChange("12")}
                  className={`cursor-pointer ${selectedTiming === "12" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  12 Tage vorher
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleTimingChange("13")}
                  className={`cursor-pointer ${selectedTiming === "13" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  13 Tage vorher
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleTimingChange("14")}
                  className={`cursor-pointer ${selectedTiming === "14" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  2 Wochen vorher
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Long Term Options */}
                <DropdownMenuLabel className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  Langfristig
                </DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => handleTimingChange("21")}
                  className={`cursor-pointer ${selectedTiming === "21" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  3 Wochen vorher
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleTimingChange("28")}
                  className={`cursor-pointer ${selectedTiming === "28" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  4 Wochen vorher
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Save/Send Button - Conditional based on usage context */}
            {isConfigurationComplete ? (
              /* Mitteilungen Save/Continue Button */
              <Button 
                onClick={isSaved ? onContinue : onSave}
                disabled={mitteilungenSaving}
                className="gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 font-medium shadow-sm transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-md px-4 py-3 disabled:opacity-50"
              >
                {mitteilungenSaving ? (
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
            ) : (
              /* Original Save/Send Button */
              <Button 
                onClick={isSendNow ? handleSave : handleSave}
                disabled={isSaving || saveSuccess}
                className={`group relative overflow-hidden font-medium px-4 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 text-white gap-2 ${
                  saveSuccess 
                    ? 'bg-green-600 scale-105' 
                    : isSaving 
                      ? 'bg-gradient-to-r from-blue-400 to-blue-500' 
                      : isSendNow 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
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
                  ) : isSendNow ? (
                  <>
                    <Send className="h-4 w-4" />
                      <span>Senden</span>
                  </>
                ) : (
                    <>
                      <Save className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                      <span>Speichern</span>
                    </>
                )}
                </div>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}