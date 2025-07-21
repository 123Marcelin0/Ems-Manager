"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarIcon, MapPin, ArrowLeft, ChevronDown } from "lucide-react"
import { EventCalendar } from "../event-calendar"
import { EventSelectorButton } from "../event-selector-button"

import { useEventContext } from "@/hooks/use-event-context"
import { useWorkAreas } from "@/hooks/use-work-areas"


// Transform database events to match the expected interface
const transformEvents = (dbEvents: any[], workAreasData: any[] = []) => {
  return dbEvents.map(evt => {
    // Get work areas for this event
    const eventWorkAreas = workAreasData.filter(wa => wa.event_id === evt.id)
    const workAreasConfigured = eventWorkAreas.length > 0
    
    return {
      id: evt.id,
      name: evt.title || evt.name,
      date: new Date(evt.event_date || evt.date).toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      }),
      location: evt.location,
      employeesNeeded: evt.employees_needed || evt.employeesNeeded,
      employeesAvailable: Math.floor((evt.employees_needed || evt.employeesNeeded) * 0.7), // Mock availability for now
      employeesAsked: evt.employees_to_ask || evt.employeesToAsk,
      employeesToAsk: evt.employees_to_ask || evt.employeesToAsk,
      status: evt.status === 'draft' ? 'draft' as const : 
              evt.status === 'recruiting' ? 'planning' as const : 
              evt.status === 'planned' ? 'confirmed' as const : 
              'draft' as const,
      workAreasConfigured,
      workAreasCount: eventWorkAreas.length,
      description: evt.description || "Event description",
      hourlyRate: evt.hourly_rate,
      time: evt.start_time?.slice(0, 5) || "12:00"
    }
  })
}

interface EventSelectionProps {
  setActiveView?: (view: string) => void
}

