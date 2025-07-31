"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar, Clock, MapPin, MoreHorizontal, Edit, Trash2, Users, Settings, CheckCircle, AlertCircle, ArrowRight } from "lucide-react"
import { EventConfigurationStatus } from "./event-configuration-status"

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

interface EventCardProps {
  event: Event
  onEdit: (event: Event) => void
  onDelete: (eventId: string) => void
  onSelect?: (event: Event) => void
  onNavigateToWorkArea?: (eventId: string) => void
  isSelected?: boolean
  showActions?: boolean
}

const statusConfig = {
  draft: { label: "Entwurf", color: "bg-gray-100 text-gray-700 border-gray-200" },
  recruiting: { label: "Rekrutierung", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  planned: { label: "Geplant", color: "bg-blue-100 text-blue-700 border-blue-200" },
  active: { label: "Aktiv", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  completed: { label: "Abgeschlossen", color: "bg-gray-100 text-gray-700 border-gray-200" },
  cancelled: { label: "Storniert", color: "bg-red-100 text-red-700 border-red-200" },
  // Legacy status values for backward compatibility
  upcoming: { label: "Bevorstehend", color: "bg-blue-100 text-blue-700 border-blue-200" },
  ongoing: { label: "Laufend", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
}

export function EventCard({ 
  event, 
  onEdit, 
  onDelete, 
  onSelect, 
  onNavigateToWorkArea,
  isSelected = false,
  showActions = true 
}: EventCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":")
    return `${hours}:${minutes}`
  }

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(event)
    }
  }

  return (
    <div
      className={`bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] ${
        isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      } ${onSelect ? 'cursor-pointer' : ''}`}
      onClick={handleCardClick}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
              <Badge className={`text-xs font-medium ${statusConfig[event.status]?.color}`}>
                {statusConfig[event.status]?.label || event.status}
              </Badge>
            </div>
            
            {/* Event Details */}
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>{formatTime(event.time)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{event.location}</span>
              </div>
            </div>

            {/* Employee Requirements */}
            <div className="flex items-center gap-4 text-sm mb-3">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-gray-700">
                  <span className="font-medium">{event.employeesNeeded || 0}</span> Mitarbeiter benötigt
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-700">
                  <span className="font-medium">{event.employeesToAsk || 0}</span> angefragt
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 rounded-lg p-0 opacity-60 hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(event)
                  }} 
                  className="gap-2 cursor-pointer"
                >
                  <Edit className="h-4 w-4" />
                  Bearbeiten
                </DropdownMenuItem>
                {onNavigateToWorkArea && (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation()
                      onNavigateToWorkArea(event.id)
                    }} 
                    className="gap-2 cursor-pointer"
                  >
                    <Settings className="h-4 w-4" />
                    Arbeitsbereiche
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(event.id)
                  }}
                  className="gap-2 text-red-600 cursor-pointer focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-gray-600 text-sm leading-relaxed mb-4">{event.description}</p>
        )}

        {/* Configuration Status */}
        <div className="border-t border-gray-100 pt-4">
          <EventConfigurationStatus 
            eventId={event.id} 
            compact={false}
            showDetails={true}
          />
        </div>

        {/* Specialties */}
        {event.specialties && (
          <div className="flex items-center gap-2 text-sm mt-3 pt-3 border-t border-gray-100">
            <span className="text-gray-500">Spezialitäten:</span>
            <span className="text-gray-700 font-medium">{event.specialties}</span>
          </div>
        )}
      </div>
    </div>
  )
}