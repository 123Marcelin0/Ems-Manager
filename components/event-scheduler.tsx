"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Search, ChevronLeft, ChevronRight, Calendar, X, Download, Clock, MapPin, Users } from "lucide-react"
import { EventForm } from "@/components/event-form"
import { EventList } from "@/components/event-list"
import { useEvents } from "@/hooks/use-events"
import type { Database } from '@/lib/supabase'
import type { Event as EventListEvent } from "./event-list"

type DatabaseEvent = Database['public']['Tables']['events']['Row']

interface Event {
  id: string
  title: string
  location: string
  date: string
  time: string
  description: string
  specialties: string
  hourlyRate: number
  employeesNeeded: number
  employeesToAsk: number
  workAreas?: WorkArea[]
  status: "draft" | "recruiting" | "planned" | "active" | "completed" | "cancelled"
}

interface WorkArea {
  id: string
  name: string
  location: string
  isActive: boolean
  maxCapacity: number
  currentAssigned: number
  roleRequirements: Record<string, number>
}



interface EventSchedulerProps {
  activeView?: string
}

export function EventScheduler({ activeView = "planner" }: EventSchedulerProps) {
  const { events: dbEvents, createEvent, createEventWithWorkAreas, updateEvent, deleteEvent } = useEvents()
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventListEvent | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Transform database events to match UI format
  const events: EventListEvent[] = dbEvents.map(evt => ({
    id: evt.id,
    title: evt.title,
    name: evt.title, // for compatibility with EventSelectorButton
    location: evt.location,
    date: evt.event_date,
    time: evt.start_time,
    description: evt.description || '',
    specialties: evt.specialties || '',
    hourlyRate: evt.hourly_rate,
    employeesNeeded: evt.employees_needed,
    employeesToAsk: evt.employees_to_ask,
    status: (evt.status as "draft" | "recruiting" | "planned" | "active" | "completed" | "cancelled" | "upcoming" | "ongoing")
  }))

  const handleSaveEvent = async (eventData: Omit<Event, "id" | "status">) => {
    try {
      if (editingEvent) {
        // Update existing event in database
        await updateEvent(editingEvent.id, {
          title: eventData.title,
          location: eventData.location,
          event_date: eventData.date,
          start_time: eventData.time,
          description: eventData.description,
          specialties: eventData.specialties,
          hourly_rate: eventData.hourlyRate,
          employees_needed: eventData.employeesNeeded,
          employees_to_ask: eventData.employeesToAsk
        })
        
        // Update work areas for existing event
        if (eventData.workAreas && eventData.workAreas.length > 0) {
          // Transform work areas data to match API format
          const workAreasData = eventData.workAreas.map((area: any) => ({
            name: area.name,
            location: area.location,
            max_capacity: area.maxCapacity,
            role_requirements: area.roleRequirements,
            is_active: area.isActive
          }))
          
          // TODO: Create API endpoint to update work areas for existing event
          console.log('Work areas to update:', workAreasData)
        }
        
        setEditingEvent(null)
      } else {
        // Prepare event data
        const eventDataForAPI = {
          title: eventData.title,
          location: eventData.location,
          event_date: eventData.date,
          start_time: eventData.time,
          description: eventData.description,
          specialties: eventData.specialties,
          hourly_rate: eventData.hourlyRate,
          employees_needed: eventData.employeesNeeded,
          employees_to_ask: eventData.employeesToAsk,
          status: 'draft' as const
        }

        // Prepare work areas data if available
        let workAreasData: any[] = []
        if (eventData.workAreas && eventData.workAreas.length > 0) {
          workAreasData = eventData.workAreas.map((area: any) => ({
            name: area.name,
            location: area.location,
            max_capacity: area.maxCapacity,
            role_requirements: area.roleRequirements,
            is_active: area.isActive
          }))
        }

        // Create event with work areas using the enhanced API
        if (workAreasData.length > 0) {
          await createEventWithWorkAreas(eventDataForAPI, workAreasData)
        } else {
          // Create event without work areas
          await createEvent(eventDataForAPI)
        }
      }
      setShowForm(false)
    } catch (error) {
      console.error('Error saving event:', error)
    }
  }

  const handleEditEvent = (event: EventListEvent) => {
    setEditingEvent(event)
    setShowForm(true)
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId)
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingEvent(null)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const getCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add days from previous month
    const prevMonth = new Date(year, month - 1, 0)
    const prevMonthDays = prevMonth.getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthDays - i)
      days.push({ date: prevDate, isCurrentMonth: false })
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true })
    }
    
    // Add days from next month to complete the grid
    const totalCells = 42
    const remainingCells = totalCells - days.length
    for (let day = 1; day <= remainingCells; day++) {
      const nextDate = new Date(year, month + 1, day)
      days.push({ date: nextDate, isCurrentMonth: false })
    }
    
    return days
  }

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return events.filter(event => event.date === dateString)
  }

  const monthNames = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ]

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  const views = [
    { key: "planner", label: "Planer" },
    { key: "calendar", label: "Kalender" },
  ]

  const getActiveButtonIndex = () => {
    return views.findIndex(view => view.key === activeView)
  }

  const getSliderPosition = () => {
    const activeIndex = getActiveButtonIndex()
    return `translateX(${activeIndex * 100}%)`
  }

  const handleDownloadCalendar = () => {
    // Create calendar data for download
    const calendarData = events.map(event => ({
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      description: event.description,
      status: event.status
    }))

    // Convert to CSV format
    const csvContent = [
      ['Titel', 'Datum', 'Zeit', 'Ort', 'Beschreibung', 'Status'],
      ...calendarData.map(event => [
        event.title,
        event.date,
        event.time,
        event.location,
        event.description,
        event.status
      ])
    ].map(row => row.join(',')).join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kalender-${monthNames[currentDate.getMonth()]}-${currentDate.getFullYear()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Scheduler</h1>
          <p className="mt-1 text-gray-600">Schedule and manage events for your team</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Time Chooser - only show in calendar view */}
          {activeView === "calendar" && (
            <div className="flex items-center border border-blue-200/60 rounded-full bg-white shadow-sm px-1 py-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="h-8 w-8 rounded-full hover:bg-gray-50 transition-all duration-200"
              >
                <ChevronLeft className="h-3.5 w-3.5 text-gray-600" />
              </Button>
              
              <div className="px-4 py-1">
                <span className="text-sm font-medium text-gray-700">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="h-8 w-8 rounded-full hover:bg-gray-50 transition-all duration-200"
              >
                <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
              </Button>
            </div>
          )}

          {/* Download Calendar Button - only show in calendar view */}
          {activeView === "calendar" && (
            <Button
              onClick={() => handleDownloadCalendar()}
              variant="outline"
              className="gap-2 rounded-xl border-gray-200 bg-white/50 font-medium transition-all duration-200 hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              Kalender herunterladen
            </Button>
          )}
          
          <Button
            onClick={() => setShowForm(true)}
            className="gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 font-medium shadow-sm transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            Neue Veranstaltung
          </Button>
        </div>
      </div>

      {/* Removed the View Toggle Button Group */}

      {/* Event Form */}
      {showForm && <EventForm event={editingEvent} onSave={handleSaveEvent} onCancel={handleCancelForm} />}

      {/* Content based on active view */}
      {activeView === "planner" ? (
        <EventList events={events} onEdit={handleEditEvent} onDelete={handleDeleteEvent} />
      ) : (
        /* Calendar View */
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-8">

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {dayNames.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-3">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {getCalendarDays().map((dayObj, index) => {
              const { date, isCurrentMonth } = dayObj
              const dayEvents = getEventsForDate(date)
              const isToday = 
                date.getDate() === new Date().getDate() &&
                date.getMonth() === new Date().getMonth() &&
                date.getFullYear() === new Date().getFullYear()

              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border border-gray-100 ${
                    isCurrentMonth ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <div className={`text-sm font-medium mb-2 ${
                    isCurrentMonth ? "text-gray-900" : "text-gray-400"
                  } ${isToday ? "text-blue-600 font-bold" : ""}`}>
                    {date.getDate()}
                  </div>
                  
                  {/* Events for this day */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className="text-xs p-1 bg-blue-100 text-blue-700 rounded truncate cursor-pointer hover:bg-blue-200"
                        onClick={() => handleEditEvent(event)}
                        title={event.title}
                      >
                        {event.time} {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