export function EventSelection({ setActiveView }: EventSelectionProps) {
  // Use global event context
  const { selectedEvent, setSelectedEvent, events: contextEvents } = useEventContext()
  const { workAreas, fetchAllWorkAreas } = useWorkAreas()
  // Configuration history removed - no more locking system
  
  // Fetch work areas data for status checking
  useEffect(() => {
    fetchAllWorkAreas()
    
    // Listen for work areas changes
    const handleWorkAreasChanged = () => {
      fetchAllWorkAreas()
    }
    
    window.addEventListener('workAreasChanged', handleWorkAreasChanged)
    return () => {
      window.removeEventListener('workAreasChanged', handleWorkAreasChanged)
    }
  }, [fetchAllWorkAreas])
  
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())

  const events = transformEvents(contextEvents, workAreas)
  
  // Function to update event status
  const updateEventStatus = async (eventId: string, newStatus: string) => {
    try {
      // Map the UI status to the database status
      const dbStatus = 
        newStatus === 'planning' ? 'recruiting' :
        newStatus === 'confirmed' ? 'planned' :
        newStatus === 'draft' ? 'draft' : 'recruiting';
      
      // Update the event status in the database
      console.log(`Updated event ${eventId} status to ${dbStatus}`);
    } catch (error) {
      console.error('Error updating event status:', error);
    }
  }
  
  // Function to handle random selection of employees
  const handleRandomSelection = async (eventId: string, count: number) => {
    try {
      // In a real implementation, this would call the database function
      // For now, we'll just log the action
      console.log(`Randomly selecting ${count} employees for event ${eventId}`);
      
      // This would typically call a stored procedure or API endpoint
      const response = await fetch('/api/events/random-selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: eventId,
          count: count
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to perform random selection');
      }
      
      // Refresh the event data after selection
      return result.data;
    } catch (error) {
      console.error('Error performing random selection:', error);
      throw error;
    }
  }

  const handleEditEvent = (event: any) => {
    setSelectedEvent(event)
  }

  // Show loading state
  if (!contextEvents || contextEvents.length === 0) {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-200">
          <div className="animate-pulse">Loading events...</div>
        </div>
      </div>
    )
  }

  // Filter events (simplified - removed filter functionality)
  const filteredEvents = events.sort((a: any, b: any) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateA.getTime() - dateB.getTime()
  })

  return (
    <div className="space-y-6">
      {/* Selected Event Banner */}
      {selectedEvent && (
        <div className="flex items-center justify-between p-6 bg-blue-50/50 border border-blue-200 rounded-xl shadow-sm mb-8">
          <div className="flex items-center gap-4 flex-1">
            <EventSelectorButton
              selectedEvent={selectedEvent ? {
                id: selectedEvent.id || '',
                name: selectedEvent.name || selectedEvent.title || 'Event',
                date: selectedEvent.date || '',
                employeesNeeded: selectedEvent.employeesNeeded || selectedEvent.employees_needed || 0,
                employeesToAsk: selectedEvent.employeesToAsk || selectedEvent.employees_to_ask || 0,
                status: selectedEvent.status
              } : null}
              events={events.map(event => ({
                id: event.id,
                name: event.name,
                date: event.date,
                employeesNeeded: event.employeesNeeded,
                employeesToAsk: event.employeesAsked, // Fix property name
                status: event.status
              }))}
              onEventSelect={(event) => {
                setSelectedEvent(event);
              }}
            />
            
            {/* Request Counter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Anfragen:</span>
              <input
                type="number"
                min="1"
                value={selectedEvent.employeesToAsk || selectedEvent.employees_to_ask || 1}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  // Update selected event
                  if (value >= 1) {
                    const updatedEvent = {
                      ...selectedEvent,
                      employeesToAsk: value,
                      employees_to_ask: value
                    };
                    setSelectedEvent(updatedEvent);
                  }
                }}
                className="h-8 w-16 text-center border border-gray-300 bg-white text-sm font-medium text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
            </div>
          </div>
          
          {/* Continue Button */}
          <Button
            onClick={() => {
              // No more event unlocking needed - all views are accessible
              console.log('🎯 Fortsetzen clicked: Navigating to mitteilungen')
              setActiveView?.("mitteilungen")
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Fortsetzen
          </Button>
        </div>
      )}

      {/* Event List */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {filteredEvents.map((event) => {
          // Calculate card status for styling
          const cardStatus = 
            event.workAreasConfigured && event.employeesAvailable >= event.employeesNeeded 
              ? "ready" 
              : !event.workAreasConfigured 
                ? "needs-config" 
                : event.employeesAvailable < event.employeesNeeded 
                  ? "insufficient" 
                  : "needs-asking"
          
          return (
            <div
              key={event.id}
              className={`group relative bg-white rounded-xl border transition-all duration-200 cursor-pointer ${
                selectedEvent?.id === event.id 
                  ? cardStatus === "ready" 
                    ? "border-green-300 shadow-md" 
                    : cardStatus === "needs-config" 
                      ? "border-amber-300 shadow-md" 
                      : cardStatus === "needs-asking" 
                        ? "border-blue-300 shadow-md" 
                        : cardStatus === "insufficient" 
                          ? "border-red-300 shadow-md" 
                          : "border-gray-300 shadow-md"
                  : cardStatus === "ready" 
                    ? "border-green-200 hover:border-green-300 hover:shadow-md" 
                    : cardStatus === "needs-config" 
                      ? "border-amber-200 hover:border-amber-300 hover:shadow-md" 
                      : cardStatus === "needs-asking" 
                        ? "border-blue-200 hover:border-blue-300 hover:shadow-md" 
                        : cardStatus === "insufficient" 
                          ? "border-red-200 hover:border-red-300 hover:shadow-md" 
                          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
              }`}
              onClick={() => setSelectedEvent(event)}
            >
              {/* Event Card Content - preserve all existing UI */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {event.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>
                  <Badge 
                    className={`ml-2 text-xs ${
                      event.status === 'draft' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                      event.status === 'planning' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      event.status === 'confirmed' ? 'bg-green-100 text-green-700 border-green-200' :
                      'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {event.status === 'draft' ? 'Entwurf' :
                     event.status === 'planning' ? 'Planung' :
                     event.status === 'confirmed' ? 'Bestätigt' : 'Unbekannt'}
                  </Badge>
                </div>
                
                {/* Status Information */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Mitarbeiterstand</span>
                    <span className="font-medium">
                      {event.employeesAvailable} von {event.employeesNeeded}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Mitarbeiter angefragt</span>
                    <span className={`font-medium ${event.employeesAvailable >= event.employeesNeeded ? 'text-green-600' : 'text-amber-600'}`}>
                      {event.employeesAvailable >= event.employeesNeeded ? '✓ ' : ''}
                      {event.employeesAvailable} angefragt
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Arbeitsbereiche</span>
                    <span className={`font-medium ${event.workAreasConfigured ? 'text-green-600' : 'text-amber-600'}`}>
                      {event.workAreasConfigured ? '✓ ' : ''}
                      {event.workAreasCount} konfiguriert
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Mitarbeiterverteilung</span>
                    <span className={`font-medium ${cardStatus === "ready" ? 'text-green-600' : 'text-amber-600'}`}>
                      {cardStatus === "ready" ? '✓ 100% verfügbar' : 
                       cardStatus === "needs-config" ? '⚠ 50% verfügbar' : 
                       '⚠ 50% verfügbar'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}