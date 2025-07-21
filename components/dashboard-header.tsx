"use client"

import { useState, useEffect } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { User, Search, X, Plus } from "lucide-react"
import { ActionButtons } from "./action-buttons"
import { AccountPopup } from "./account-popup"
import { EmployeeAssignmentWarning } from "./employee-assignment-warning"
import NeueVeranstaltungDialog from "./neue-veranstaltung-dialog"
import { useWorkAreas } from "@/hooks/use-work-areas"


interface DashboardHeaderProps {
  currentPage: string
  activeFilter?: string
  setActiveFilter?: (filter: string) => void
  stats?: {
    total: number
    available: number
    selected: number
    unavailable: number
  }
  onEventScheduled?: (eventData: any) => void
  // Event scheduler props
  eventSchedulerView?: string
  setEventSchedulerView?: (view: string) => void
  showWorkAreaAssignment?: boolean
  workAreaView?: string
  setWorkAreaView?: (view: string) => void
  // Employee overview props
  employeeOverviewView?: string
  setEmployeeOverviewView?: (view: string) => void
  // Work area assignment props
  workAreaSelectedEvent?: any
  // Role search props
  roleSearchQuery?: string
  setRoleSearchQuery?: (query: string) => void
  // Event selector props
  selectedEvent?: any
  events?: any[]
  onEventSelect?: (event: any) => void
  // Navigation props
  onNavigateToHome?: () => void
  // Mitteilungen state
  mitteilungenSaved?: boolean
}

interface FilterButtonGroupProps {
  filters: Array<{ key: string; label: string; count: number }>
  activeFilter: string
  setActiveFilter: (filter: string) => void
}

interface EventSchedulerButtonGroupProps {
  activeView: string
  setActiveView: (view: string) => void
}

interface EmployeeOverviewButtonGroupProps {
  activeView: string
  setActiveView: (view: string) => void
}

