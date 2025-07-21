"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Trash2, Users, MapPin, Settings, Minus, Save, BookOpen, ChevronDown, Copy, Calendar, Check } from "lucide-react"
import { useWorkAreas } from "@/hooks/use-work-areas"
import { useEvents } from "@/hooks/use-events"
import { useToast } from "@/hooks/use-toast"
import { useEventContext } from "@/hooks/use-event-context"

import { EventSelectorButton } from "../event-selector-button"

interface Event {
  id: string
  name: string
  date: string
  employeesNeeded: number
  employeesToAsk: number
  status?: string
}

interface WorkArea {
  id: string
  name: string
  location: string
  maxCapacity: number
  currentAssigned: number
  roleRequirements: { [roleId: string]: number }
  isActive: boolean
  isFromDatabase?: boolean // Track if this came from database
}

interface WorkAreaManagementProps {
  onContinue: () => void
  onWorkAreasSaved?: () => void
}

interface RoleRequirement {
  id: string
  label: string
  color: string
}

interface Template {
  id: string
  name: string
  location: string
  workAreas: WorkArea[]
  createdAt: string
}

// Fixed order of roles to prevent reordering
const availableRoles: RoleRequirement[] = [
  { id: "manager", label: "Manager", color: "bg-red-100 text-red-700 border-red-200" },
  { id: "allrounder", label: "Allrounder", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { id: "versorger", label: "Versorger", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "verkauf", label: "Verkauf", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { id: "essen", label: "Essen", color: "bg-gray-100 text-gray-700 border-gray-200" },
]

const locations = [
  { id: "emslandarena", label: "Emslandarena", icon: "🏟️" },
  { id: "emslandhalle", label: "Emslandhalle", icon: "🏢" },
  { id: "emslandarena-outdoor", label: "Emslandarena draußen", icon: "🏕️" },
]

export function WorkAreaManagement({ onContinue, onWorkAreasSaved }: WorkAreaManagementProps) {
  // Add toast hook for notifications
  const { toast } = useToast()
  
  // Use global event context instead of props
  const { selectedEvent, setSelectedEvent, events: contextEvents } = useEventContext()
  const { workAreas: dbWorkAreas, loading, error, fetchWorkAreasByEvent, saveWorkAreasForEvent, createWorkArea } = useWorkAreas()
  
  // Configuration history removed - no more locking system
  
  // Transform context events to match the expected format
  const events = contextEvents.map(evt => ({
    id: evt.id,
    title: evt.title || evt.name,
    event_date: evt.event_date || '',
    employees_needed: evt.employees_needed || evt.employeesNeeded,
    employees_to_ask: evt.employees_to_ask || evt.employeesToAsk,
    status: evt.status
  }))

  const [selectedLocation, setSelectedLocation] = useState("emslandarena")
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [showSavingPopup, setShowSavingPopup] = useState(false)
  const [showSuccessState, setShowSuccessState] = useState(false)
  const [showSaveChoiceDialog, setShowSaveChoiceDialog] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
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

  // Simplified state: Single source of truth for all work areas
  const [workAreas, setWorkAreas] = useState<WorkArea[]>([])
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  // Initialize role requirements with consistent structure and fixed order
  const initializeRoleRequirements = (): { [roleId: string]: number } => {
    const requirements: { [roleId: string]: number } = {}
    availableRoles.forEach(role => {
      requirements[role.id] = 0
    })
    return requirements
  }

  // Default work areas for Emslandarena
  const getEmslandarenaDefaults = (): WorkArea[] => [
    // Gastro 1-4
    {
      id: "default-gastro-1",
      name: "Gastro 1",
      location: "emslandarena",
      isActive: true,
      maxCapacity: 4,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 1 }
    },
    {
      id: "default-gastro-2",
      name: "Gastro 2",
      location: "emslandarena",
      isActive: true,
      maxCapacity: 4,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 1 }
    },
    {
      id: "default-gastro-3",
      name: "Gastro 3",
      location: "emslandarena",
      isActive: true,
      maxCapacity: 4,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 1 }
    },
    {
      id: "default-gastro-4",
      name: "Gastro 4",
      location: "emslandarena",
      isActive: true,
      maxCapacity: 4,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 1 }
    },
    // Erlebbar
    {
      id: "default-erlebbar",
      name: "Erlebbar",
      location: "emslandarena",
      isActive: true,
      maxCapacity: 3,
      currentAssigned: 0,
      roleRequirements: { manager: 1, allrounder: 1, versorger: 0, verkauf: 1, essen: 0 }
    },
    // VIP-Bereich
    {
      id: "default-vip",
      name: "VIP-Bereich",
      location: "emslandarena",
      isActive: true,
      maxCapacity: 3,
      currentAssigned: 0,
      roleRequirements: { manager: 1, allrounder: 1, versorger: 1, verkauf: 0, essen: 0 }
    },
    // Mobile Theken 1-4
    {
      id: "default-mobile-1",
      name: "Mobile Theken 1",
      location: "emslandarena",
      isActive: true,
      maxCapacity: 3,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 0 }
    },
    {
      id: "default-mobile-2",
      name: "Mobile Theken 2",
      location: "emslandarena",
      isActive: true,
      maxCapacity: 3,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 0 }
    },
    {
      id: "default-mobile-3",
      name: "Mobile Theken 3",
      location: "emslandarena",
      isActive: true,
      maxCapacity: 3,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 0 }
    },
    {
      id: "default-mobile-4",
      name: "Mobile Theken 4",
      location: "emslandarena",
      isActive: true,
      maxCapacity: 3,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 0 }
    }
  ]

  // Default work areas for Emslandhalle
  const getEmslandhalleDefaults = (): WorkArea[] => [
    // Große Theke
    {
      id: "default-grosse-theke",
      name: "Große Theke",
      location: "emslandhalle",
      isActive: true,
      maxCapacity: 5,
      currentAssigned: 0,
      roleRequirements: { manager: 1, allrounder: 2, versorger: 1, verkauf: 1, essen: 0 }
    },
    // Küche (Hilfe)
    {
      id: "default-kueche-hilfe",
      name: "Küche (Hilfe)",
      location: "emslandhalle",
      isActive: true,
      maxCapacity: 3,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 0, essen: 1 }
    },
    // Mobile Theke 1-4
    {
      id: "default-emslandhalle-mobile-1",
      name: "Mobile Theke 1",
      location: "emslandhalle",
      isActive: true,
      maxCapacity: 3,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 0 }
    },
    {
      id: "default-emslandhalle-mobile-2",
      name: "Mobile Theke 2",
      location: "emslandhalle",
      isActive: true,
      maxCapacity: 3,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 0 }
    },
    {
      id: "default-emslandhalle-mobile-3",
      name: "Mobile Theke 3",
      location: "emslandhalle",
      isActive: true,
      maxCapacity: 3,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 0 }
    },
    {
      id: "default-emslandhalle-mobile-4",
      name: "Mobile Theke 4",
      location: "emslandhalle",
      isActive: true,
      maxCapacity: 3,
      currentAssigned: 0,
      roleRequirements: { manager: 0, allrounder: 1, versorger: 1, verkauf: 1, essen: 0 }
    }
  ]

  // Get default work areas based on location
  const getLocationDefaults = (location: string): WorkArea[] => {
    switch (location) {
      case "emslandarena":
        return getEmslandarenaDefaults()
      case "emslandhalle":
        return getEmslandhalleDefaults()
      default:
        return []
    }
  }

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
        setIsSaved(false) // Reset saved state for new event
        
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
      // Transform database work areas to UI format
      const transformedDbAreas = dbWorkAreas.map(area => ({
        id: area.id,
        name: area.name,
        location: area.location,
        isActive: area.is_active,
        maxCapacity: area.max_capacity,
        currentAssigned: 0, // Will be calculated based on assignments
        roleRequirements: {
          ...initializeRoleRequirements(), // Ensure all roles are present
          ...area.role_requirements // Override with actual values
        },
        isFromDatabase: true
      }))

      if (transformedDbAreas.length > 0) {
        // Set database work areas and auto-select location from first area
        setWorkAreas(transformedDbAreas)
        setSelectedLocation(transformedDbAreas[0].location)
      } else {
        // No database areas, use defaults for current location
        const defaults = getLocationDefaults(selectedLocation)
        setWorkAreas(defaults)
      }
      
      setIsDataLoaded(true)
    }
  }, [dbWorkAreas, selectedEvent?.id, isDataLoaded, selectedLocation])

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
    // Only include values for roles that exist in our fixed list
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
      // Get all existing work areas for the current location to determine next "Neu" number
      const currentAreas = getFilteredWorkAreas()
      const neuAreas = currentAreas.filter(area => area.name.startsWith('Neu'))
      
      // Find the highest existing number
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
      
      // Also check if "Neu 1" without number exists
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
    // Find the area to get its name for confirmation
    const currentAreas = selectedLocation === "emslandarena-outdoor" ? mobileAreas : getFilteredWorkAreas()
    const areaToDelete = currentAreas.find(area => area.id === id)
    
    if (!areaToDelete) {
      console.error('Work area not found for deletion:', id)
      return
    }

    // Show confirmation dialog
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
      // For database areas, only delete if already saved to database
      if (areaToDelete.isFromDatabase) {
        try {
          const response = await fetch(`/api/work-areas/${id}`, {
            method: 'DELETE',
          })
          
          const result = await response.json()
          if (result.success) {
            // Remove from local state
            setWorkAreas(prev => prev.filter(area => area.id !== id))
            toast({
              title: "Arbeitsbereich gelöscht",
              description: `"${areaToDelete.name}" wurde aus der Datenbank entfernt.`,
            })
          } else {
            console.error('Failed to delete work area:', result.error)
            toast({
              title: "Fehler beim Löschen",
              description: `Konnte "${areaToDelete.name}" nicht löschen: ${result.error}`,
              variant: "destructive"
            })
          }
        } catch (error) {
          console.error('Error deleting work area:', error)
          toast({
            title: "Fehler beim Löschen",
            description: `Unerwarteter Fehler beim Löschen von "${areaToDelete.name}".`,
            variant: "destructive"
          })
        }
      } else {
        // Remove from local state only
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
      // Handle outdoor mobile area cloning
      const baseName = area.name.replace(/\s*\(\d+\)$/, '') // Remove existing number suffix
      const existingNames = mobileAreas
        .map(w => w.name.replace(/\s*\(\d+\)$/, ''))
      
      let newName = baseName
      let counter = 1
      
      // Find the next available number
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
      // Handle regular area cloning
      const baseName = area.name.replace(/\s*\(\d+\)$/, '') // Remove existing number suffix
      const existingNames = workAreas
        .filter(w => w.location === area.location)
        .map(w => w.name.replace(/\s*\(\d+\)$/, ''))
      
      let newName = baseName
      let counter = 1
      
      // Find the next available number
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

  const handleSave = () => {
    setShowSaveTemplateDialog(true)
  }

  const handleSaveTemplate = async () => {
    if (templateName.trim()) {
      setShowSaveTemplateDialog(false)
      setIsSaving(true)
      setShowSavingPopup(true)
      setShowSuccessState(false)
      
      try {
        // Simulate saving to database
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
        
        // Show success state briefly
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

  const handleLoadTemplate = (template: Template) => {
    // Load template areas, ensuring they have proper role structure
    const templateAreas = template.workAreas.map(area => ({
      ...area,
      id: Date.now().toString() + Math.random(), // Generate new IDs for loaded areas
      roleRequirements: normalizeRoleRequirements(area.roleRequirements)
    }))
    
    // Replace work areas for this location with template
    setWorkAreas(prev => [
      ...prev.filter(area => area.location !== selectedLocation),
      ...templateAreas
    ])
    
    // Also switch to the template's location
    setSelectedLocation(template.location)
  }

  const handleSaveWithoutTemplate = () => {
    setShowSaveTemplateDialog(false)
    console.log("Saving work areas without template:", workAreas)
  }

  const handleSaveWorkAreas = () => {
    setShowSaveChoiceDialog(true)
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

      // Only save work areas that are active (toggle switched on)
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
      
      // Transform saved areas back to UI format and update local state
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

      // Update work areas with saved data
      setWorkAreas(prev => prev.filter(area => area.location !== selectedLocation).concat(transformedSavedAreas))
      
      // Show success state briefly
      setShowSuccessState(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setIsSaved(true)
      setIsSaving(false)
      setShowSavingPopup(false)
      setShowSuccessState(false)
      
      // Show success message
      const locationName = locations.find(l => l.id === selectedLocation)?.label || selectedLocation
      toast({
        title: "Arbeitsbereiche gespeichert!",
        description: `Arbeitsbereichskonfiguration für "${selectedEvent.title}" am ${locationName} gespeichert.`,
      })
      
              // Configuration saved successfully
        console.log('✅ Arbeitsbereiche: Configuration saved for event:', selectedEvent?.id)
      
      // Trigger refresh for event status checking  
      window.dispatchEvent(new CustomEvent('workAreasChanged'))
      
              // Notify parent component that work areas have been saved
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

  const handleSaveAsTemplate = async () => {
    setShowSaveChoiceDialog(false)
    setShowSaveTemplateDialog(true)
  }

  const currentAreas = getFilteredWorkAreas()

  // Calculate total employees needed
  const totalEmployeesNeeded = currentAreas.reduce((total, area) => {
    return total + Object.values(area.roleRequirements).reduce((sum, count) => sum + count, 0)
  }, 0)

  return (
    <div className="space-y-8">
      {/* Configuration Status Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
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
                    setShowConfigDialog(false); // Close dialog
                    // Reset state for new event
                    setWorkAreas([]);
                    setIsDataLoaded(false);
                    setIsSaved(false);
                    // Fetch work areas for the new event
                    fetchWorkAreasByEvent(eventId);
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
              onClick={() => setShowConfigDialog(false)}
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (selectedEvent?.id) {
                  setShowConfigDialog(false);
                  // Reset state for new event
                  setWorkAreas([]);
                  setIsDataLoaded(false);
                  setIsSaved(false);
                  // Fetch work areas for the new event
                  fetchWorkAreasByEvent(selectedEvent.id);
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
      
      {/* Consolidated Header */}
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
              name: event.title,
              date: new Date(event.event_date).toLocaleDateString('de-DE'),
              employeesNeeded: event.employees_needed,
              employeesToAsk: event.employees_to_ask,
              status: event.status
            }))}
            onEventSelect={(event: Event) => {
              // Find the context event and select it
              const contextEvent = contextEvents.find(e => e.id === event.id);
              if (contextEvent) {
                setSelectedEvent(contextEvent);
                // Reset state for new event
                setWorkAreas([]);
                setIsDataLoaded(false);
                setIsSaved(false);
              }
            }}
            onConfigClick={() => setShowConfigDialog(true)}
          />
          
          {/* Request Button/Counter */}
          {selectedEvent && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Anfragen:</span>
              <input
                type="number"
                min="1"
                value={selectedEvent.employees_to_ask || 1}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  if (value >= 1 && setSelectedEvent) {
                    setSelectedEvent({
                      ...selectedEvent,
                      employees_to_ask: value
                    });
                  }
                }}
                className="h-8 w-16 text-center border border-gray-300 bg-white text-sm font-medium text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
            </div>
          )}
        </div>
        
        {/* Save/Continue Button - Right side */}
        <Button
          onClick={isSaved ? onContinue : handleSaveWorkAreas}
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


      {/* Location & Actions Card - Separate white element */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Standort & Aktionen</h3>
              <p className="text-sm text-gray-600 mt-1">
                Wählen Sie den Veranstaltungsort und verwalten Sie Arbeitsbereiche
              </p>
            </div>
          </div>

          {/* Location Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Veranstaltungsort</label>
            <RadioGroup value={selectedLocation} onValueChange={setSelectedLocation} className="grid grid-cols-3 gap-3">
              {locations.map((location) => (
                <div key={location.id} className="relative">
                  <RadioGroupItem 
                    value={location.id} 
                    id={location.id} 
                    className="peer sr-only"
                  />
                  <Label 
                    htmlFor={location.id} 
                    className="flex items-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl cursor-pointer transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/30 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 peer-data-[state=checked]:shadow-sm"
                  >
                    <span className="text-lg">{location.icon}</span>
                    <span className="font-medium text-gray-900 text-sm">{location.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-3">
              {/* Add Work Area Button */}
              <Button
                onClick={handleAddWorkArea}
                className="gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 font-medium shadow-sm transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-md px-6 py-2.5"
              >
                <Plus className="h-4 w-4" />
                Bereich hinzufügen
              </Button>
              
              {/* Templates Dropdown - Only for non-outdoor */}
              {selectedLocation !== "emslandarena-outdoor" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 rounded-xl border-gray-200 hover:bg-gray-50 px-6 py-2.5">
                      <BookOpen className="h-4 w-4" />
                      Vorlagen
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {templates.filter(t => t.location === selectedLocation).length > 0 ? (
                      templates
                        .filter(t => t.location === selectedLocation)
                        .map((template) => (
                          <DropdownMenuItem 
                            key={template.id}
                            onClick={() => handleLoadTemplate(template)}
                            className="flex flex-col items-start gap-1 py-3"
                          >
                            <span className="font-medium">{template.name}</span>
                            <span className="text-xs text-gray-500">
                              {template.workAreas.length} Bereiche • {template.createdAt}
                            </span>
                          </DropdownMenuItem>
                        ))
                    ) : (
                      <DropdownMenuItem disabled>
                        Keine Vorlagen für diesen Standort
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Status Info */}
            <div className="text-sm text-gray-600">
              {isSaved 
                ? "Klicken Sie auf \"Fortsetzen\", um mit der Übersicht fortzufahren"
                : "Klicken Sie auf \"Speichern\", um die Konfiguration zu speichern"
              }
            </div>
          </div>
        </div>
      </div>

      {/* Work Areas Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {currentAreas.map((area) => (
          <div key={area.id} className={`border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-200 ${
            area.isActive ? 'bg-white' : 'bg-gray-200 opacity-60'
          }`}>
            {/* Area Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <Input
                  value={area.name}
                  onChange={(e) => handleWorkAreaChange(area.id, "name", e.target.value)}
                  className={`font-semibold border-none p-0 h-auto text-lg focus-visible:ring-0 bg-transparent ${
                    !area.isActive ? 'text-gray-500' : 'text-gray-900'
                  }`}
                  placeholder="Bereichsname"
                />
                <div className="flex items-center gap-2">
                  <MapPin className={`h-4 w-4 ${!area.isActive ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`text-sm ${!area.isActive ? 'text-gray-400' : 'text-gray-600'}`}>
                    {locations.find(l => l.id === area.location)?.label}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 relative z-10">
                {/* Only show switch for non-outdoor locations */}
                {selectedLocation !== "emslandarena-outdoor" && (
                  <Switch
                    checked={area.isActive}
                    onCheckedChange={(checked) => handleWorkAreaChange(area.id, "isActive", checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                )}
                
                {/* Show clone button for all locations */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCloneWorkArea(area)}
                  className="h-8 w-8 rounded-lg p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  title="Bereich klonen"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                
                {/* Always show delete button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveWorkArea(area.id)}
                  className="h-8 w-8 rounded-lg p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                  title="Bereich löschen"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Capacity */}
            <div className="space-y-2">
              <Label className={`text-sm font-medium ${!area.isActive ? 'text-gray-500' : 'text-gray-700'}`}>Kapazität</Label>
              <div className="flex items-center gap-2">
                <Users className={`h-4 w-4 ${!area.isActive ? 'text-gray-400' : 'text-gray-500'}`} />
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={area.maxCapacity}
                  onChange={(e) => handleWorkAreaChange(area.id, "maxCapacity", parseInt(e.target.value) || 1)}
                  className="w-20 h-8 text-center"
                />
                <span className={`text-sm ${!area.isActive ? 'text-gray-400' : 'text-gray-600'}`}>Personen</span>
              </div>
            </div>

            {/* Role Requirements - Fixed order with stable keys */}
            <div className="space-y-3">
              <Label className={`text-sm font-medium ${!area.isActive ? 'text-gray-500' : 'text-gray-700'}`}>Rollenanforderungen</Label>
              <div className="space-y-3">
                {availableRoles.map((role) => {
                  const count = area.roleRequirements[role.id] || 0
                  const totalAssigned = Object.values(area.roleRequirements).reduce((sum, val) => sum + val, 0)
                  
                  return (
                    <div key={`${area.id}-${role.id}`} className={`flex items-center justify-between p-3 rounded-lg ${
                      !area.isActive ? 'bg-gray-300' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${!area.isActive ? 'bg-gray-400 text-gray-500 border-gray-500' : role.color}`}>
                          {role.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleCountChange(area.id, role.id, -1)}
                          disabled={count === 0 || !area.isActive}
                          className="h-7 w-7 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{count}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleCountChange(area.id, role.id, 1)}
                          disabled={totalAssigned >= area.maxCapacity || !area.isActive}
                          className="h-7 w-7 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Status Indicator */}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className={`text-xs ${!area.isActive ? 'text-gray-400' : 'text-gray-500'}`}>Status</span>
                <Badge className={area.isActive ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-700 border-gray-200"}>
                  {area.isActive ? "Aktiv" : "Inaktiv"}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {currentAreas.length === 0 && selectedLocation !== "emslandarena-outdoor" && (
        <div className="text-center py-12 bg-gray-50/50 rounded-2xl">
          <div className="text-gray-400 mb-4">
            <Users className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Arbeitsbereiche</h3>
          <p className="text-gray-600 mb-4">Erstellen Sie Ihren ersten Arbeitsbereich</p>
          <Button
            onClick={handleAddWorkArea}
            className="gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 font-medium shadow-sm transition-all duration-200 hover:from-blue-600 hover:to-blue-700"
          >
            <Plus className="h-4 w-4" />
            Bereich hinzufügen
          </Button>
        </div>
      )}

      {/* Save Choice Dialog */}
      <Dialog open={showSaveChoiceDialog} onOpenChange={setShowSaveChoiceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Arbeitsbereiche speichern</DialogTitle>
            <DialogDescription>
              Wie möchten Sie die Arbeitsbereiche speichern?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={handleSaveNormal}
              className="justify-start gap-3 h-auto p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <Save className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Normal speichern</div>
                <div className="text-sm opacity-90">Arbeitsbereiche für dieses Event speichern</div>
              </div>
            </Button>
            <Button
              onClick={handleSaveAsTemplate}
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

      {/* Saving Popup */}
      <Dialog open={showSavingPopup} onOpenChange={setShowSavingPopup}>
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

      {/* Template Save Dialog */}
      <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
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
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-row justify-end gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveWithoutTemplate}
            >
              Nur speichern
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveTemplate}
              disabled={!templateName.trim()}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              Als Vorlage speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}