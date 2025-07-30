"use client"

import { useState, useEffect } from "react"
import { useTemplates } from "@/hooks/use-templates"
import { useEvents } from "@/hooks/use-events"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Users, Euro, Minus, Plus, X, BookOpen, Save, ChevronDown, Clock } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { TimeScheduler } from "./time-scheduler"
import { useToast } from "@/hooks/use-toast"

interface NeueVeranstaltungDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (eventData: any) => void
}

// Template Save Dialog Component
function TemplateSaveDialog({ 
  isOpen, 
  onClose, 
  onSave, 
  formData 
}: { 
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, data: any) => void
  formData: any
}) {
  const [templateName, setTemplateName] = useState("")

  const handleSave = () => {
    if (templateName.trim()) {
      onSave(templateName.trim(), formData)
      setTemplateName("")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <DialogHeader>
          <DialogTitle>Vorlage speichern</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 mb-2">
              Vorlagenname
            </label>
            <Input
              id="templateName"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="z.B. Meine Veranstaltungsvorlage"
              className="w-full"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!templateName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Speichern
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function NeueVeranstaltungDialog({ isOpen, onClose, onSave }: NeueVeranstaltungDialogProps) {
  // Add toast hook for notifications
  const { toast } = useToast()
  
  const { createEvent } = useEvents()
  const { templates, loading: templatesLoading, createTemplate } = useTemplates()
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    dateTime: undefined as Date | undefined,
    requiredEmployees: 1,
    requestEmployees: 1,
    hourlyWage: 15.00,
    description: ""
  })

  const [showTemplateSaveDialog, setShowTemplateSaveDialog] = useState(false)

  // Use static templates as fallback for backward compatibility
  const [staticTemplates, setStaticTemplates] = useState([
    {
      id: "template-1",
      name: "Summer Festival Template",
      data: {
        title: "Summer Festival 2025",
        location: "Emslandarena",
        requiredEmployees: 12,
        requestEmployees: 15,
        hourlyWage: 16.00,
        description: "Outdoor festival with multiple stages and food vendors"
      }
    },
    {
      id: "template-2", 
      name: "Corporate Event Template",
      data: {
        title: "Corporate Conference",
        location: "Emslandhalle",
        requiredEmployees: 8,
        requestEmployees: 10,
        hourlyWage: 18.00,
        description: "Professional conference with catering and technical support"
      }
    },
    {
      id: "template-3",
      name: "Outdoor Event Template", 
      data: {
        title: "Open Air Event",
        location: "Open Air Emslandarena",
        requiredEmployees: 15,
        requestEmployees: 20,
        hourlyWage: 17.00,
        description: "Large outdoor event with mobile stations"
      }
    }
  ])

  const locations = [
    { id: "emslandarena", label: "Emslandarena", icon: "🏟️" },
    { id: "emslandhalle", label: "Emslandhalle", icon: "🏢" },
    { id: "emslandarena-outdoor", label: "Emslandarena draußen", icon: "🏕️" },
  ]

  const handleFormChange = (field: string, value: string | number | Date) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      }
      
      // Auto-sync: When requiredEmployees increases, ensure requestEmployees is at least equal
      if (field === 'requiredEmployees' && typeof value === 'number') {
        if (value > updated.requestEmployees) {
          updated.requestEmployees = value
        }
      }
      
      return updated
    })
  }

  const handleTemplateSelect = (template: any) => {
    // Handle both old static templates and new database templates
    const templateData = template.event_data || template.data
    
    setFormData(prev => ({
      ...prev,
      title: templateData.title || "",
      location: templateData.location || "",
      requiredEmployees: templateData.employees_needed || templateData.requiredEmployees || 1,
      requestEmployees: templateData.employees_to_ask || templateData.requestEmployees || 1,
      hourlyWage: templateData.hourly_rate || templateData.hourlyWage || 15.00,
      description: templateData.description || ""
    }))
  }

  const handleCounterChange = (field: 'requiredEmployees' | 'requestEmployees' | 'hourlyWage', increment: boolean) => {
    setFormData(prev => {
      const currentValue = prev[field]
      let newValue: number
      
      if (field === 'hourlyWage') {
        // Hourly wage in 25ct steps (0.25€)
        newValue = increment 
          ? Math.min(50.00, Math.round((currentValue + 0.25) * 100) / 100)
          : Math.max(5.00, Math.round((currentValue - 0.25) * 100) / 100)
      } else {
        newValue = increment 
          ? Math.min(100, currentValue + 1)
          : Math.max(1, currentValue - 1)
      }
      
      const updated = {
        ...prev,
        [field]: newValue
      }
      
      // Auto-sync: When requiredEmployees changes, ensure requestEmployees is at least equal
      if (field === 'requiredEmployees') {
        if (newValue > updated.requestEmployees) {
          updated.requestEmployees = newValue
        }
      }
      
      return updated
    })
  }

  const handleSave = async () => {
    try {
      // Prepare event data for database
      const eventDataForAPI = {
        title: formData.title,
        location: formData.location,
        event_date: formData.dateTime ? formData.dateTime.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        start_time: formData.dateTime ? formData.dateTime.toTimeString().slice(0, 5) : "12:00",
        end_time: undefined,
        description: formData.description,
        specialties: undefined,
        hourly_rate: formData.hourlyWage,
        employees_needed: formData.requiredEmployees,
        employees_to_ask: formData.requestEmployees,
        status: 'draft' as const
      }

      // Save to database
      const savedEvent = await createEvent(eventDataForAPI)

      // Prepare event data for UI (existing format for compatibility)
      const eventDataForUI = {
        id: savedEvent.id,
        title: savedEvent.title,
        location: savedEvent.location,
        date: savedEvent.event_date,
        time: savedEvent.start_time,
        description: savedEvent.description || "",
        status: savedEvent.status,
        employeesNeeded: savedEvent.employees_needed,
        employeesToAsk: savedEvent.employees_to_ask,
        hourlyRate: savedEvent.hourly_rate
      }
      
      console.log('Event saved successfully:', savedEvent)
      
      // Call the parent callback for UI updates
      onSave(eventDataForUI)
      onClose()
      
      // Show success message
              toast({
          title: "Event erstellt!",
          description: `Event "${savedEvent.title}" wurde erfolgreich erstellt.`,
        })
      
    } catch (error) {
      console.error('Error saving event:', error)
      const errorObj = error as Error
      console.error('Error details:', {
        message: errorObj?.message,
        stack: errorObj?.stack,
        name: errorObj?.name,
        fullError: error
      })
      // Show error message to the user
              toast({
          title: "Fehler beim Speichern",
          description: `Fehler beim Speichern des Events: ${errorObj?.message || 'Unbekannter Fehler'}`,
          variant: "destructive",
        })
    }
  }

  const handleSaveAsTemplate = async (name: string, data: any) => {
    try {
      const templateData = {
        name,
        template_type: 'event' as const,
        location: data.location,
        event_data: {
          title: data.title,
          location: data.location,
          employees_needed: data.requiredEmployees,
          employees_to_ask: data.requestEmployees,
          hourly_rate: data.hourlyWage,
          description: data.description
        },
        work_areas_data: {}
      }

             await createTemplate(templateData)
      console.log("Template saved successfully:", name)
      toast({
        title: `✅ Template "${name}" saved successfully!`,
        description: "Your template has been saved.",
      })
    } catch (error) {
      console.error("Error saving template:", error)
      toast({
        title: `❌ Failed to save template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        description: "Failed to save your template.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl sm:rounded-lg p-0 bg-white shadow-xl fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">

          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="mb-6">
              <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                Neue Veranstaltung erstellen
              </DialogTitle>
              <p className="text-gray-500 text-sm">
                Veranstaltungsdetails einrichten und Arbeitsbereiche konfigurieren
              </p>
            </div>
            <form className="space-y-6">
              {/* Veranstaltungstitel */}
              <div className="space-y-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Veranstaltungstitel
                </label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                  className="h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="z.B. Summer Festival 2025"
                />
              </div>
              {/* Veranstaltungsort */}
              <div className="space-y-2">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Veranstaltungsort
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {locations.map((option) => (
                    <Button
                      key={option.id}
                      type="button"
                      variant={formData.location === option.label ? "default" : "outline"}
                      onClick={() => handleFormChange("location", option.label)}
                      className={`h-11 px-3 text-sm font-medium transition-all duration-200 ${
                        formData.location === option.label 
                          ? "bg-blue-500 text-white hover:bg-blue-600" 
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <span className="mr-2">{option.icon}</span>
                      {option.label}
                    </Button>
                  ))}
                </div>
                <div className="relative">
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleFormChange("location", e.target.value)}
                    className="pl-10 h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="oder eigenen Ort eingeben..."
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
              {/* Datum & Uhrzeit */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Datum & Uhrzeit
                </label>
                <TimeScheduler
                  value={formData.dateTime}
                  onChange={(date) => handleFormChange("dateTime", date)}
                  placeholder="Datum und Uhrzeit wählen"
                  className="h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  showEndTime={false}
                />
              </div>
              {/* Counter Fields Row */}
              <div className="grid grid-cols-3 gap-4">
                {/* Benötigte Mitarbeiter */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Benötigte Mitarbeiter
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCounterChange("requiredEmployees", false)}
                      className="h-10 w-10 rounded-l-lg border-0 hover:bg-gray-50"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 text-center py-2 text-base font-medium">
                      {formData.requiredEmployees}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCounterChange("requiredEmployees", true)}
                      className="h-10 w-10 rounded-r-lg border-0 hover:bg-gray-50"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {/* Mitarbeiter anfragen */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Mitarbeiter anfragen
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCounterChange("requestEmployees", false)}
                      className="h-10 w-10 rounded-l-lg border-0 hover:bg-gray-50"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 text-center py-2 text-base font-medium">
                      {formData.requestEmployees}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCounterChange("requestEmployees", true)}
                      className="h-10 w-10 rounded-r-lg border-0 hover:bg-gray-50"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {/* Stundenlohn */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    Stundenlohn (€)
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCounterChange("hourlyWage", false)}
                      className="h-10 w-10 rounded-l-lg border-0 hover:bg-gray-50"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 text-center py-2 text-base font-medium">
                      {formData.hourlyWage.toFixed(2)}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCounterChange("hourlyWage", true)}
                      className="h-10 w-10 rounded-r-lg border-0 hover:bg-gray-50"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              {/* Beschreibung */}
              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Beschreibung (optional)
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  className="h-24 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                  placeholder="Beschreiben Sie die Veranstaltung... (optional)"
                />
              </div>
              {/* Action Buttons */}
              <div className="flex flex-wrap justify-end items-center gap-2 pt-4 border-t border-gray-100 mt-4">
                <Button
                  type="button"
                  onClick={handleSave}
                  className="gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-sm transition-all duration-200 hover:shadow-md px-6 py-3"
                >
                  <Calendar className="h-4 w-4" />
                  Veranstaltung erstellen
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-10 w-10 p-0 rounded-lg hover:bg-gray-100"
                      title="Vorlage wählen"
                    >
                      <BookOpen className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    {[...templates, ...staticTemplates].map((template) => (
                      <DropdownMenuItem
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col items-start w-full">
                          <span className="font-medium">{template.name}</span>
                          <div className="text-xs text-gray-500 mt-1">
                            {(() => {
                              const templateData = (template as any).event_data || (template as any).data
                              const location = templateData?.location || 'Unknown'
                              const employees = templateData?.employees_needed || templateData?.requiredEmployees || 0
                              const rate = templateData?.hourly_rate || templateData?.hourlyWage || 0
                              return `${location} • ${employees} Mitarbeiter • €${rate.toFixed(2)}`
                            })()}
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  type="button"
                  onClick={() => setShowTemplateSaveDialog(true)}
                  className="h-10 w-10 p-0 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  title="Als Vorlage speichern"
                >
                  <Save className="h-5 w-5" />
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      {/* Template Save Dialog */}
      <TemplateSaveDialog
        isOpen={showTemplateSaveDialog}
        onClose={() => setShowTemplateSaveDialog(false)}
        onSave={handleSaveAsTemplate}
        formData={formData}
      />
    </>
  )
}