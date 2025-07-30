"use client"

import { useState, useEffect } from "react"
import { useEmployees } from "@/hooks/use-employees"
import { useEvents } from "@/hooks/use-events"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { EventProvider, useEventContext } from "@/hooks/use-event-context"
import { usePersistentEventState, usePersistentAppState } from "@/hooks/use-persistent-state"
import { AuthProvider } from "@/components/auth/auth-provider"
import { AuthWrapper } from "@/components/auth/auth-wrapper"

import { QuickActions } from "@/components/quick-actions"
import { EmployeeSection } from "@/components/employee-section"
import { SignOutTable } from "@/components/sign-out-table"
import { EmployeeOverview } from "@/components/employee-overview"
import { WorkPlanner } from "@/components/work-planner"
import { EventSelector } from "@/components/event-selector"
import { EmployeeRecruitmentStatus } from "@/components/employee-recruitment-status"
import { RoleManagement } from "@/components/work-area/role-management"
import { Mitteilungen } from "@/components/mitteilungen"
import { Button } from "@/components/ui/button"



// Define types for employee event statuses
type EmployeeStatus = "available" | "selected" | "unavailable" | "always-needed" | "not-selected";

// Define Event type locally
interface Event {
  id: string
  name: string
  date: string
  employeesNeeded: number
  employeesToAsk: number
  alwaysNeededCount?: number
  status?: string
}

