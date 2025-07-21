"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Calendar, MapPin, Users, Clock, List } from "lucide-react"

import { useEvents } from "@/hooks/use-events"

// Transform database events to calendar format
const transformCalendarEvents = (dbEvents: any[]) => {
  return dbEvents.map(evt => ({
    id: evt.id,
    name: evt.title,
    date: evt.event_date, // Keep ISO format for calendar
    time: evt.start_time?.slice(0, 5) || "12:00",
    location: evt.location,
    employeesNeeded: evt.employees_needed,
    employeesAvailable: Math.floor(evt.employees_needed * 0.7),
    employeesAsked: evt.employees_to_ask,
    status: evt.status === 'recruiting' ? "planning" : 
            evt.status === 'planned' ? "confirmed" : 
            evt.status || "draft"
  }))
}

interface EventCalendarProps {
  selectedEvent?: any
  setSelectedEvent?: (event: any) => void
  setActiveView?: (view: string) => void
  onToggleView?: () => void
  currentDate?: Date
}

export function EventCalendar({ selectedEvent, setSelectedEvent, setActiveView, onToggleView, currentDate = new Date() }: EventCalendarProps) {
  const { events: dbEvents, loading } = useEvents()
  const mockEvents = transformCalendarEvents(dbEvents)

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "confirmed":
        return { label: "Bestätigt", color: "bg-green-100 text-green-700 border-green-200" }
      case "planning":
        return { label: "Planung", color: "bg-blue-100 text-blue-700 border-blue-200" }
      case "draft":
        return { label: "Entwurf", color: "bg-gray-100 text-gray-700 border-gray-200" }
      default:
        return { label: "Entwurf", color: "bg-gray-100 text-gray-700 border-gray-200" }
    }
  }

  // Get calendar data
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())

  const monthNames = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ]

  const dayNames = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"]

  // Generate calendar days
  const calendarDays = []
  const currentDateCopy = new Date(startDate)
  
  for (let i = 0; i < 42; i++) {
    calendarDays.push(new Date(currentDateCopy))
    currentDateCopy.setDate(currentDateCopy.getDate() + 1)
  }

  // Show loading state
  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-8">
        <div className="animate-pulse">Loading calendar...</div>
      </div>
    )
  }

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return mockEvents.filter((event: any) => event.date === dateString)
  }



  const handleEventClick = (event: any) => {
    setSelectedEvent?.(event)
    setActiveView?.("arbeitsbereiche")
  }

  return (
    <div className="space-y-6">


      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {dayNames.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const isCurrentMonth = date.getMonth() === month
            const isToday = date.toDateString() === new Date().toDateString()
            const events = getEventsForDate(date)
            
            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border border-gray-100 rounded-lg transition-all duration-200 ${
                  isCurrentMonth 
                    ? "bg-white hover:bg-gray-50" 
                    : "bg-gray-50/50 text-gray-400"
                } ${isToday ? "ring-2 ring-blue-500 ring-opacity-50" : ""}`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isToday ? "text-blue-600" : isCurrentMonth ? "text-gray-900" : "text-gray-400"
                }`}>
                  {date.getDate()}
                </div>
                
                {/* Events for this day */}
                <div className="space-y-1">
                  {events.map((event: any) => {
                    const status = getStatusConfig(event.status)
                    return (
                      <div
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className="p-2 rounded-lg bg-blue-50 border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                      >
                        <div className="text-xs font-medium text-blue-900 truncate mb-1">
                          {event.name}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-blue-700">
                          <Clock className="h-3 w-3" />
                          {event.time}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-blue-700">
                          <Users className="h-3 w-3" />
                          {event.employeesNeeded}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected Event Info */}
      {selectedEvent && (
        <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedEvent.name}
              </h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(selectedEvent.date).toLocaleDateString('de-DE')}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {selectedEvent.time}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {selectedEvent.location}
                </div>
              </div>
            </div>
            <Button
              onClick={() => setActiveView?.("mitteilungen")}
              className="gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 font-medium shadow-sm transition-all duration-200 hover:from-blue-600 hover:to-blue-700"
            >
              Fortfahren
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}