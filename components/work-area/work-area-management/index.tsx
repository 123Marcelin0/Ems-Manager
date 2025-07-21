"use client"

import { useState, useEffect } from "react"
import { useWorkAreas } from "@/hooks/use-work-areas"
import { useToast } from "@/hooks/use-toast"
import { useEventContext } from "@/hooks/use-event-context"

// Components
import { ManagementHeader } from "./management-header"
import { LocationActionsSection } from "./location-actions-section"
import { WorkAreasGrid } from "./work-areas-grid"
import { ConfigDialog } from "./config-dialog"
import { SaveChoiceDialog } from "./save-choice-dialog"
import { SavingPopup } from "./saving-popup"
import { TemplateSaveDialog } from "./template-save-dialog"

// Types and utilities
import type { WorkArea, Template, Event } from "./constants"
import { locations, availableRoles } from "./constants"
import { useDefaultAreas } from "./use-default-areas"

interface WorkAreaManagementProps {
  onContinue: () => void
  onWorkAreasSaved?: () => void
}

export function WorkAreaManagement({ onContinue, onWorkAreasSaved }: WorkAreaManagementProps) {
  const { toast } = useToast()
  const { selectedEvent, setSelectedEvent, events: contextEvents } = useEventContext()
  const { workAreas: dbWorkAreas, loading, error, fetchWorkAreasByEvent, saveWorkAreasForEvent, createWorkArea } = useWorkAreas()
  const { initializeRoleRequirements, getLocationDefaults } = useDefaultAreas()

  // Transform context events to match the expected format
  const events = contextEvents.map(evt => ({
    id: evt.id,
    title: evt.title || evt.name,
    event_date: evt.event_date || '',
    employees_needed: evt.employees_needed || evt.employeesNeeded,
    employees_to_ask: evt.employees_to_ask || evt.employeesToAsk,
    status: evt.status
  }))

  // State management
  const [selectedLocation, setSelectedLocation] = useState("emslandarena")
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [showSavingPopup, setShowSavingPopup] = useState(false)
  const [showSuccessState, setShowSuccessState] = useState(false)
  const [showSaveChoiceDialog, setShowSaveChoiceDialog] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [workAreas, setWorkAreas] = useState<WorkArea[]>([])
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  // Template state
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: "template-1",
      name: "Standard Event Setup",
      location: "emslandarena",
      workAreas: [],
      createdAt: "2025-01-15"
    },
    {
      id: "template-2", 
      name: "Food Festival Layout",
      location: "emslandhalle",
      workAreas: [],
      createdAt: "2025-01-14"
    }
  ])

  // Separate state for outdoor mobile areas
  const [mobileAreas, setMobileAreas] = useState<WorkArea[]>([
    {
      id: "mobile-1",
      name: "Mobile Theke 1",
      location: "emslandarena-outdoor",
      isActive: true,
      maxCapacity: 3,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 0 }
    },
    {
      id: "mobile-2",
      name: "Mobile Theke 2",
      location: "emslandarena-outdoor",
      isActive: true,
      maxCapacity: 3,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 0 }
    }
  ])

  // Load work areas for selected event
  useEffect(() => {
    const loadWorkAreas = async () => {
      if (selectedEvent?.id) {
        setIsDataLoaded(false)
        setIsSaved(false)
        
        try {
          await fetchWorkAreasByEvent(selectedEvent.id)
        } catch (error) {
          console.error('Failed to fetch work areas:', error)
          toast({
            title: "Fehler beim Laden",
            description: "Arbeitsbereiche konnten nicht geladen werden.",
            variant: "destructive"
          })
        }
      }
    }
    
    loadWorkAreas()
  }, [selectedEvent?.id, fetchWorkAreasByEvent, toast])

  // Transform and set work areas when database data changes
  useEffect(() => {
    if (selectedEvent?.id && !isDataLoaded) {
      const transformedDbAreas = dbWorkAreas.map(area => ({
        id: area.id,
        name: area.name,
        location: area.location,
        isActive: area.is_active,
        maxCapacity: area.max_capacity,
        currentAssigned: 0,
        roleRequirements: {
          ...initializeRoleRequirements(),
          ...area.role_requirements
        },
        isFromDatabase: true
      }))

      if (transformedDbAreas.length > 0) {
        setWorkAreas(transformedDbAreas)
        setSelectedLocation(transformedDbAreas[0].location)
      } else {
        const defaults = getLocationDefaults(selectedLocation)
        setWorkAreas(defaults)
      }
      
      setIsDataLoaded(true)
    }
  }, [dbWorkAreas, selectedEvent?.id, isDataLoaded, selectedLocation, initializeRoleRequirements, getLocationDefaults])

  // Get filtered work areas for current location
  const getFilteredWorkAreas = () => {
    if (selectedLocation === "emslandarena-outdoor") {
      return mobileAreas
    }
    return workAreas.filter(area => area.location === selectedLocation)
  }

  // Ensure role requirements have consistent structure
  const normalizeRoleRequirements = (requirements: { [roleId: string]: number }) => {
    const normalized = initializeRoleRequirements()
    availableRoles.forEach(role => {
      normalized[role.id] = requirements[role.id] || 0
    })
    return normalized
  }

  const handleAddWorkArea = () => {
    if (selectedLocation === "emslandarena-outdoor") {
      const newMobileArea: WorkArea = {
        id: `mobile-${Date.now()}`,
        name: `Mobile Theke ${mobileAreas.length + 1}`,
        location: selectedLocation,
        isActive: true,
        maxCapacity: 3,
        currentAssigned: 0,
        roleRequirements: normalizeRoleRequirements({ manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 0 }),
      }
      setMobileAreas([...mobileAreas, newMobileArea])
    } else {
      const currentAreas = getFilteredWorkAreas()
      const neuAreas = currentAreas.filter(area => area.name.startsWith('Neu'))
      
      let nextNumber = 1
      neuAreas.forEach(area => {
        const match = area.name.match(/^Neu (\d+)$/)
        if (match) {
          const num = parseInt(match[1])
          if (num >= nextNumber) {
            nextNumber = num + 1
          }
        }
      })
      
      if (currentAreas.some(area => area.name === 'Neu') && nextNumber === 1) {
        nextNumber = 2
      }
      
      const newArea: WorkArea = {
        id: Date.now().toString(),
        name: `Neu ${nextNumber}`,
        location: selectedLocation,
        isActive: true,
        maxCapacity: 4,
        currentAssigned: 0,
        roleRequirements: normalizeRoleRequirements({ manager: 0, allrounder: 1, versorger: 0, verkauf: 0, essen: 0 }),
      }
      
      setWorkAreas(prev => [...prev, newArea])
    }
  }

  const handleRemoveWorkArea = async (id: string) => {
    const currentAreas = selectedLocation === "emslandarena-outdoor" ? mobileAreas : getFilteredWorkAreas()
    const areaToDelete = currentAreas.find(area => area.id === id)
    
    if (!areaToDelete) return

    if (!confirm(`Möchten Sie "${areaToDelete.name}" wirklich löschen?`)) {
      return
    }

    if (selectedLocation === "emslandarena-outdoor") {
      setMobileAreas(prev => prev.filter((area) => area.id !== id))
      toast({
        title: "Arbeitsbereich gelöscht",
        description: `"${areaToDelete.name}" wurde entfernt.`,
      })
    } else {
      if (areaToDelete.isFromDatabase) {
        try {
          const response = await fetch(`/api/work-areas/${id}`, { method: 'DELETE' })
          const result = await response.json()
          
          if (result.success) {
            setWorkAreas(prev => prev.filter(area => area.id !== id))
            toast({
              title: "Arbeitsbereich gelöscht",
              description: `"${areaToDelete.name}" wurde aus der Datenbank entfernt.`,
            })
          } else {
            toast({
              title: "Fehler beim Löschen",
              description: `Konnte "${areaToDelete.name}" nicht löschen: ${result.error}`,
              variant: "destructive"
            })
          }
        } catch (error) {
          toast({
            title: "Fehler beim Löschen",
            description: `Unerwarteter Fehler beim Löschen von "${areaToDelete.name}".`,
            variant: "destructive"
          })
        }
      } else {
        setWorkAreas(prev => prev.filter(area => area.id !== id))
        toast({
          title: "Arbeitsbereich gelöscht", 
          description: `"${areaToDelete.name}" wurde entfernt.`,
        })
      }
    }
  }

  const handleCloneWorkArea = (area: WorkArea) => {
    if (selectedLocation === "emslandarena-outdoor") {
      const baseName = area.name.replace(/\s*\(\d+\)$/, '')
      const existingNames = mobileAreas.map(w => w.name.replace(/\s*\(\d+\)$/, ''))
      
      let newName = baseName
      let counter = 1
      
      while (existingNames.includes(newName) || mobileAreas.some(w => w.name === newName)) {
        newName = `${baseName} (${counter})`
        counter++
      }
      
      const clonedArea: WorkArea = {
        ...area,
        id: `mobile-clone-${Date.now()}`,
        name: newName,
        isActive: true,
        currentAssigned: 0,
        roleRequirements: normalizeRoleRequirements(area.roleRequirements)
      }
      
      setMobileAreas([...mobileAreas, clonedArea])
    } else {
      const baseName = area.name.replace(/\s*\(\d+\)$/, '')
      const existingNames = workAreas
        .filter(w => w.location === area.location)
        .map(w => w.name.replace(/\s*\(\d+\)$/, ''))
      
      let newName = baseName
      let counter = 1
      
      while (existingNames.includes(newName) || workAreas.some(w => w.name === newName)) {
        newName = `${baseName} (${counter})`
        counter++
      }
      
      const clonedArea: WorkArea = {
        ...area,
        id: Date.now().toString(),
        name: newName,
        isActive: true,
        currentAssigned: 0,
        roleRequirements: normalizeRoleRequirements(area.roleRequirements)
      }
      
      setWorkAreas([...workAreas, clonedArea])
    }
  }

  const handleWorkAreaChange = (id: string, field: keyof WorkArea, value: any) => {
    if (selectedLocation === "emslandarena-outdoor") {
      setMobileAreas(areas => areas.map(area => 
        area.id === id ? { ...area, [field]: value } : area
      ))
    } else {
      setWorkAreas(areas => areas.map(area => 
        area.id === id ? { ...area, [field]: value } : area
      ))
    }
  }

  const handleRoleCountChange = (areaId: string, roleId: string, change: number) => {
    if (selectedLocation === "emslandarena-outdoor") {
      setMobileAreas(areas => areas.map(area => {
        if (area.id === areaId) {
          const currentCount = area.roleRequirements[roleId] || 0
          const newCount = Math.max(0, Math.min(area.maxCapacity, currentCount + change))
          return {
            ...area,
            roleRequirements: normalizeRoleRequirements({
              ...area.roleRequirements,
              [roleId]: newCount
            })
          }
        }
        return area
      }))
    } else {
      setWorkAreas(areas => areas.map(area => {
        if (area.id === areaId) {
          const currentCount = area.roleRequirements[roleId] || 0
          const newCount = Math.max(0, Math.min(area.maxCapacity, currentCount + change))
          return {
            ...area,
            roleRequirements: normalizeRoleRequirements({
              ...area.roleRequirements,
              [roleId]: newCount
            })
          }
        }
        return area
      }))
    }
  }

  const handleLoadTemplate = (template: Template) => {
    const templateAreas = template.workAreas.map(area => ({
      ...area,
      id: Date.now().toString() + Math.random(),
      roleRequirements: normalizeRoleRequirements(area.roleRequirements)
    }))
    
    setWorkAreas(prev => [
      ...prev.filter(area => area.location !== selectedLocation),
      ...templateAreas
    ])
    
    setSelectedLocation(template.location)
  }

  const handleSaveNormal = async () => {
    setShowSaveChoiceDialog(false)
    setIsSaving(true)
    setShowSavingPopup(true)
    setShowSuccessState(false)
    
    try {
      if (!selectedEvent?.id) {
        throw new Error('No event selected')
      }

      const areasToSave = getFilteredWorkAreas()
        .filter(area => area.isActive)
        .map(area => ({
          id: area.isFromDatabase ? area.id : undefined,
          name: area.name,
          location: area.location,
          max_capacity: area.maxCapacity,
          role_requirements: area.roleRequirements,
          is_active: area.isActive
        }))

      console.log(`Saving ${areasToSave.length} work areas for event "${selectedEvent.title}" at location: ${selectedLocation}`)
      
      const savedAreas = await saveWorkAreasForEvent(selectedEvent.id, areasToSave)
      
      const transformedSavedAreas = savedAreas.map(area => ({
        id: area.id,
        name: area.name,
        location: area.location,
        isActive: area.is_active,
        maxCapacity: area.max_capacity,
        currentAssigned: 0,
        roleRequirements: normalizeRoleRequirements(area.role_requirements),
        isFromDatabase: true
      }))

      setWorkAreas(prev => prev.filter(area => area.location !== selectedLocation).concat(transformedSavedAreas))
      
      setShowSuccessState(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setIsSaved(true)
      setIsSaving(false)
      setShowSavingPopup(false)
      setShowSuccessState(false)
      
      const locationName = locations.find(l => l.id === selectedLocation)?.label || selectedLocation
      toast({
        title: "Arbeitsbereiche gespeichert!",
        description: `Arbeitsbereichskonfiguration für "${selectedEvent.title}" am ${locationName} gespeichert.`,
      })
      
      console.log('✅ Arbeitsbereiche: Configuration saved for event:', selectedEvent?.id)
      
      window.dispatchEvent(new CustomEvent('workAreasChanged'))
      
      if (onWorkAreasSaved) {
        onWorkAreasSaved()
      }
    } catch (error) {
      console.error("Error saving work areas:", error)
      setIsSaving(false)
      setShowSavingPopup(false)
      setShowSuccessState(false)
      toast({
        title: "Fehler beim Speichern",
        description: `Fehler beim Speichern der Arbeitsbereiche: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        variant: "destructive",
      })
    }
  }

  const handleSaveTemplate = async () => {
    if (templateName.trim()) {
      setShowSaveTemplateDialog(false)
      setIsSaving(true)
      setShowSavingPopup(true)
      setShowSuccessState(false)
      
      try {
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const newTemplate: Template = {
          id: Date.now().toString(),
          name: templateName.trim(),
          location: selectedLocation,
          workAreas: getFilteredWorkAreas(),
          createdAt: new Date().toISOString().split('T')[0]
        }
        setTemplates([...templates, newTemplate])
        setTemplateName("")
        
        console.log("Template saved:", newTemplate)
        
        setShowSuccessState(true)
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setIsSaved(true)
        setIsSaving(false)
        setShowSavingPopup(false)
        setShowSuccessState(false)
      } catch (error) {
        console.error("Error saving template:", error)
        setIsSaving(false)
        setShowSavingPopup(false)
        setShowSuccessState(false)
      }
    }
  }

  const handleEventSelect = (event: Event) => {
    const contextEvent = contextEvents.find(e => e.id === event.id)
    if (contextEvent) {
      setSelectedEvent(contextEvent)
      setWorkAreas([])
      setIsDataLoaded(false)
      setIsSaved(false)
    }
  }

  const handleEmployeesToAskChange = (value: number) => {
    if (value >= 1 && setSelectedEvent && selectedEvent) {
      setSelectedEvent({
        ...selectedEvent,
        employees_to_ask: value
      })
    }
  }

  const currentAreas = getFilteredWorkAreas()

  return (
    <div className="space-y-8">
      {/* Configuration Status Dialog */}
      <ConfigDialog
        open={showConfigDialog}
        onOpenChange={setShowConfigDialog}
        selectedEvent={selectedEvent}
        events={events}
        onEventSelect={(eventId: string) => {
          setShowConfigDialog(false)
          setWorkAreas([])
          setIsDataLoaded(false)
          setIsSaved(false)
          fetchWorkAreasByEvent(eventId)
        }}
      />
      
      {/* Consolidated Header */}
      <ManagementHeader
        selectedEvent={selectedEvent}
        events={events as any[]}
        isSaved={isSaved}
        isSaving={isSaving}
        onEventSelect={handleEventSelect}
        onConfigClick={() => setShowConfigDialog(true)}
        onEmployeesToAskChange={handleEmployeesToAskChange}
        onSaveWorkAreas={() => setShowSaveChoiceDialog(true)}
        onContinue={onContinue}
      />

      {/* Location & Actions Card */}
      <LocationActionsSection
        selectedLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
        templates={templates}
        isSaved={isSaved}
        onAddWorkArea={handleAddWorkArea}
        onLoadTemplate={handleLoadTemplate}
      />

      {/* Work Areas Grid */}
      <WorkAreasGrid
        areas={currentAreas}
        selectedLocation={selectedLocation}
        onWorkAreaChange={handleWorkAreaChange}
        onRoleCountChange={handleRoleCountChange}
        onRemoveWorkArea={handleRemoveWorkArea}
        onCloneWorkArea={handleCloneWorkArea}
        onAddWorkArea={handleAddWorkArea}
      />

      {/* Save Choice Dialog */}
      <SaveChoiceDialog
        open={showSaveChoiceDialog}
        onOpenChange={setShowSaveChoiceDialog}
        onSaveNormal={handleSaveNormal}
        onSaveAsTemplate={() => {
          setShowSaveChoiceDialog(false)
          setShowSaveTemplateDialog(true)
        }}
      />

      {/* Saving Popup */}
      <SavingPopup
        open={showSavingPopup}
        onOpenChange={setShowSavingPopup}
        showSuccessState={showSuccessState}
      />

      {/* Template Save Dialog */}
      <TemplateSaveDialog
        open={showSaveTemplateDialog}
        onOpenChange={setShowSaveTemplateDialog}
        templateName={templateName}
        onTemplateNameChange={setTemplateName}
        onSaveTemplate={handleSaveTemplate}
        onSaveWithoutTemplate={() => {
          setShowSaveTemplateDialog(false)
          console.log("Saving work areas without template:", workAreas)
        }}
      />
    </div>
  )
} 