function DashboardContent() {
  // Use real Supabase data
  const { employees: dbEmployees, loading: employeesLoading, getEmployeesForSelection, fetchEmployeesWithStatus, updateEmployeeStatus } = useEmployees();
  const { events: dbEvents, loading: eventsLoading, fetchEvents } = useEvents();
  // Use global event context - this now includes employee data with statuses
  const { selectedEvent, eventEmployees, isLoading: eventLoading, refreshEventData } = useEventContext();
  
  // Use persistent state management
  const {
    workAreaView,
    employeeOverviewView,
    eventSchedulerView,
    showWorkAreaAssignment,
    mitteilungenSaved,
    setWorkAreaView,
    setEmployeeOverviewView,
    setEventSchedulerView,
    setShowWorkAreaAssignment,
    setMitteilungenSaved,
    isLoaded: persistentStateLoaded
  } = usePersistentEventState(selectedEvent?.id || null);

  const {
    currentPage,
    authorizationMode,
    selectedForAuth,
    authorizedUsers,
    setCurrentPage,
    setAuthorizationMode,
    setSelectedForAuth,
    setAuthorizedUsers
  } = usePersistentAppState();
  
  // Non-persistent state
  const [activeFilter, setActiveFilter] = useState("all");
  const [requiredEmployees, setRequiredEmployees] = useState("0");
  const [localEvents, setLocalEvents] = useState<Event[]>([]);
  const [roleSearchQuery, setRoleSearchQuery] = useState("");
  const [selectedEmployeeForOverview, setSelectedEmployeeForOverview] = useState<string | null>(null);

  // Sign-out table specific state
  const [signOutRecords] = useState([
    { id: "SO001", employeeName: "Anna Schmidt", status: "signed-in" },
    { id: "SO002", employeeName: "Tom Fischer", status: "signed-out" },
    { id: "SO003", employeeName: "Sarah Klein", status: "signed-out" },
  ]);

  // Reset work area assignment when changing pages
  useEffect(() => {
    if (currentPage !== "sign-out-table") {
      setShowWorkAreaAssignment(false);
    }
  }, [currentPage]);

  // Set default filter to "event" when on Anwesenheitsliste page
  useEffect(() => {
    if (currentPage === "sign-out-table") {
      setActiveFilter("event");
    } else {
      setActiveFilter("all");
    }
  }, [currentPage]);

  // Handle Mitteilungen saved callback
  const handleMitteilungenSaved = () => {
    setMitteilungenSaved(true);
  };

  // Handle Mitteilungen continue (navigate to Arbeitsbereiche)
  const handleMitteilungenContinue = () => {
    setWorkAreaView("arbeitsbereiche");
  };

  // Transform database employees to match UI format
  const employees = dbEmployees.map(emp => ({
    id: emp.id,
    name: emp.name,
    userId: emp.user_id,
    lastSelection: emp.last_worked_date ? new Date(emp.last_worked_date).toLocaleString() : "Nie",
    status: emp.is_always_needed ? "always-needed" : "not-selected", // Default status: 'not-selected' unless always-needed
    notes: `${emp.role} - ${emp.employment_type === 'fixed' ? 'Festangestellt' : 'Teilzeit'}`
  }));

  // Example employees for when no database data exists
  const exampleEmployees = [
    {
      id: "emp-001",
      name: "Anna Schmidt",
      userId: "anna.schmidt",
      lastSelection: "12.01.2025, 14:30",
      status: "not-selected",
      notes: "Allrounder - Teilzeit"
    },
    {
      id: "emp-002", 
      name: "Thomas Müller",
      userId: "thomas.mueller",
      lastSelection: "10.01.2025, 09:15",
      status: "not-selected",
      notes: "Versorger - Festangestellt"
    },
    {
      id: "emp-003",
      name: "Sarah Klein",
      userId: "sarah.klein", 
      lastSelection: "08.01.2025, 16:45",
      status: "not-selected",
      notes: "Verkauf - Teilzeit"
    },
    {
      id: "emp-004",
      name: "Michael Weber",
      userId: "michael.weber",
      lastSelection: "15.01.2025, 11:20",
      status: "always-needed", 
      notes: "Manager - Festangestellt"
    },
    {
      id: "emp-005",
      name: "Lisa Wagner",
      userId: "lisa.wagner",
      lastSelection: "14.01.2025, 13:00",
      status: "not-selected",
      notes: "Essen - Teilzeit"
    }
  ];

  // Use employees from event context (which includes status data) or fallback appropriately
  let finalEmployees;
  
  // Priority 1: Use event context employees if available (includes persisted status data)
  if (eventEmployees.length > 0) {
    console.log('📋 App: Using event context employees with persisted status data')
    finalEmployees = eventEmployees;
  } 
  // Priority 2: If event context is still loading but we have a selected event, wait for it
  else if (selectedEvent && eventLoading) {
    console.log('📋 App: Event context is loading, using empty array to prevent status reset')
    finalEmployees = []; // Don't use fallback data while loading to prevent status reset
  }
  // Priority 3: If no database employees exist, use example data
  else if (dbEmployees.length === 0) {
    console.log('📋 App: No database employees, using example data')
    finalEmployees = exampleEmployees;
  } 
  // Priority 4: Use transformed database employees as last resort (but this loses status data)
  else {
    console.log('⚠️ App: Using transformed database employees - status data may be lost')
    finalEmployees = employees;
  }
  
  // Only use example employees if we have no other option and no event is selected
  if (finalEmployees.length === 0 && !selectedEvent) {
    console.log('📋 App: No employees available and no event selected, using example data')
    finalEmployees = exampleEmployees;
  }

  // Transform database events to match UI format
  const events = [...dbEvents.map(evt => ({
    id: evt.id,
    name: evt.title,
    date: new Date(evt.event_date).toLocaleDateString(),
    employeesNeeded: evt.employees_needed,
    employeesToAsk: evt.employees_to_ask,
    alwaysNeededCount: dbEmployees.filter(emp => emp.is_always_needed).length
  })), ...localEvents];

  // Force refresh events when new ones are created
  const refreshEvents = () => {
    fetchEvents()
  }

  // Enhanced initial event selection handling
  useEffect(() => {
    // Don't set initial event if still loading data or persistent state
    if (employeesLoading || eventsLoading || !persistentStateLoaded) return
    
    // If no events exist, that's okay - user needs to create one first
    if (events.length === 0) {
      console.log('ℹ️ No events available - user can create new events')
      return
    }
    
    // Only set default event if none is selected and we have events available
    if (!selectedEvent && events.length > 0) {
      console.log('🎯 Setting default event:', events[0].name)
      // Note: This is now handled by EventContext
    }
  }, [events, selectedEvent, employeesLoading, eventsLoading])

  // Update required employees when selected event changes
  useEffect(() => {
    if (selectedEvent) {
      const alwaysNeededCount = finalEmployees.filter(emp => emp.status === "always-needed").length;
      const neededAfterAlwaysNeeded = Math.max(0, selectedEvent.employeesNeeded - alwaysNeededCount);
      setRequiredEmployees(neededAfterAlwaysNeeded.toString());
      console.log(`Updated required employees for event ${selectedEvent.name}: ${neededAfterAlwaysNeeded}`);
    }
  }, [selectedEvent, finalEmployees])

  // Calculate stats based on current page
  const stats = currentPage === "sign-out-table" ? {
    total: signOutRecords.length,
    available: signOutRecords.filter((r) => r.status === "signed-in").length,
    selected: signOutRecords.filter((r) => r.status === "signed-out").length,
    unavailable: 0,
    alwaysNeeded: 0,
  } : {
    total: finalEmployees.length,
    available: finalEmployees.filter((e) => e.status === "available").length,
    selected: finalEmployees.filter((e) => e.status === "selected").length,
    unavailable: finalEmployees.filter((e) => e.status === "unavailable").length,
    alwaysNeeded: finalEmployees.filter((e) => e.status === "always-needed").length,
  }

  const filteredEmployees = finalEmployees.filter((employee) => {
    if (activeFilter === "all") return true
    if (activeFilter === "available") return employee.status === "available"
    if (activeFilter === "selected") return employee.status === "selected"
    if (activeFilter === "unavailable") return employee.status === "unavailable"
    return false
  })

  const handleRandomSelection = async () => {
    console.log('🎲 handleRandomSelection called:', { selectedEvent: selectedEvent?.id, requiredEmployees, count: Number.parseInt(requiredEmployees) });
    
    if (!selectedEvent) {
      console.log('❌ No selected event');
      return;
    }
    
    const count = Number.parseInt(requiredEmployees) || 0
    if (count <= 0) {
      console.log('❌ Invalid count:', count);
      return;
    }

    try {
      // First, try to use the API endpoint for random selection
      try {
        const response = await fetch('/api/events/random-selection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_id: selectedEvent.id,
            count: count
          }),
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log('Random selection successful via API:', result.data);
          
          // Update local state to reflect the changes
          if (result.data.selectedEmployees && result.data.selectedEmployees.length > 0) {
            // Update local state for each selected employee
            for (const employee of result.data.selectedEmployees) {
              // Find the employee in our local state
              const localEmployee = finalEmployees.find(emp => emp.id === employee.employee_id);
              if (localEmployee) {
                await handleStatusChange(localEmployee.id, "selected");
              }
            }
            
            // Force a small delay to ensure state is updated before resetting count
            await new Promise(resolve => setTimeout(resolve, 100));
            
            console.log('✅ Random selection completed - UI should now show employees as "Ausgewählt"');
          }
          
          // Reset the required employees count
          setRequiredEmployees("0");
          return;
        }
        
        console.error('API random selection failed, falling back to client-side selection:', result.error);
      } catch (apiError) {
        console.error('API random selection error, falling back to client-side selection:', apiError);
      }
      
      // Fallback to client-side random selection if API fails
      console.log('📊 Available employees for selection:', finalEmployees.length);
      console.log('📊 Employee statuses:', finalEmployees.map(e => ({ name: e.name, status: e.status })));
      
      // Filter selectable employees, excluding those with "always-needed" status
      const selectableEmployees = finalEmployees.filter((e) => 
        e.status !== "always-needed" && (e.status === "available" || e.status === "not-selected")
      )
      
      console.log('📊 Selectable employees:', selectableEmployees.length);
      
      // Sort by lastSelection date - prioritize those who haven't been selected the longest
      // Those who were never selected (null/undefined lastSelection) come first
      const sortedByLastSelection = [...selectableEmployees].sort((a, b) => {
        // Handle null/undefined lastSelection dates (never selected employees)
        if (!a.lastSelection && !b.lastSelection) return 0
        if (!a.lastSelection) return -1 // a comes first (never selected)
        if (!b.lastSelection) return 1  // b comes first (never selected)
        
        // Parse dates and sort oldest first (longest time since last selection)
        const dateA = new Date(a.lastSelection.replace(/(\d{2})\.(\d{2})\.(\d{4}), (\d{2}):(\d{2})/, '$3-$2-$1T$4:$5:00'))
        const dateB = new Date(b.lastSelection.replace(/(\d{2})\.(\d{2})\.(\d{4}), (\d{2}):(\d{2})/, '$3-$2-$1T$4:$5:00'))
        
        return dateA.getTime() - dateB.getTime() // Oldest selection first
      })
      
      // Select the required number of employees from the sorted list
      const selected = sortedByLastSelection.slice(0, Math.min(count, sortedByLastSelection.length))

      // Update employee statuses to "selected" 
      for (const employee of selected) {
        await handleStatusChange(employee.id, "selected")
      }

      console.log('✅ Client-side random selection completed:', selected.length, 'employees selected');
      console.log('Selected employees based on longest time since last selection:', selected);
      
      // Reset the required employees count
      setRequiredEmployees("0");
    } catch (error) {
      console.error('Error selecting employees:', error);
    }
  }

  const handleResetAll = async () => {
    if (!selectedEvent) return;
    
    try {
      // First, try to use the API endpoint for resetting employees
      try {
        const response = await fetch('/api/events/reset-employees', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_id: selectedEvent.id
          }),
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log('Reset employees successful via API:', result.data);
        } else {
          console.error('API reset failed, falling back to client-side reset:', result.error);
        }
      } catch (apiError) {
        console.error('API reset error, falling back to client-side reset:', apiError);
      }
      
      // Reset all employee statuses in database for this event
      if (selectedEvent?.id) {
        // Reset all employees to "not-selected" except "always-needed"
        for (const employee of finalEmployees) {
          if (employee.status !== "always-needed") {
            await handleStatusChange(employee.id, "not-selected");
          }
        }
        
        // Refresh event data to reflect changes
        refreshEventData();
      }
      
      console.log('Reset all employees for event:', selectedEvent.id);
      
      // Reset the required employees count based on the event's needed count
      // and the number of "always-needed" employees
      if (selectedEvent.employeesNeeded && selectedEvent.alwaysNeededCount !== undefined) {
        const neededAfterAlwaysNeeded = Math.max(0, 
          selectedEvent.employeesNeeded - selectedEvent.alwaysNeededCount
        );
        setRequiredEmployees(neededAfterAlwaysNeeded.toString());
      }
    } catch (error) {
      console.error('Error resetting employees:', error);
    }
  }

  // Handle event selection
  const handleEventSelect = (event: Event) => {
    // setSelectedEvent(event); // This line is removed as per the edit hint
    
    // Update required employees based on event
    const neededAfterAlwaysNeeded = Math.max(0, event.employeesNeeded - (event.alwaysNeededCount || 0));
    setRequiredEmployees(neededAfterAlwaysNeeded.toString());
  };
  
  // Handle changing the number of employees needed for an event
  const handleEmployeesNeededChange = (eventId: string, needed: number) => {
    // Update the selected event if it matches
    if (selectedEvent && selectedEvent.id === eventId) {
      const updatedEvent = { ...selectedEvent, employeesNeeded: needed };
      // setSelectedEvent(updatedEvent); // This line is removed as per the edit hint
    }
    
    // Update local events array
    setLocalEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, employeesNeeded: needed }
        : event
    ));
    
    // TODO: Update event in database
    console.log('Update employees needed for event:', eventId, needed);
  };
  
  // Handle changing the number of employees to ask for an event
  const handleEmployeesToAskChange = (eventId: string, toAsk: number) => {
    // Update the selected event if it matches
    if (selectedEvent && selectedEvent.id === eventId) {
      const updatedEvent = { ...selectedEvent, employeesToAsk: toAsk };
      // setSelectedEvent(updatedEvent); // This line is removed as per the edit hint
    }
    
    // Update local events array
    setLocalEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, employeesToAsk: toAsk }
        : event
    ));
    
    // TODO: Update event in database
    console.log('Update employees to ask for event:', eventId, toAsk);
  };

  // Wrapper for handleStatusChange to handle type conversion
  const handleStatusChangeString = (employeeId: string, newStatus: string) => {
    handleStatusChange(employeeId, newStatus as any);
  };

  // Employee status loading is now handled by the event context

  // Calendar toggle functionality removed

  // Handle adding new event from work planner
  const handleAddNewEvent = (eventData: any) => {
    // The event should already be saved to database at this point
    // Just refresh the events list to show it
    refreshEvents()
    
    // Find the newly created event and select it
    setTimeout(() => {
      const newestEvent = events.find(e => e.name === eventData.title)
      if (newestEvent) {
        // setSelectedEvent(newestEvent) // This line is removed as per the edit hint
        const neededAfterAlwaysNeeded = Math.max(0, newestEvent.employeesNeeded - (newestEvent.alwaysNeededCount || 0));
        setRequiredEmployees(neededAfterAlwaysNeeded.toString());
      }
    }, 1000)
    
    console.log('Event created, refreshing list...')
  };



  const handleStatusChange = async (employeeId: string, newStatus: EmployeeStatus) => {
    console.log('🔄 Mitteilungen: handleStatusChange called:', { employeeId, newStatus, selectedEvent: selectedEvent?.id });
    
    // Update employee event status in database (only for real employees, not examples)
    if (selectedEvent?.id && !employeeId.startsWith('emp-')) {
      try {
        console.log(`Mitteilungen: Updating status for employee ${employeeId} to ${newStatus} for event ${selectedEvent.id}`);
        
        // Use the standard employee status update
        if (updateEmployeeStatus) {
          await updateEmployeeStatus(employeeId, selectedEvent.id, newStatus);
          console.log('✅ Mitteilungen: Successfully updated employee status in database');
          
          // Refresh event context data to get updated statuses (with retry mechanism)
          setTimeout(async () => {
            await refreshEventData(1); // Pass retry count
          }, 200);
          
          // Also trigger work area sync if status changed to/from selected
          if (newStatus === 'selected' || newStatus === 'available') {
            // Dispatch event to notify work area components
            window.dispatchEvent(new CustomEvent('employeeStatusChanged', { 
              detail: { employeeId, newStatus, eventId: selectedEvent.id } 
            }));
          }
          
        } else {
          console.warn('Mitteilungen: updateEmployeeStatus function not available, status updated locally only');
        }
        
      } catch (error) {
        console.error('❌ Mitteilungen: Error updating employee status:', error);
        // Don't revert local state for database errors - keep the UI responsive
      }
    } else if (employeeId.startsWith('emp-')) {
      console.log('📝 Mitteilungen: Example employee status updated locally only');
    }
    
    console.log('✅ Mitteilungen: Employee status update completed:', employeeId, newStatus);
  }

  const handleNavigateToEmployeeOverview = (employeeId: string) => {
    setSelectedEmployeeForOverview(employeeId);
    setCurrentPage("employee-overview");
  }

  // Show loading screen while persistent state is loading
  if (!persistentStateLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event settings...</p>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (currentPage) {
      case "roles":
        return <RoleManagement 
          searchQuery={roleSearchQuery}
          setSearchQuery={setRoleSearchQuery}
          onNavigateToEmployeeOverview={handleNavigateToEmployeeOverview}
        />
      case "work-planner":
        // Handle mitteilungen view within work planner
        if (workAreaView === "mitteilungen") {
          return <Mitteilungen
            employees={finalEmployees}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            stats={stats}
            requiredEmployees={requiredEmployees}
            setRequiredEmployees={setRequiredEmployees}
            onRandomSelection={handleRandomSelection}
            onResetAll={handleResetAll}
            onEmployeesNeededChange={handleEmployeesNeededChange}
            onEmployeesToAskChange={handleEmployeesToAskChange}
            onStatusChange={handleStatusChangeString}
            authorizationMode={authorizationMode}
            selectedForAuth={selectedForAuth}
            setSelectedForAuth={setSelectedForAuth}
            authorizedUsers={authorizedUsers}
            onMitteilungenSaved={handleMitteilungenSaved}
            onMitteilungenContinue={handleMitteilungenContinue}
            mitteilungenSaved={mitteilungenSaved}
          />
        }
        return <WorkPlanner 
          workAreaView={workAreaView}
          setWorkAreaView={setWorkAreaView}
          onNavigateToDashboard={() => setCurrentPage("work-planner")}
          onAddNewEvent={handleAddNewEvent}
          // Pass only available employees for work area distribution
          availableEmployees={finalEmployees.filter(emp => emp.status === "available")}
          onEmployeeStatusChange={handleStatusChangeString}
        />
      case "sign-out-table":
        // Handle mitteilungen view within sign-out-table when work area assignment is active
        if (showWorkAreaAssignment && workAreaView === "mitteilungen") {
          return <Mitteilungen
            employees={finalEmployees}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            stats={stats}
            requiredEmployees={requiredEmployees}
            setRequiredEmployees={setRequiredEmployees}
            onRandomSelection={handleRandomSelection}
            onResetAll={handleResetAll}
            onEmployeesNeededChange={handleEmployeesNeededChange}
            onEmployeesToAskChange={handleEmployeesToAskChange}
            onStatusChange={handleStatusChangeString}
            authorizationMode={authorizationMode}
            selectedForAuth={selectedForAuth}
            setSelectedForAuth={setSelectedForAuth}
            authorizedUsers={authorizedUsers}
            onMitteilungenSaved={handleMitteilungenSaved}
            onMitteilungenContinue={handleMitteilungenContinue}
            mitteilungenSaved={mitteilungenSaved}
          />
        }
        return <SignOutTable 
          statusFilter={activeFilter}
          showWorkAreaAssignment={showWorkAreaAssignment}
          setShowWorkAreaAssignment={setShowWorkAreaAssignment}
          workAreaView={workAreaView}
          setWorkAreaView={setWorkAreaView}
          // Pass only available employees for work area distribution
          availableEmployees={finalEmployees.filter(emp => emp.status === "available")}
          onEmployeeStatusChange={handleStatusChangeString}
        />
      case "employee-overview":
        return <EmployeeOverview 
          viewMode={employeeOverviewView as "mitarbeiter" | "events"} 
          setViewMode={setEmployeeOverviewView}
          selectedEmployeeId={selectedEmployeeForOverview}
        />
      default:
        return <WorkPlanner 
          workAreaView={workAreaView}
          setWorkAreaView={setWorkAreaView}
          onNavigateToDashboard={() => setCurrentPage("work-planner")}
          onAddNewEvent={handleAddNewEvent}
        />
    }
  }

  // Calculate event statistics
  const eventStats = selectedEvent ? {
    required: selectedEvent.employeesNeeded || 0,
    available: finalEmployees.filter((e) => e.status === "available").length,
    assigned: finalEmployees.filter((e) => e.status === "selected").length,
  } : undefined;

  // Show loading state while data is being fetched
  if (employeesLoading || eventsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50/30 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data from database...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        authorizationMode={authorizationMode}
        setAuthorizationMode={setAuthorizationMode}
        selectedForAuth={selectedForAuth}
        setSelectedForAuth={setSelectedForAuth}
        setAuthorizedUsers={setAuthorizedUsers}
        authorizedUsers={authorizedUsers}
        selectedEvent={selectedEvent}
        eventStats={eventStats}
      />
      <SidebarInset>
        <div className="min-h-screen bg-gradient-to-br from-gray-50/30 to-white">
          <DashboardHeader 
            currentPage={currentPage} 
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            stats={stats}
            eventSchedulerView={eventSchedulerView}
            setEventSchedulerView={setEventSchedulerView}
            showWorkAreaAssignment={showWorkAreaAssignment}
            workAreaView={workAreaView}
            setWorkAreaView={setWorkAreaView}
            employeeOverviewView={employeeOverviewView}
            setEmployeeOverviewView={setEmployeeOverviewView}
            roleSearchQuery={roleSearchQuery}
            setRoleSearchQuery={setRoleSearchQuery}
            onNavigateToHome={() => setCurrentPage("work-planner")}
            mitteilungenSaved={mitteilungenSaved}
            onEventScheduled={(eventData) => {
              // Refresh events from database to show the newly created event
              refreshEvents()
              
              // Navigate to work planner (keep current workAreaView)
              setCurrentPage("work-planner");
            }}
          />

          <main className="px-8 pt-28 pb-8 lg:px-12">
            <div className="mx-auto max-w-7xl">{renderContent()}</div>
          </main>
        </div>

      </SidebarInset>
    </SidebarProvider>
  )
}

export default function Dashboard() {
  return (
    <AuthProvider>
      <AuthWrapper>
        <SidebarProvider>
          <EventProvider>
            <DashboardContent />
          </EventProvider>
        </SidebarProvider>
      </AuthWrapper>
    </AuthProvider>
  )
}
