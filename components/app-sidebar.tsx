"use client"

import { Users, Calendar, ClipboardList, HelpCircle, FileText, LogOut, Shield, Lock, User, RotateCcw } from "lucide-react"
import { useState } from "react"
import { useEventContext } from "@/hooks/use-event-context"
import { useAuth } from "@/components/auth/auth-provider"

import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

const navigationItems = [
  { title: "Eventplaner", icon: Calendar, page: "work-planner" },
  { title: "Anwesenheitsliste", icon: ClipboardList, page: "sign-out-table" },
  { title: "Mitarbeiter/Events", icon: Users, page: "employee-overview" },
  { title: "Rollen", icon: Shield, page: "roles" },
]

interface AppSidebarProps {
  currentPage: string
  setCurrentPage: (page: string) => void
  authorizationMode: boolean
  setAuthorizationMode: (mode: boolean) => void
  selectedForAuth: string[]
  setSelectedForAuth: (selected: string[]) => void
  setAuthorizedUsers: (users: string[]) => void
  authorizedUsers: string[]
  selectedEvent?: any
  eventStats?: {
    required: number
    available: number
    assigned: number
  }
}

export function AppSidebar({
  currentPage,
  setCurrentPage,
  authorizationMode,
  setAuthorizationMode,
  selectedForAuth,
  setSelectedForAuth,
  setAuthorizedUsers,
  authorizedUsers,
  selectedEvent,
  eventStats,
}: AppSidebarProps) {
  const { user, signOut } = useAuth()
  const { selectedEvent: contextSelectedEvent } = useEventContext()
  // Configuration history removed - no more locking system
  
  // Use context selected event if available
  const displayEvent = selectedEvent || contextSelectedEvent

  const handleAuthorizationClick = () => {
    if (selectedForAuth.length > 0) {
      // Confirm authorization - update authorized users list
      setAuthorizedUsers(selectedForAuth)
      setSelectedForAuth([])
      setAuthorizationMode(false)
    } else {
      // Toggle authorization mode
      if (!authorizationMode) {
        // When entering authorization mode, pre-select all authorized users
        setSelectedForAuth([...authorizedUsers])
      } else {
        // When exiting authorization mode, clear selections
        setSelectedForAuth([])
      }
      setAuthorizationMode(!authorizationMode)
    }
  }

  return (
    <TooltipProvider>
      <Sidebar 
        className="bg-white/95 backdrop-blur-xl shadow-xl transition-all duration-500 ease-out"
        collapsible="offcanvas"
      >
        <SidebarHeader className="px-6 py-6 transition-all duration-500">
          <div className="flex items-center justify-start gap-3" style={{ fontFamily: 'Century Gothic, sans-serif' }}>
            {/* EMS Icon */}
            <div className="flex-shrink-0">
              <img 
                src="/ems-icon.png" 
                alt="EMS Icon" 
                width={32} 
                height={32} 
                className="object-contain"
              />
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-blue-700" style={{
                background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #60a5fa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                EMS
              </span>
              <span className="text-lg font-semibold tracking-wide text-blue-600" style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Manager
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-4 py-4 flex-1 overflow-hidden">
          <SidebarGroup>
            <SidebarGroupLabel className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-3">
                <div className="relative">
                  {/* Sliding background highlight that moves up and down with perfect centering */}
                  <div 
                    className="absolute left-0 right-0 bg-blue-500/15 border border-blue-400/30 rounded-xl transition-all duration-500 ease-out backdrop-blur-sm shadow-sm"
                    style={{
                      height: '48px',
                      transform: `translateY(${navigationItems.findIndex(item => item.page === currentPage) * 48}px)`,
                      opacity: currentPage ? 1 : 0,
                      top: '0px'
                    }}
                  />
                  
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title} className="relative">
                      <button 
                        onClick={() => setCurrentPage(item.page)}
                        className={`group h-12 w-full flex items-center justify-start gap-3 px-4 rounded-xl font-medium transition-all duration-300 z-10 relative bg-transparent hover:bg-transparent focus:outline-none ${
                          currentPage === item.page
                            ? "text-blue-600"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <item.icon className={`h-5 w-5 flex-shrink-0 transition-all duration-300 ${
                          currentPage === item.page
                            ? "text-blue-600"
                            : "text-gray-600"
                        } group-hover:scale-110`} />
                        <span className={`flex-1 text-left transition-all duration-300 ${
                          currentPage === item.page
                            ? "text-blue-600 font-medium"
                            : "text-gray-600"
                        }`}>
                          {item.title}
                        </span>
                      </button>
                    </SidebarMenuItem>
                  ))}
                </div>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="my-6 bg-gray-200/40" />

          {/* Event Statistics Section */}
          {selectedEvent && eventStats && (
            <>
              <SidebarGroup>
                <SidebarGroupLabel className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {selectedEvent.name}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <div className="space-y-3 px-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Benötigt</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        {eventStats.required}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Verfügbar</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        {eventStats.available}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Zugewiesen</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {eventStats.assigned}
                      </span>
                    </div>
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarSeparator className="my-6 bg-gray-200/40" />
            </>
          )}

          <SidebarGroup>
            <SidebarGroupContent>
              <div className="space-y-3">
                <button
                  onClick={handleAuthorizationClick}
                  className={`flex items-center justify-center gap-2 h-9 w-full px-4 rounded-full text-sm font-medium transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    selectedForAuth.length > 0
                      ? "bg-green-100 text-green-700 hover:bg-green-200 focus-visible:ring-green-500 border border-green-200"
                      : authorizationMode
                      ? "bg-red-100 text-red-700 hover:bg-red-200 focus-visible:ring-red-500 border border-red-200"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200 focus-visible:ring-blue-500 border border-blue-200"
                  }`}
                >
                  <Lock className="h-4 w-4" />
                  <span>
                    {selectedForAuth.length > 0 
                      ? "Bestätigen" 
                      : authorizationMode 
                      ? "Abbrechen" 
                      : "Authorisieren"
                    }
                  </span>
                </button>
                
                {/* Configuration history removed - no more reset buttons needed */}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4">
          <SidebarMenu className="space-y-2">
            <SidebarMenuItem>
              <a 
                href="#" 
                aria-label="Help and Support"
                className="flex items-center gap-2 h-10 w-full px-3 rounded-lg font-medium transition-all duration-300 text-gray-600 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <HelpCircle className="h-4 w-4 text-blue-500" />
                <span>Hilfe & Support</span>
              </a>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <a 
                href="#" 
                aria-label="Documentation"
                className="flex items-center gap-2 h-10 w-full px-3 rounded-lg font-medium transition-all duration-300 text-gray-600 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <FileText className="h-4 w-4 text-blue-500" />
                <span>Dokumentation</span>
              </a>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border">
                <User className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-700 flex-1">{user?.email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                  title="Sign Out"
                >
                  <LogOut className="h-3 w-3" />
                </Button>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  )
}
