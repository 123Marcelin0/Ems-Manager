"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar, Clock, MapPin, Star, MoreHorizontal, Edit, Trash2, Users, Settings, CheckCircle, AlertCircle, ArrowRight, ChevronDown } from "lucide-react"
import { EventEditDialog } from "./event-edit-dialog"
import { EventSelectorButton } from "./event-selector-button"
import { EventConfigurationStatus } from "./event-configuration-status"
import { EventCard } from "./event-card"

export interface Event {
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

interface WorkAreaStatus {
  isConfigured: boolean
  totalAreas: number
  configuredAreas: number
  totalCapacity: number
  assignedEmployees: number
}

interface EventListProps {
  events: Event[]
  onEdit: (event: Event) => void
  onDelete: (eventId: string) => void
  onNavigateToWorkArea?: (eventId: string) => void
}

const statusConfig = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700 border-gray-200" },
  recruiting: { label: "Recruiting", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  planned: { label: "Planned", color: "bg-blue-100 text-blue-700 border-blue-200" },
  active: { label: "Active", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  completed: { label: "Completed", color: "bg-gray-100 text-gray-700 border-gray-200" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700 border-red-200" },
  // Legacy status values for backward compatibility
  upcoming: { label: "Upcoming", color: "bg-blue-100 text-blue-700 border-blue-200" },
  ongoing: { label: "Ongoing", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
}

export function EventList({ events, onEdit, onDelete, onNavigateToWorkArea }: EventListProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null)

  const handleEditClick = (event: Event) => {
    setEventToEdit(event)
    setIsEditDialogOpen(true)
  }

  const handleSaveEvent = (updatedEvent: Event) => {
    onEdit(updatedEvent)
    setIsEditDialogOpen(false)
    setEventToEdit(null)
  }
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":")
    const date = new Date()
    date.setHours(Number.parseInt(hours), Number.parseInt(minutes))
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  // Mock function to get work area status - in real app this would come from your data layer
  const getWorkAreaStatus = (event: Event): WorkAreaStatus => {
    // This is mock data - replace with actual work area data fetching
    const mockStatuses: Record<string, WorkAreaStatus> = {
      [event.id]: {
        isConfigured: Math.random() > 0.3, // 70% chance of being configured
        totalAreas: Math.floor(Math.random() * 5) + 2, // 2-6 areas
        configuredAreas: Math.floor(Math.random() * 4) + 1, // 1-4 configured
        totalCapacity: Math.floor(Math.random() * 20) + 10, // 10-30 capacity
        assignedEmployees: Math.floor(Math.random() * 15) + 2, // 2-16 assigned
      }
    }

    return mockStatuses[event.id] || {
      isConfigured: false,
      totalAreas: 0,
      configuredAreas: 0,
      totalCapacity: 0,
      assignedEmployees: 0,
    }
  }

  if (events.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-16 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">
            <Calendar className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-800">No events scheduled</h3>
          <p className="text-gray-500">Create your first event to get started with scheduling.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Scheduled Events</h2>
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
          {events.length} {events.length === 1 ? "event" : "events"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {events.map((event, index) => (
          <div
            key={event.id}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <EventCard
              event={event}
              onEdit={handleEditClick}
              onDelete={onDelete}
              onNavigateToWorkArea={onNavigateToWorkArea}
              showActions={true}
            />
          </div>
        ))}
      </div>

      {/* Event Edit Dialog */}
      <EventEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        event={eventToEdit}
        onSave={handleSaveEvent}
      />
    </div>
  )
}