function EmployeeOverviewButtonGroup({ activeView, setActiveView }: EmployeeOverviewButtonGroupProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const views = [
    { key: "mitarbeiter", label: "Mitarbeiter" },
    { key: "events", label: "Events" },
  ]

  const getActiveButtonIndex = () => {
    return views.findIndex(view => view.key === activeView)
  }

  const getButtonWidth = (viewKey: string) => {
    switch (viewKey) {
      case "mitarbeiter": return "100px"  // Mitarbeiter needs more space
      case "events": return "80px" // Events
      default: return "80px"
    }
  }

  const getSliderPosition = () => {
    const activeIndex = getActiveButtonIndex()
    let offset = 0

    for (let i = 0; i < activeIndex; i++) {
      const view = views[i]
      const width = parseInt(getButtonWidth(view.key))
      offset += width
    }

    return `translateX(${offset}px)`
  }

  const getHighlightWidth = () => {
    const currentView = views.find(view => view.key === activeView)
    return currentView ? getButtonWidth(currentView.key) : "80px"
  }

  return (
    <div className="relative">
      <div className={`flex items-center border border-blue-200/60 rounded-full bg-white shadow-sm transition-all duration-700 ease-out ${isSearchOpen ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}>
        <div className="relative flex p-0.5">
          <div
            className="absolute top-0.5 bottom-0.5 left-0.5 bg-blue-500/20 border border-blue-400/40 rounded-full transition-all duration-300 ease-out backdrop-blur-sm shadow-sm"
            style={{
              width: getHighlightWidth(),
              transform: getSliderPosition()
            }}
          />

          {views.map((view) => (
            <button
              key={view.key}
              onClick={() => setActiveView(view.key)}
              className={`relative h-10 px-5 text-sm font-normal rounded-full transition-all duration-300 ease-out transform hover:scale-102 focus:outline-none z-10 whitespace-nowrap ${
                activeView === view.key
                  ? "text-blue-600 font-medium"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              style={{ width: getButtonWidth(view.key) }}
            >
              {view.label}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSearchOpen(true)}
          className="h-9 w-9 rounded-full transition-all duration-500 ease-out hover:bg-gray-50/80 hover:scale-110 ml-4 transform focus:outline-none"
          aria-label="Search"
        >
          <Search className="h-4 w-4 text-blue-600 transition-all duration-300" />
        </Button>
      </div>

      <div className={`absolute inset-0 flex items-center border border-blue-200/60 rounded-full bg-blue-50/30 backdrop-blur-sm shadow-lg z-10 transition-all duration-700 ease-out transform ${isSearchOpen
        ? "opacity-100 scale-100 translate-y-0"
        : "opacity-0 scale-95 translate-y-2 pointer-events-none"
        }`}>
        <div className="relative w-full px-4 pr-12">
          <Search className={`absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600 transition-all duration-500 ${isSearchOpen ? "opacity-100 scale-100" : "opacity-0 scale-90"
            }`} />
          <input
            placeholder="Search employees..."
            className={`h-11 w-full rounded-full border-0 bg-transparent pl-8 pr-4 text-sm focus:outline-none transition-all duration-500 ${isSearchOpen ? "opacity-100" : "opacity-0"
              }`}
            autoFocus={isSearchOpen}
            onBlur={() => {
              setTimeout(() => setIsSearchOpen(false), 100)
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSearchOpen(false)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full transition-all duration-500 hover:bg-gray-100/80 focus:outline-none ${isSearchOpen ? "opacity-100 scale-100" : "opacity-0 scale-90"
              }`}
            aria-label="Close search"
          >
            <X className="h-3 w-3 text-gray-500" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function FilterButtonGroup({ filters, activeFilter, setActiveFilter }: FilterButtonGroupProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const getActiveButtonIndex = () => {
    return filters.findIndex(filter => filter.key === activeFilter)
  }

  // Define button widths based on text length
  const getButtonWidth = (filterKey: string) => {
    switch (filterKey) {
      case "all": return "80px"
      case "available": return "90px"
      case "selected": return "130px" // Veröffentlicht needs more space
      case "unavailable": return "140px" // In Bearbeitung needs most space
      case "signed-in": return "120px" // Angemeldet needs more space
      case "signed-out": return "120px" // Abgemeldet needs more space
      default: return "80px"
    }
  }

  const getSliderPosition = () => {
    const activeIndex = getActiveButtonIndex()
    let offset = 0

    // Calculate cumulative width offset for buttons before the active one
    for (let i = 0; i < activeIndex; i++) {
      const filter = filters[i]
      const width = parseInt(getButtonWidth(filter.key))
      offset += width
    }

    return `translateX(${offset}px)`
  }

  const getHighlightWidth = () => {
    const currentFilter = filters.find(filter => filter.key === activeFilter)
    return currentFilter ? getButtonWidth(currentFilter.key) : "80px"
  }

  return (
    <div className="relative">
      <div className={`flex items-center border border-blue-200/60 rounded-full bg-white shadow-sm transition-all duration-700 ease-out ${isSearchOpen ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}>
        <div className="relative flex p-0.5">
          {/* Sliding background highlight */}
          <div
            className="absolute top-0.5 bottom-0.5 left-0.5 bg-blue-500/20 border border-blue-400/40 rounded-full transition-all duration-300 ease-out backdrop-blur-sm shadow-sm"
            style={{
              width: getHighlightWidth(),
              transform: getSliderPosition()
            }}
          />

          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`relative h-10 px-5 text-sm font-normal rounded-full transition-all duration-300 ease-out transform hover:scale-102 focus:outline-none z-10 whitespace-nowrap ${activeFilter === filter.key
                ? "text-blue-600 font-medium"
                : "text-gray-600 hover:text-gray-900"
                }`}
              style={{ width: getButtonWidth(filter.key) }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSearchOpen(true)}
          className="h-11 w-11 rounded-full transition-all duration-500 ease-out hover:bg-gray-50/80 hover:scale-110 ml-4 transform focus:outline-none"
          aria-label="Search"
        >
          <Search className="h-4 w-4 text-blue-600 transition-all duration-300" />
        </Button>
      </div>

      <div className={`absolute inset-0 flex items-center border border-blue-200/60 rounded-full bg-blue-50/30 backdrop-blur-sm shadow-lg z-10 transition-all duration-700 ease-out transform ${isSearchOpen
        ? "opacity-100 scale-100 translate-y-0"
        : "opacity-0 scale-95 translate-y-2 pointer-events-none"
        }`}>
        <div className="relative w-full px-4 pr-12">
          <Search className={`absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600 transition-all duration-500 ${isSearchOpen ? "opacity-100 scale-100" : "opacity-0 scale-90"
            }`} />
          <input
            placeholder="Search employees..."
            className={`h-11 w-full rounded-full border-0 bg-transparent pl-8 pr-4 text-sm focus:outline-none transition-all duration-500 ${isSearchOpen ? "opacity-100" : "opacity-0"
              }`}
            autoFocus={isSearchOpen}
            onBlur={() => {
              // Delay closing to allow clicking the close button
              setTimeout(() => setIsSearchOpen(false), 100)
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSearchOpen(false)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full transition-all duration-500 hover:bg-gray-100/80 focus:outline-none ${isSearchOpen ? "opacity-100 scale-100" : "opacity-0 scale-90"
              }`}
            aria-label="Close search"
          >
            <X className="h-3 w-3 text-gray-500" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function WorkAreaButtonGroup({ activeView, setActiveView, selectedEvent, onNavigateToHome, stats, mitteilungenSaved }: { activeView?: string, setActiveView?: (view: string) => void, selectedEvent?: any, onNavigateToHome?: () => void, stats?: { total: number, available: number, selected: number, unavailable: number }, mitteilungenSaved?: boolean }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [pendingView, setPendingView] = useState<string | null>(null)
  const activeFilter = activeView || "event"
  
  // Add work areas validation
  const { workAreas, fetchWorkAreasByEvent } = useWorkAreas()
  const [areWorkAreasConfigured, setAreWorkAreasConfigured] = useState(false)
  
  // Remove configuration history - no more locking behavior
  
  // Check work areas when event changes
  useEffect(() => {
    if (selectedEvent?.id) {
      fetchWorkAreasByEvent(selectedEvent.id).then((areas) => {
        setAreWorkAreasConfigured(areas && areas.length > 0)
      }).catch(() => {
        setAreWorkAreasConfigured(false)
      })
    } else {
      setAreWorkAreasConfigured(false)
    }
  }, [selectedEvent?.id, fetchWorkAreasByEvent])

  // Listen for work areas changes to refresh configuration status
  useEffect(() => {
    const handleWorkAreasChanged = () => {
      if (selectedEvent?.id) {
        fetchWorkAreasByEvent(selectedEvent.id).then((areas) => {
          setAreWorkAreasConfigured(areas && areas.length > 0)
        }).catch(() => {
          setAreWorkAreasConfigured(false)
        })
      }
    }

    window.addEventListener('workAreasChanged', handleWorkAreasChanged)
    return () => window.removeEventListener('workAreasChanged', handleWorkAreasChanged)
  }, [selectedEvent?.id, fetchWorkAreasByEvent])

  const filters = [
    { key: "event", label: "Event", step: 1 },
    { key: "mitteilungen", label: "Mitteilungen", step: 2 },
    { key: "arbeitsbereiche", label: "Arbeitsbereiche", step: 3 },
    { key: "ubersicht", label: "Übersicht", step: 4 },
  ]

  // Check if event is selected
  const hasSelectedEvent = !!selectedEvent
  
  // Check if Mitteilungen view is completed (has selected employees AND is saved)
  const isMitteilungenCompleted = selectedEvent && (
    (stats && stats.selected > 0) || mitteilungenSaved
  )

  // Determine step status based on current active view - NO LOCKING
  const getStepStatus = (stepKey: string) => {
    const stepOrder = ["event", "mitteilungen", "arbeitsbereiche", "ubersicht"]
    const currentIndex = stepOrder.indexOf(activeFilter)
    const stepIndex = stepOrder.indexOf(stepKey)
    
    // Simple status without any locking - all views are always accessible
    if (stepIndex < currentIndex) {
      return "completed" // Green for completed steps
    } else if (stepIndex > currentIndex) {
      return "pending" // Orange for pending steps
    } else {
      return "current" // Current step uses default styling
    }
  }

  const handleFilterClick = (filterKey: string) => {
    // No more locked checks - all views are accessible

    // Check if navigating to Übersicht and if event needs warning
    if (filterKey === "ubersicht" && selectedEvent) {
      const eventData = getEventAssignmentData(selectedEvent)
      
      // Show warning if not all employees are assigned
      if (eventData.employeesAssigned < eventData.employeesNeeded) {
        setPendingView(filterKey)
        setShowWarning(true)
        return
      }
    }

    setActiveView?.(filterKey)
  }

  // Mock function to get event assignment data - replace with real data
  const getEventAssignmentData = (event: any) => {
    return {
      name: event.name || "Event",
      date: event.date || new Date().toLocaleDateString(),
      employeesNeeded: event.employeesNeeded || 10,
      employeesAssigned: Math.floor(Math.random() * (event.employeesNeeded || 10)), // Mock assigned count
      employeesAsked: Math.floor(Math.random() * 5), // Mock asked count
      employeesToAsk: event.employeesToAsk || 15
    }
  }

  const handleWarningClose = () => {
    setShowWarning(false)
    setPendingView(null)
  }

  const handleWarningContinue = () => {
    if (pendingView) {
      setActiveView?.(pendingView)
    }
    setShowWarning(false)
    setPendingView(null)
  }

  const handleStartInquiry = () => {
    // Navigate to dashboard home page where user can send inquiries
    console.log("Starting employee inquiry for event:", selectedEvent)
    setShowWarning(false)
    setPendingView(null)
    
    // Navigate to home page where user can manage employee inquiries
    if (onNavigateToHome) {
      onNavigateToHome()
    }
  }

  const getActiveButtonIndex = () => {
    return filters.findIndex(filter => filter.key === activeFilter)
  }

  const getButtonWidth = (filterKey: string) => {
    switch (filterKey) {
      case "event": return "90px"
      case "mitteilungen": return "120px"
      case "arbeitsbereiche": return "130px"
      case "ubersicht": return "100px"
      default: return "90px"
    }
  }

  const getSliderPosition = () => {
    const activeIndex = getActiveButtonIndex()
    let offset = 0

    for (let i = 0; i < activeIndex; i++) {
      const filter = filters[i]
      const width = parseInt(getButtonWidth(filter.key))
      offset += width
    }

    return `translateX(${offset}px)`
  }

  const getHighlightWidth = () => {
    const currentFilter = filters.find(filter => filter.key === activeFilter)
    return currentFilter ? getButtonWidth(currentFilter.key) : "80px"
  }

  // Check if we're on the Übersicht page to disable animations
  const isOnUbersicht = activeFilter === "ubersicht"
  
  return (
    <div className="relative">
      <div className={`flex items-center border border-blue-200/60 rounded-full bg-white shadow-sm ${isOnUbersicht ? "" : "transition-all duration-700 ease-out"} ${isSearchOpen ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}>
        <div className="relative flex p-0.5">


          <div
            className={`absolute top-0.5 bottom-0.5 left-0.5 bg-blue-500/20 border border-blue-400/40 rounded-full backdrop-blur-sm shadow-sm ${isOnUbersicht ? "" : "transition-all duration-300 ease-out"}`}
            style={{
              width: getHighlightWidth(),
              transform: getSliderPosition()
            }}
          />

          {filters.map((filter) => {
            const status = getStepStatus(filter.key)
            const isActive = activeFilter === filter.key
            
            return (
              <button
                key={filter.key}
                onClick={() => handleFilterClick(filter.key)}
                className={`relative h-10 px-5 text-sm font-normal rounded-full focus:outline-none z-10 whitespace-nowrap ${
                  isOnUbersicht ? "" : "transition-all duration-300 ease-out transform"
                } ${
                  isActive
                    ? "text-blue-600 font-medium"
                    : `text-gray-600 ${isOnUbersicht ? "" : "hover:text-gray-900 hover:scale-102"}`
                }`}
                style={{ width: getButtonWidth(filter.key) }}
              >
                <div className="relative flex items-center justify-center">
                  {/* No more lock icons - all views are accessible */}
                  {filter.label}
                </div>
              </button>
            )
          })}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSearchOpen(true)}
          className={`h-11 w-11 rounded-full ml-4 focus:outline-none ${isOnUbersicht ? "" : "transition-all duration-500 ease-out hover:bg-gray-50/80 hover:scale-110 transform"}`}
          aria-label="Search"
        >
          <Search className={`h-4 w-4 text-blue-600 ${isOnUbersicht ? "" : "transition-all duration-300"}`} />
        </Button>
      </div>

      <div className={`absolute inset-0 flex items-center border border-blue-200/60 rounded-full bg-blue-50/30 backdrop-blur-sm shadow-lg z-10 ${isOnUbersicht ? "" : "transition-all duration-700 ease-out transform"} ${isSearchOpen
        ? "opacity-100 scale-100 translate-y-0"
        : "opacity-0 scale-95 translate-y-2 pointer-events-none"
        }`}>
        <div className="relative w-full px-4 pr-12">
          <Search className={`absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600 ${isOnUbersicht ? "" : "transition-all duration-500"} ${isSearchOpen ? "opacity-100 scale-100" : "opacity-0 scale-90"
            }`} />
          <input
            placeholder="Search employees..."
            className={`h-11 w-full rounded-full border-0 bg-transparent pl-8 pr-4 text-sm focus:outline-none ${isOnUbersicht ? "" : "transition-all duration-500"} ${isSearchOpen ? "opacity-100" : "opacity-0"
              }`}
            autoFocus={isSearchOpen}
            onBlur={() => {
              setTimeout(() => setIsSearchOpen(false), 100)
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSearchOpen(false)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full ${isOnUbersicht ? "" : "transition-all duration-500 hover:bg-gray-100/80"} focus:outline-none ${isSearchOpen ? "opacity-100 scale-100" : "opacity-0 scale-90"
              }`}
            aria-label="Close search"
          >
            <X className="h-3 w-3 text-gray-500" />
          </Button>
        </div>
      </div>

      {/* Employee Assignment Warning Dialog */}
      {selectedEvent && (
        <EmployeeAssignmentWarning
          isOpen={showWarning}
          onClose={handleWarningClose}
          onContinue={handleWarningContinue}
          onStartInquiry={handleStartInquiry}
          eventData={getEventAssignmentData(selectedEvent)}
        />
      )}
    </div>
  )
}

function RoleSearchButtonGroup({ searchQuery, setSearchQuery }: { searchQuery?: string, setSearchQuery?: (query: string) => void }) {
  return (
    <div className="relative w-[500px]">
      <div className="flex items-center border border-blue-200/60 rounded-full bg-blue-50/30 backdrop-blur-sm shadow-lg">
        <div className="relative w-full px-4 pr-12">
          <Search className="absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchQuery || ""}
            onChange={(e) => setSearchQuery?.(e.target.value)}
            className="h-11 w-full rounded-full border-0 bg-transparent pl-8 pr-4 text-sm focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery?.("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-gray-100/80 focus:outline-none flex items-center justify-center"
              aria-label="Clear search"
            >
              <X className="h-3 w-3 text-gray-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function EventSchedulerButtonGroup({ activeView, setActiveView }: EventSchedulerButtonGroupProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const views = [
    { key: "planner", label: "Planer" },
    { key: "calendar", label: "Kalender" },
  ]

  const getActiveButtonIndex = () => {
    return views.findIndex(view => view.key === activeView)
  }

  // Define button widths based on text length - matching FilterButtonGroup logic
  const getButtonWidth = (viewKey: string) => {
    switch (viewKey) {
      case "planner": return "90px"  // Planer
      case "calendar": return "110px" // Kalender needs more space
      default: return "90px"
    }
  }

  const getSliderPosition = () => {
    const activeIndex = getActiveButtonIndex()
    let offset = 0

    // Calculate cumulative width offset for buttons before the active one
    for (let i = 0; i < activeIndex; i++) {
      const view = views[i]
      const width = parseInt(getButtonWidth(view.key))
      offset += width
    }

    return `translateX(${offset}px)`
  }

  const getHighlightWidth = () => {
    const currentView = views.find(view => view.key === activeView)
    return currentView ? getButtonWidth(currentView.key) : "90px"
  }

  return (
    <div className="relative">
      <div className={`flex items-center border border-blue-200/60 rounded-full bg-white shadow-sm transition-all duration-700 ease-out ${isSearchOpen ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}>
        <div className="relative flex p-0.5">
          {/* Sliding background highlight */}
          <div
            className="absolute top-0.5 bottom-0.5 left-0.5 bg-blue-500/20 border border-blue-400/40 rounded-full transition-all duration-300 ease-out backdrop-blur-sm shadow-sm"
            style={{
              width: getHighlightWidth(),
              transform: getSliderPosition()
            }}
          />

          {views.map((view) => (
            <button
              key={view.key}
              onClick={() => setActiveView(view.key)}
              className={`relative h-10 px-5 text-sm font-normal rounded-full transition-all duration-300 ease-out transform hover:scale-102 focus:outline-none z-10 whitespace-nowrap ${activeView === view.key
                ? "text-blue-600 font-medium"
                : "text-gray-600 hover:text-gray-900"
                }`}
              style={{ width: getButtonWidth(view.key) }}
            >
              {view.label}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSearchOpen(true)}
          className="h-9 w-9 rounded-full transition-all duration-500 ease-out hover:bg-gray-50/80 hover:scale-110 ml-4 transform focus:outline-none"
          aria-label="Search"
        >
          <Search className="h-4 w-4 text-blue-600 transition-all duration-300" />
        </Button>
      </div>

      <div className={`absolute inset-0 flex items-center border border-blue-200/60 rounded-full bg-blue-50/30 backdrop-blur-sm shadow-lg z-10 transition-all duration-700 ease-out transform ${isSearchOpen
        ? "opacity-100 scale-100 translate-y-0"
        : "opacity-0 scale-95 translate-y-2 pointer-events-none"
        }`}>
        <div className="relative w-full px-4 pr-12">
          <Search className={`absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600 transition-all duration-500 ${isSearchOpen ? "opacity-100 scale-100" : "opacity-0 scale-90"
            }`} />
          <input
            placeholder="Search events..."
            className={`h-11 w-full rounded-full border-0 bg-transparent pl-8 pr-4 text-sm focus:outline-none transition-all duration-500 ${isSearchOpen ? "opacity-100" : "opacity-0"
              }`}
            autoFocus={isSearchOpen}
            onBlur={() => {
              setTimeout(() => setIsSearchOpen(false), 100)
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSearchOpen(false)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full transition-all duration-500 hover:bg-gray-100/80 focus:outline-none ${isSearchOpen ? "opacity-100 scale-100" : "opacity-0 scale-90"
              }`}
            aria-label="Close search"
          >
            <X className="h-3 w-3 text-gray-500" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function DashboardHeader({ currentPage, activeFilter, setActiveFilter, stats, onEventScheduled, eventSchedulerView, setEventSchedulerView, showWorkAreaAssignment, workAreaView, setWorkAreaView, employeeOverviewView, setEmployeeOverviewView, workAreaSelectedEvent, roleSearchQuery, setRoleSearchQuery, selectedEvent, events, onEventSelect, onNavigateToHome, mitteilungenSaved }: DashboardHeaderProps) {
  const [isNeueVeranstaltungOpen, setIsNeueVeranstaltungOpen] = useState(false)
  
  const filters = [
    { key: "all", label: "Alle", count: stats?.total || 0 },
    { key: "available", label: "Verfügbar", count: stats?.available || 0 },
    { key: "selected", label: "Ausgewählt", count: stats?.selected || 0 },
    { key: "unavailable", label: "Nicht Verfügbar", count: stats?.unavailable || 0 },
  ]

  const signOutFilters = [
    { key: "event", label: "Event", count: 0 },
    { key: "arbeit", label: "Arbeit", count: stats?.total || 0 },
  ]

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-transparent">
        {/* Center content container */}
        <div className="relative flex h-20 items-center px-8 mx-auto max-w-7xl">
          {/* Center - filter buttons - centered relative to main content area (accounting for sidebar) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ml-32">
            <div className="flex-shrink-0 relative">
              {currentPage === "sign-out-table" && activeFilter && setActiveFilter && stats && !showWorkAreaAssignment ? (
                <FilterButtonGroup
                  filters={signOutFilters}
                  activeFilter={activeFilter}
                  setActiveFilter={setActiveFilter}
                />
              ) : currentPage === "sign-out-table" && showWorkAreaAssignment ? (
                <WorkAreaButtonGroup 
                  activeView={workAreaView}
                  setActiveView={setWorkAreaView}
                  stats={stats}
                  mitteilungenSaved={mitteilungenSaved}
                />
              ) : currentPage === "employee-overview" && employeeOverviewView && setEmployeeOverviewView ? (
                <EmployeeOverviewButtonGroup
                  activeView={employeeOverviewView}
                  setActiveView={setEmployeeOverviewView}
                />
              ) : currentPage === "work-planner" && workAreaView && setWorkAreaView ? (
                <WorkAreaButtonGroup 
                  activeView={workAreaView}
                  setActiveView={setWorkAreaView}
                  selectedEvent={workAreaSelectedEvent}
                  onNavigateToHome={onNavigateToHome}
                  stats={stats}
                  mitteilungenSaved={mitteilungenSaved}
                />
              ) : currentPage === "work-area-assignment" ? (
                <div></div>
              ) : currentPage === "roles" ? (
                <RoleSearchButtonGroup 
                  searchQuery={roleSearchQuery}
                  setSearchQuery={setRoleSearchQuery}
                />
              ) : (
                <div></div>
              )}
            </div>
          </div>
          
          {/* Left side placeholder for balance */}
          <div className="w-48"></div>
        </div>
        
        {/* Right side - Neues Projekt button - positioned at absolute right edge outside container */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2">
          <Button 
            onClick={() => setIsNeueVeranstaltungOpen(true)}
            className="group relative overflow-hidden rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <div className="relative flex items-center gap-2">
              <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
              <span>Neues Projekt</span>
            </div>
          </Button>
          
          <NeueVeranstaltungDialog
            isOpen={isNeueVeranstaltungOpen}
            onClose={() => setIsNeueVeranstaltungOpen(false)}
            onSave={(eventData) => {
              console.log('🎉 New event saved, triggering UI refresh...')
              
              // Close the dialog first
              setIsNeueVeranstaltungOpen(false);
              
              // Trigger the parent callback to refresh the UI
              if (onEventScheduled) {
                onEventScheduled(eventData);
              }
              
              // Force immediate page refresh to show the new event
              window.location.reload()
            }}
          />
        </div>
      </header>
    </>
  )
}