"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Users, Euro, FileText, Plus, Minus } from "lucide-react"

interface Event {
  id: string
  title: string
  location: string
  date: string
  time: string
  description: string
  specialties?: string
  status: "draft" | "recruiting" | "planned" | "active" | "completed" | "cancelled" | "upcoming" | "ongoing"
  employeesNeeded?: number
  employeesToAsk?: number
  hourlyRate?: number
}

interface EventEditDialogProps {
  isOpen: boolean
  onClose: () => void
  event: Event | null
  onSave: (updatedEvent: Event) => void
}

export function EventEditDialog({ isOpen, onClose, event, onSave }: EventEditDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    dateTime: "",
    requiredEmployees: 1,
    requestEmployees: 1,
    hourlyWage: 15.00,
    description: "",
    specialties: ""
  })

  // Initialize form data when event changes
  useEffect(() => {
    if (event) {
      const dateTime = `${event.date}T${event.time}`
      setFormData({
        title: event.title || "",
        location: event.location || "",
        dateTime: dateTime,
        requiredEmployees: event.employeesNeeded || 1,
        requestEmployees: event.employeesToAsk || 1,
        hourlyWage: event.hourlyRate || 15.00,
        description: event.description || "",
        specialties: event.specialties || ""
      })
    }
  }, [event])

  const handleFormChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCounterChange = (field: 'requiredEmployees' | 'requestEmployees' | 'hourlyWage', increment: boolean) => {
    setFormData(prev => {
      const currentValue = prev[field]
      let newValue: number
      
      if (field === 'hourlyWage') {
        newValue = increment 
          ? Math.min(50, currentValue + 0.25)
          : Math.max(5, currentValue - 0.25)
      } else {
        newValue = increment 
          ? Math.min(100, currentValue + 1)
          : Math.max(1, currentValue - 1)
      }
      
      return {
        ...prev,
        [field]: newValue
      }
    })
  }

  const handleSave = () => {
    if (!event) return
    
    // Extract date and time from dateTime
    const [date, time] = formData.dateTime.split('T')
    
    const updatedEvent: Event = {
      ...event,
      title: formData.title,
      location: formData.location,
      date: date || event.date,
      time: time || event.time,
      description: formData.description,
      specialties: formData.specialties,
      employeesNeeded: formData.requiredEmployees,
      employeesToAsk: formData.requestEmployees,
      hourlyRate: formData.hourlyWage
    }
    
    // Save the event and let the parent component handle navigation
    onSave(updatedEvent)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] overflow-hidden p-0 sm:w-full sm:max-h-[90vh] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
        <div className="bg-white rounded-2xl shadow-xl flex flex-col h-full">
          {/* Fixed Header */}
          <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {event ? "Event bearbeiten" : "Neues Projekt"}
                </DialogTitle>
              </DialogHeader>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 rounded-full"
              >
                <span className="sr-only">Close</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 pt-4">
            <form className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Titel
              </label>
              <div className="relative">
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                  className="pl-10 h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Event Titel eingeben"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Ort
              </label>
              <div className="relative">
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleFormChange("location", e.target.value)}
                  className="pl-10 h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Veranstaltungsort"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Date and Time */}
            <div className="space-y-2">
              <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700">
                Datum und Uhrzeit
              </label>
              <div className="relative">
                <Input
                  id="dateTime"
                  type="datetime-local"
                  value={formData.dateTime}
                  onChange={(e) => handleFormChange("dateTime", e.target.value)}
                  className="pl-10 h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Required Employees */}
            <div className="space-y-2">
              <label htmlFor="requiredEmployees" className="block text-sm font-medium text-gray-700">
                Benötigte Mitarbeiter
              </label>
              <div className="flex items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCounterChange("requiredEmployees", false)}
                  className="h-12 w-12 rounded-l-xl border-gray-300"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="relative flex-1">
                  <Input
                    id="requiredEmployees"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.requiredEmployees}
                    onChange={(e) => handleFormChange("requiredEmployees", parseInt(e.target.value) || 1)}
                    className="h-12 text-center border-l-0 border-r-0 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCounterChange("requiredEmployees", true)}
                  className="h-12 w-12 rounded-r-xl border-gray-300"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Employees to Ask */}
            <div className="space-y-2">
              <label htmlFor="requestEmployees" className="block text-sm font-medium text-gray-700">
                Anzufragende Mitarbeiter
              </label>
              <div className="flex items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCounterChange("requestEmployees", false)}
                  className="h-12 w-12 rounded-l-xl border-gray-300"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="relative flex-1">
                  <Input
                    id="requestEmployees"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.requestEmployees}
                    onChange={(e) => handleFormChange("requestEmployees", parseInt(e.target.value) || 1)}
                    className="h-12 text-center border-l-0 border-r-0 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCounterChange("requestEmployees", true)}
                  className="h-12 w-12 rounded-r-xl border-gray-300"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Hourly Wage */}
            <div className="space-y-2">
              <label htmlFor="hourlyWage" className="block text-sm font-medium text-gray-700">
                Stundenlohn (€)
              </label>
              <div className="flex items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCounterChange("hourlyWage", false)}
                  className="h-12 w-12 rounded-l-xl border-gray-300"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="relative flex-1">
                  <Input
                    id="hourlyWage"
                    type="number"
                    min="5"
                    max="50"
                    step="0.25"
                    value={formData.hourlyWage}
                    onChange={(e) => handleFormChange("hourlyWage", parseFloat(e.target.value) || 15)}
                    className="h-12 text-center border-l-0 border-r-0 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Euro className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCounterChange("hourlyWage", true)}
                  className="h-12 w-12 rounded-r-xl border-gray-300"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Beschreibung
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFormChange("description", e.target.value)}
                className="h-24 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Beschreibung des Events"
              />
            </div>

            {/* Specialties */}
            <div className="space-y-2">
              <label htmlFor="specialties" className="block text-sm font-medium text-gray-700">
                Benötigte Qualifikationen
              </label>
              <Input
                id="specialties"
                value={formData.specialties}
                onChange={(e) => handleFormChange("specialties", e.target.value)}
                className="h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="z.B. Barkeeper, Servicekraft, etc."
              />
            </div>

            </form>
          </div>

          {/* Fixed Footer */}
          <div className="flex-shrink-0 p-6 pt-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                Abbrechen
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-sm transition-all duration-200 hover:shadow-md"
              >
                Speichern
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}