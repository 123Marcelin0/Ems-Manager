"use client"

import { useState, useEffect } from "react"
import { useEmployees } from "@/hooks/use-employees"
import { useEvents } from "@/hooks/use-events"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { EventProvider, useEventContext } from "@/hooks/use-event-context"
import { ProtectedPage } from "./protected-page"

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
  // Use global event context - no longer need to manage selectedEvent locally
  const { selectedEvent } = useEventContext();
  
  // ALL useState hooks must be declared consistently - no conditional returns between hooks
  const [activeFilter, setActiveFilter] = useState("all");
  const [requiredEmployees, setRequiredEmployees] = useState("0");
  const [currentPage, setCurrentPage] = useState("work-planner");
  const [authorizationMode, setAuthorizationMode] = useState(false);
  const [selectedForAuth, setSelectedForAuth] = useState<string[]>([]);
  const [authorizedUsers, setAuthorizedUsers] = useState<string[]>([]);
  const [eventSchedulerView, setEventSchedulerView] = useState("planner");
  const [showWorkAreaAssignment, setShowWorkAreaAssignment] = useState(false);
  const [workAreaView, setWorkAreaView] = useState("event");
  const [employeeOverviewView, setEmployeeOverviewView] = useState("mitarbeiter");
  const [localEvents, setLocalEvents] = useState<Event[]>([]);
  const [roleSearchQuery, setRoleSearchQuery] = useState("");
  const [selectedEmployeeForOverview, setSelectedEmployeeForOverview] = useState<string | null>(null);
  const [localEmployees, setLocalEmployees] = useState<any[]>([]);
  const [mitteilungenSaved, setMitteilungenSaved] = useState(false);

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

  // Reset Mitteilungen saved state when event changes
  useEffect(() => {
    setMitteilungenSaved(false);
  }, [selectedEvent?.id]);

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

  // Use employees or example data, but always show example employees if no real employees exist
  // Prioritize localEmployees (which contains status updates) over base employees
  let finalEmployees;
  if (localEmployees.length > 0) {
    // If we have local employee state (with status updates), use it
    finalEmployees = localEmployees;
  } else if (dbEmployees.length === 0) {
    // If no database employees exist, use example data
    finalEmployees = exampleEmployees;
  } else {
    // Otherwise use the transformed database employees
    finalEmployees = employees;
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
    // Don't set initial event if still loading data
    if (employeesLoading || eventsLoading) return
    
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
    if (!selectedEvent) return;
    
    const count = Number.parseInt(requiredEmployees) || 0
    if (count <= 0) return

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
      // Filter selectable employees, excluding those with "always-needed" status
      const selectableEmployees = finalEmployees.filter((e) => 
        e.status !== "always-needed" && (e.status === "available" || e.status === "not-selected")
      )
      
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
      
      // Update local state regardless of API success
      // Initialize localEmployees if not already done
      if (localEmployees.length === 0) {
        setLocalEmployees((dbEmployees.length === 0 ? exampleEmployees : employees).map((employee: any) => 
          employee.status !== "always-needed" 
            ? { ...employee, status: "not-selected" }
            : employee
        ));
      } else {
        // Reset all employee statuses to "not-selected" except "always-needed"
        setLocalEmployees((prev: any[]) => prev.map((employee: any) => 
          employee.status !== "always-needed" 
            ? { ...employee, status: "not-selected" }
            : employee
        ));
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

  // Load employee statuses when event changes
  useEffect(() => {
    const loadEmployeeStatuses = async () => {
      if (!selectedEvent?.id || dbEmployees.length === 0) return;
      
      try {
        console.log(`Loading employee statuses for event: ${selectedEvent.id}`);
        
        // Fetch employees with their statuses for this event
        const employeesWithStatus = await fetchEmployeesWithStatus(selectedEvent.id);
        
        // Transform to match UI format and set local state
        const transformedEmployees = employeesWithStatus.map(emp => {
          // Get the status from the employee_event_status array
          const eventStatus = emp.employee_event_status?.[0]?.status;
          
          // Map database status to UI status
          let uiStatus = "not-selected"; // default
          if (eventStatus) {
            switch (eventStatus) {
              case 'available':
                uiStatus = "available";
                break;
              case 'selected':
                uiStatus = "selected";
                break;
              case 'unavailable':
                uiStatus = "unavailable";
                break;
              case 'always_needed':
                uiStatus = "always-needed";
                break;
              case 'not_asked':
              default:
                uiStatus = "not-selected";
                break;
            }
          } else if (emp.is_always_needed) {
            // If no status but employee is always needed, set to always-needed
            uiStatus = "always-needed";
          }
          
          return {
            id: emp.id,
            name: emp.name,
            userId: emp.user_id,
            lastSelection: emp.last_worked_date ? new Date(emp.last_worked_date).toLocaleString() : "Nie",
            status: uiStatus,
            notes: `${emp.role} - ${emp.employment_type === 'fixed' ? 'Festangestellt' : 'Teilzeit'}`
          };
        });
        
        setLocalEmployees(transformedEmployees);
        console.log(`Loaded ${transformedEmployees.length} employees with statuses for event ${selectedEvent.id}`);
        
      } catch (error) {
        console.error('Error loading employee statuses:', error);
        
        // Fallback: set default statuses
        const defaultEmployees = dbEmployees.map(emp => ({
          id: emp.id,
          name: emp.name,
          userId: emp.user_id,
          lastSelection: emp.last_worked_date ? new Date(emp.last_worked_date).toLocaleString() : "Nie",
          status: emp.is_always_needed ? "always-needed" : "not-selected",
          notes: `${emp.role} - ${emp.employment_type === 'fixed' ? 'Festangestellt' : 'Teilzeit'}`
        }));
        
        setLocalEmployees(defaultEmployees);
      }
    };
    
    loadEmployeeStatuses();
  }, [selectedEvent?.id, dbEmployees.length, fetchEmployeesWithStatus]);

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
    // Update employee status in local state immediately for UI responsiveness
    setLocalEmployees((prev: any[]) => {
      const updated = prev.map((employee: any) => 
        employee.id === employeeId 
          ? { 
              ...employee, 
              status: newStatus,
              // Update last selection time for selected employees
              lastSelection: newStatus === "selected" ? new Date().toLocaleDateString('de-DE') + ', ' + new Date().toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'}) : employee.lastSelection
            }
          : employee
      );
      
      console.log('🔄 Updated local employee status:', employeeId, 'to', newStatus);
      return updated;
    });
    
    // Update employee event status in database
    if (selectedEvent?.id) {
      try {
        console.log(`Updating status for employee ${employeeId} to ${newStatus} for event ${selectedEvent.id}`);
        
        await updateEmployeeStatus(employeeId, selectedEvent.id, newStatus);
        
        console.log('✅ Successfully updated employee status in database');
        
        // Optionally refresh employee list after a delay to ensure consistency
        setTimeout(() => {
          if (selectedEvent?.id) {
            fetchEmployeesWithStatus(selectedEvent.id).then(employeesWithStatus => {
              const transformedEmployees = employeesWithStatus.map(emp => {
                const eventStatus = emp.employee_event_status?.[0]?.status;
                let uiStatus = "not-selected";
                if (eventStatus) {
                  switch (eventStatus) {
                    case 'available': uiStatus = "available"; break;
                    case 'selected': uiStatus = "selected"; break;
                    case 'unavailable': uiStatus = "unavailable"; break;
                    case 'always_needed': uiStatus = "always-needed"; break;
                    case 'not_asked':
                    default: uiStatus = "not-selected"; break;
                  }
                } else if (emp.is_always_needed) {
                  uiStatus = "always-needed";
                }
                
                return {
                  id: emp.id,
                  name: emp.name,
                  userId: emp.user_id,
                  lastSelection: emp.last_worked_date ? new Date(emp.last_worked_date).toLocaleString() : "Nie",
                  status: uiStatus,
                  notes: `${emp.role} - ${emp.employment_type === 'fixed' ? 'Festangestellt' : 'Teilzeit'}`
                };
              });
              
              setLocalEmployees(transformedEmployees);
            }).catch(error => {
              console.error('Error refreshing employee statuses:', error);
            });
          }
        }, 1000);
        
      } catch (error) {
        console.error('❌ Error updating employee status:', error);
        
        // Revert local state on error
        setLocalEmployees((prev: any[]) => {
          return prev.map((employee: any) => 
            employee.id === employeeId 
              ? { 
                  ...employee, 
                  status: employee.status // Keep original status
                }
              : employee
          );
        });
      }
    }
    
    console.log('Updated employee status:', employeeId, newStatus, 'for event:', selectedEvent?.id);
  }

  const handleNavigateToEmployeeOverview = (employeeId: string) => {
    setSelectedEmployeeForOverview(employeeId);
    setCurrentPage("employee-overview");
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
              
              // Navigate to work planner with event view
              setCurrentPage("work-planner");
              setWorkAreaView("event");
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
    <ProtectedPage>
      <EventProvider>
        <DashboardContent />
      </EventProvider>
    </ProtectedPage>
  )
}
