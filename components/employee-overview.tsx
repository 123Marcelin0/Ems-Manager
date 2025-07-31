"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { ChevronDown, ArrowLeft, Clock, DollarSign, Calendar, FileSpreadsheet, CalendarDays, Users, BarChart3, MapPin, Euro, Settings, RefreshCw } from "lucide-react"
import { useEmployeeRoleSync } from "@/hooks/use-employee-role-sync"
import { useToast } from "@/hooks/use-toast"
import { useEventContext } from "@/hooks/use-event-context"
import { useEmployees } from "@/hooks/use-employees"
import { supabase } from "@/lib/supabase"

interface EmployeeWorkRecord {
  id: string
  employeeName: string
  period: string
  totalHours: number
  totalPayment: number
  hourlyRate: number
  events: WorkEvent[]
}

interface WorkEvent {
  id: string
  eventName: string
  date: string
  hoursWorked: number
  hourlyRate: number
  location: string
  startTime: string
  endTime: string
}

interface EventRecord {
  id: string
  name: string
  date: string
  location: string
  totalEmployees: number
  totalHours: number
  totalCost: number
  status: "completed" | "ongoing" | "upcoming"
  employees: EventEmployee[]
}

interface EventEmployee {
  id: string
  name: string
  role: string
  startTime: string
  endTime: string
  hoursWorked: number
  hourlyRate: number
  totalPay: number
}

interface EmployeeOverviewProps {
  viewMode: "mitarbeiter" | "events"
  setViewMode?: (mode: string) => void
  selectedEmployeeId?: string | null
}

// Mock events data
const mockEventsData: EventRecord[] = [
  {
    id: "EVENT001",
    name: "Summer Festival 2025",
    date: "25.07.2025",
    location: "Emslandarena",
    totalEmployees: 12,
    totalHours: 96,
    totalCost: 1440.00,
    status: "upcoming",
    employees: [
      {
        id: "EMP001",
        name: "Anna Schmidt",
        role: "Verkauf",
        startTime: "14:00",
        endTime: "22:00", 
        hoursWorked: 8,
        hourlyRate: 15.50,
        totalPay: 124.00
      },
      {
        id: "EMP002",
        name: "Tom Fischer",
        role: "Allrounder",
        startTime: "13:30",
        endTime: "21:30",
        hoursWorked: 8,
        hourlyRate: 16.00,
        totalPay: 128.00
      },
      {
        id: "EMP003",
        name: "Sarah Klein",
        role: "Manager",
        startTime: "12:00",
        endTime: "23:00",
        hoursWorked: 11,
        hourlyRate: 18.00,
        totalPay: 198.00
      }
    ]
  },
  {
    id: "EVENT002", 
    name: "Corporate Conference",
    date: "15.08.2025",
    location: "Emslandhalle",
    totalEmployees: 8,
    totalHours: 64,
    totalCost: 1024.00,
    status: "completed",
    employees: [
      {
        id: "EMP001",
        name: "Anna Schmidt",
        role: "Versorger",
        startTime: "08:00",
        endTime: "16:00",
        hoursWorked: 8,
        hourlyRate: 16.00,
        totalPay: 128.00
      },
      {
        id: "EMP004",
        name: "Mike Johnson",
        role: "Allrounder",
        startTime: "07:30",
        endTime: "15:30",
        hoursWorked: 8,
        hourlyRate: 15.75,
        totalPay: 126.00
      }
    ]
  },
  {
    id: "EVENT003",
    name: "Product Launch",
    date: "05.09.2025",
    location: "Mobile Counter",
    totalEmployees: 15,
    totalHours: 120,
    totalCost: 1950.00,
    status: "ongoing",
    employees: [
      {
        id: "EMP002",
        name: "Tom Fischer",
        role: "Verkauf",
        startTime: "18:00",
        endTime: "23:00",
        hoursWorked: 5,
        hourlyRate: 16.50,
        totalPay: 82.50
      }
    ]
  },
  {
    id: "EVENT004",
    name: "Wintermarkt 2025",
    date: "15.12.2025",
    location: "Stadtplatz",
    totalEmployees: 10,
    totalHours: 80,
    totalCost: 1200.00,
    status: "upcoming",
    employees: [
      {
        id: "EMP005",
        name: "Lisa Wagner",
        role: "Essen",
        startTime: "10:00",
        endTime: "18:00",
        hoursWorked: 8,
        hourlyRate: 15.00,
        totalPay: 120.00
      },
      {
        id: "EMP006",
        name: "Michael Weber",
        role: "Verkauf",
        startTime: "09:00",
        endTime: "17:00",
        hoursWorked: 8,
        hourlyRate: 16.00,
        totalPay: 128.00
      }
    ]
  },
  {
    id: "EVENT005",
    name: "Hochzeitsmesse",
    date: "20.03.2025",
    location: "Hotel Residenz",
    totalEmployees: 6,
    totalHours: 48,
    totalCost: 768.00,
    status: "completed",
    employees: [
      {
        id: "EMP003",
        name: "Sarah Klein",
        role: "Manager",
        startTime: "08:00",
        endTime: "16:00",
        hoursWorked: 8,
        hourlyRate: 18.00,
        totalPay: 144.00
      },
      {
        id: "EMP007",
        name: "Julia Hoffmann",
        role: "Versorger",
        startTime: "09:00",
        endTime: "17:00",
        hoursWorked: 8,
        hourlyRate: 16.50,
        totalPay: 132.00
      }
    ]
  },
  {
    id: "EVENT006",
    name: "Firmenjubiläum",
    date: "10.06.2025",
    location: "Messehalle",
    totalEmployees: 18,
    totalHours: 144,
    totalCost: 2304.00,
    status: "ongoing",
    employees: [
      {
        id: "EMP008",
        name: "Peter Wagner",
        role: "Allrounder",
        startTime: "07:00",
        endTime: "15:00",
        hoursWorked: 8,
        hourlyRate: 16.00,
        totalPay: 128.00
      },
      {
        id: "EMP009",
        name: "Maria Becker",
        role: "Verkauf",
        startTime: "14:00",
        endTime: "22:00",
        hoursWorked: 8,
        hourlyRate: 15.50,
        totalPay: 124.00
      }
    ]
  }
]

// Mock employee data (keeping existing structure) - Updated with German names and locations
const mockEmployeeData: EmployeeWorkRecord[] = [
  {
    id: "1",
    employeeName: "Anna Schmidt",
    period: "Januar 2025",
    totalHours: 45,
    totalPayment: 697.50,
    hourlyRate: 15.50,
    events: [
      {
        id: "E1",
        eventName: "Neujahrsfeier",
        date: "2025-01-01",
        hoursWorked: 8,
        hourlyRate: 15.50,
        location: "Emslandarena",
        startTime: "18:00",
        endTime: "02:00"
      },
      {
        id: "E2", 
        eventName: "Wintermarkt",
        date: "2025-01-15",
        hoursWorked: 6,
        hourlyRate: 15.50,
        location: "Stadtplatz",
        startTime: "10:00",
        endTime: "16:00"
      }
    ]
  },
  {
    id: "2",
    employeeName: "Thomas Müller", 
    period: "Januar 2025",
    totalHours: 38,
    totalPayment: 608.00,
    hourlyRate: 16.00,
    events: [
      {
        id: "E3",
        eventName: "Firmenevent",
        date: "2025-01-10",
        hoursWorked: 10,
        hourlyRate: 16.00,
        location: "Emslandhalle",
        startTime: "08:00",
        endTime: "18:00"
      }
    ]
  },
  {
    id: "3",
    employeeName: "Sarah Klein",
    period: "Januar 2025", 
    totalHours: 52,
    totalPayment: 936.00,
    hourlyRate: 18.00,
    events: [
      {
        id: "E4",
        eventName: "Konzert",
        date: "2025-01-20",
        hoursWorked: 12,
        hourlyRate: 18.00,
        location: "Arena",
        startTime: "16:00",
        endTime: "04:00"
      }
    ]
  },
  {
    id: "4",
    employeeName: "Michael Weber",
    period: "Januar 2025", 
    totalHours: 41,
    totalPayment: 656.00,
    hourlyRate: 16.00,
    events: [
      {
        id: "E5",
        eventName: "Messe",
        date: "2025-01-25",
        hoursWorked: 9,
        hourlyRate: 16.00,
        location: "Messehalle",
        startTime: "07:00",
        endTime: "16:00"
      }
    ]
  },
  {
    id: "5",
    employeeName: "Lisa Wagner",
    period: "Januar 2025", 
    totalHours: 35,
    totalPayment: 525.00,
    hourlyRate: 15.00,
    events: [
      {
        id: "E6",
        eventName: "Hochzeit",
        date: "2025-01-30",
        hoursWorked: 8,
        hourlyRate: 15.00,
        location: "Hotel Residenz",
        startTime: "14:00",
        endTime: "22:00"
      }
    ]
  }
]

export function EmployeeOverview({ viewMode = "mitarbeiter", setViewMode, selectedEmployeeId }: EmployeeOverviewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("July 2023")
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" })
  const [isCustomRange, setIsCustomRange] = useState(false)
  const [sortBy, setSortBy] = useState("name")
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWorkRecord | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [availableEmployees, setAvailableEmployees] = useState<any[]>([])
  const [loadingAvailableEmployees, setLoadingAvailableEmployees] = useState(false)
  
  // Use global event context and employee hooks
  const { selectedEvent: contextSelectedEvent } = useEventContext()
  const { employees: allEmployees } = useEmployees()
  const { syncAllEmployeeRoles, getRoleStatistics } = useEmployeeRoleSync()
  const { toast } = useToast()

  // Fetch employees who are currently available for the selected event
  const fetchAvailableEmployees = async (eventId: string) => {
    if (!eventId) return
    
    setLoadingAvailableEmployees(true)
    try {
      const { data, error } = await supabase
        .from('employee_event_status')
        .select(`
          *,
          employees (
            id,
            name,
            phone_number,
            role,
            employment_type,
            total_hours_worked,
            last_worked_date
          )
        `)
        .eq('event_id', eventId)
        .eq('status', 'available') // Only get currently available employees

      if (error) throw error
      
      // Transform to match the expected format
      const transformedEmployees = data?.map(item => ({
        id: item.employees.id,
        name: item.employees.name,
        role: item.employees.role,
        phone_number: item.employees.phone_number,
        employment_type: item.employees.employment_type,
        total_hours_worked: item.employees.total_hours_worked || 0,
        last_worked_date: item.employees.last_worked_date,
        status: item.status,
        responded_at: item.responded_at
      })) || []
      
      setAvailableEmployees(transformedEmployees)
      console.log(`📋 EmployeeOverview: Loaded ${transformedEmployees.length} available employees for event ${eventId}`)
    } catch (error) {
      console.error('Error fetching available employees:', error)
      setAvailableEmployees([])
    } finally {
      setLoadingAvailableEmployees(false)
    }
  }

  // Fetch available employees when context event changes
  useEffect(() => {
    if (contextSelectedEvent?.id) {
      fetchAvailableEmployees(contextSelectedEvent.id)
    }
  }, [contextSelectedEvent?.id])

  // Set up real-time subscription for employee status changes
  useEffect(() => {
    if (!contextSelectedEvent?.id) return

    const subscription = supabase
      .channel('employee-overview-status-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'employee_event_status',
        filter: `event_id=eq.${contextSelectedEvent.id}`
      }, () => {
        console.log('📡 EmployeeOverview: Received employee status change, refreshing available employees...')
        fetchAvailableEmployees(contextSelectedEvent.id)
      })
      .subscribe()

    // Listen for custom employee status change events
    const handleEmployeeStatusChange = (event: CustomEvent) => {
      const { eventId } = event.detail
      if (eventId === contextSelectedEvent.id) {
        console.log('📡 EmployeeOverview: Received custom employee status change event, refreshing...')
        fetchAvailableEmployees(contextSelectedEvent.id)
      }
    }

    window.addEventListener('employeeStatusChanged', handleEmployeeStatusChange as EventListener)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('employeeStatusChanged', handleEmployeeStatusChange as EventListener)
    }
  }, [contextSelectedEvent?.id])

  // Set selected employee when selectedEmployeeId changes (for Mitarbeiter view)
  useEffect(() => {
    if (selectedEmployeeId && viewMode === "mitarbeiter") {
      const employee = mockEmployeeData.find(emp => emp.id === selectedEmployeeId)
      if (employee) {
        setSelectedEmployee(employee)
      }
    }
  }, [selectedEmployeeId, viewMode])

  const handleExportToExcel = () => {
    console.log("Exporting to Excel...")
  }

  const handleExportEmployeeDetails = (employee: EmployeeWorkRecord) => {
    console.log("Exporting employee details to Excel:", employee.employeeName)
  }

  const handleExportEventDetails = (event: EventRecord) => {
    console.log("Exporting event details to Excel:", event.name)
  }

  const handleSyncRoles = async () => {
    setIsSyncing(true)
    try {
      const result = await syncAllEmployeeRoles()
      
      toast({
        title: "Rollen synchronisiert!",
        description: `${result.synced} Mitarbeiter erfolgreich synchronisiert.`,
      })
      
      if (result.errors.length > 0) {
        console.warn('Sync errors:', result.errors)
        toast({
          title: "Teilweise Fehler",
          description: `${result.errors.length} Fehler bei der Synchronisation.`,
          variant: "destructive"
        })
      }
      
    } catch (error) {
      console.error('Failed to sync roles:', error)
      toast({
        title: "Synchronisation fehlgeschlagen",
        description: "Rollen konnten nicht synchronisiert werden.",
        variant: "destructive"
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200"
      case "ongoing":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "upcoming":
        return "bg-orange-100 text-orange-700 border-orange-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Abgeschlossen"
      case "ongoing":
        return "Laufend"
      case "upcoming":
        return "Bevorstehend"
      default:
        return status
    }
  }

  // Event Detail View
  if (selectedEvent) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setSelectedEvent(null)}
              className="h-9 gap-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zu Events
            </Button>
          </div>
          <Button
            onClick={() => handleExportEventDetails(selectedEvent)}
            className="gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 font-medium shadow-sm transition-all duration-200 hover:from-green-600 hover:to-green-700"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export to Excel
          </Button>
        </div>

        {/* Event Details Header */}
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {/* Event Title as Plain Text */}
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div className="flex flex-col">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedEvent.name}
                  </h2>
                  <span className="text-sm text-gray-600">
                    {selectedEvent.date} • {selectedEvent.totalEmployees} Mitarbeiter
                  </span>
                </div>
              </div>
              
              {/* Location information */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{selectedEvent.location}</span>
              </div>
            </div>
            <Badge className={getStatusColor(selectedEvent.status)}>
              {getStatusLabel(selectedEvent.status)}
            </Badge>
          </div>

          {/* Event Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{selectedEvent.totalEmployees}</div>
              <div className="text-sm text-blue-700">Mitarbeiter</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{selectedEvent.totalHours}h</div>
              <div className="text-sm text-green-700">Gesamtstunden</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">€{selectedEvent.totalCost.toFixed(2)}</div>
              <div className="text-sm text-purple-700">Gesamtkosten</div>
            </div>
          </div>
        </div>

        {/* Employee Details Table */}
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Mitarbeiter Details</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100/80 hover:bg-transparent">
                  <TableHead className="h-12 px-6 font-semibold text-gray-900">Name</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Rolle</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Startzeit</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Endzeit</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Stunden</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Stundenlohn</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Gesamtzahlung</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedEvent.employees.map((employee, index) => (
                  <TableRow
                    key={employee.id}
                    className="group border-gray-100/80 transition-colors duration-200 hover:bg-gray-50/50"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell className="px-6 py-4">
                      <div className="font-medium text-gray-900">{employee.name}</div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                        {employee.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-500" />
                        <span className="font-medium text-gray-900">{employee.startTime}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-red-500" />
                        <span className="font-medium text-gray-900">{employee.endTime}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="font-medium text-gray-900">{employee.hoursWorked}h</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <Euro className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{employee.hourlyRate.toFixed(2)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="font-bold text-green-600">€{employee.totalPay.toFixed(2)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    )
  }

  // Events View
  if (viewMode === "events") {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Events Übersicht</h1>
              <p className="text-gray-600">Events analysieren und Details einsehen</p>
            </div>
            <Button
              onClick={handleExportToExcel}
              className="gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 font-medium shadow-sm transition-all duration-200 hover:from-green-600 hover:to-green-700"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export to Excel
            </Button>
          </div>
        </div>

        {/* Events Table */}
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Alle Events</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100/80 hover:bg-transparent">
                  <TableHead className="h-12 px-6 font-semibold text-gray-900">Event</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Ort</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Mitarbeiter</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Gesamtstunden</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Gesamtkosten</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockEventsData.map((event, index) => (
                  <TableRow
                    key={event.id}
                    className="group cursor-pointer border-gray-100/80 transition-colors duration-200 hover:bg-gray-50/50"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <TableCell className="px-6 py-4">
                      {/* Event Title as Plain Text */}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {event.name}
                          </span>
                          <span className="text-xs text-gray-600">
                            {event.date} • {event.totalEmployees} Mitarbeiter
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{event.location}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{event.totalEmployees}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{event.totalHours}h</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="font-bold text-green-600">€{event.totalCost.toFixed(2)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge className={getStatusColor(event.status)}>
                        {getStatusLabel(event.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    )
  }

  // Example employees for demonstration when no real data is available
  const exampleEmployees: EmployeeWorkRecord[] = [
    {
      id: "example-1",
      employeeName: "Anna Schmidt",
      period: "Januar 2025",
      totalHours: 45,
      totalPayment: 697.50,
      hourlyRate: 15.50,
      events: [
        {
          id: "E1",
          eventName: "Neujahrsfeier",
          date: "2025-01-01",
          hoursWorked: 8,
          hourlyRate: 15.50,
          location: "Emslandarena",
          startTime: "18:00",
          endTime: "02:00"
        },
        {
          id: "E2",
          eventName: "Wintermarkt",
          date: "2025-01-15",
          hoursWorked: 6,
          hourlyRate: 15.50,
          location: "Stadtplatz",
          startTime: "10:00",
          endTime: "16:00"
        }
      ]
    },
    {
      id: "example-2",
      employeeName: "Thomas Müller",
      period: "Januar 2025",
      totalHours: 38,
      totalPayment: 608.00,
      hourlyRate: 16.00,
      events: [
        {
          id: "E3",
          eventName: "Firmenevent",
          date: "2025-01-10",
          hoursWorked: 10,
          hourlyRate: 16.00,
          location: "Emslandhalle",
          startTime: "08:00",
          endTime: "18:00"
        }
      ]
    },
    {
      id: "example-3",
      employeeName: "Sarah Klein",
      period: "Januar 2025",
      totalHours: 52,
      totalPayment: 936.00,
      hourlyRate: 18.00,
      events: [
        {
          id: "E4",
          eventName: "Konzert",
          date: "2025-01-20",
          hoursWorked: 12,
          hourlyRate: 18.00,
          location: "Arena",
          startTime: "16:00",
          endTime: "04:00"
        }
      ]
    },
    {
      id: "example-4",
      employeeName: "Michael Weber",
      period: "Januar 2025",
      totalHours: 41,
      totalPayment: 656.00,
      hourlyRate: 16.00,
      events: [
        {
          id: "E5",
          eventName: "Messe",
          date: "2025-01-25",
          hoursWorked: 9,
          hourlyRate: 16.00,
          location: "Messehalle",
          startTime: "07:00",
          endTime: "16:00"
        }
      ]
    },
    {
      id: "example-5",
      employeeName: "Lisa Wagner",
      period: "Januar 2025",
      totalHours: 35,
      totalPayment: 525.00,
      hourlyRate: 15.00,
      events: [
        {
          id: "E6",
          eventName: "Hochzeit",
          date: "2025-01-30",
          hoursWorked: 8,
          hourlyRate: 15.00,
          location: "Hotel Residenz",
          startTime: "14:00",
          endTime: "22:00"
        }
      ]
    }
  ]

  // Mitarbeiter View - Use available employees from current event or show examples
  const filteredEmployees = availableEmployees.length > 0 
    ? availableEmployees.map(emp => ({
        id: emp.id,
        employeeName: emp.name,
        period: contextSelectedEvent?.date || "Current Event",
        totalHours: emp.total_hours_worked || 0,
        totalPayment: (emp.total_hours_worked || 0) * 15.50, // Default hourly rate
        hourlyRate: 15.50,
        events: [] // Could be populated with historical events if needed
      }))
    : exampleEmployees

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.employeeName.localeCompare(b.employeeName)
      case "hours":
        return b.totalHours - a.totalHours
      case "payment":
        return b.totalPayment - a.totalPayment
      default:
        return 0
    }
  })

  // Individual Employee Detail View (for Mitarbeiter view)
  if (selectedEmployee) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setSelectedEmployee(null)}
              className="h-9 gap-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zu allen Mitarbeitern
            </Button>
          </div>
          <Button
            onClick={() => handleExportEmployeeDetails(selectedEmployee)}
            className="gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 font-medium shadow-sm transition-all duration-200 hover:from-green-600 hover:to-green-700"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export to Excel
          </Button>
        </div>

        {/* Employee Summary */}
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedEmployee.employeeName}</h1>
              <p className="text-gray-600">{selectedEmployee.period}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">€{selectedEmployee.totalPayment.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Gesamtzahlung</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{selectedEmployee.totalHours}h</div>
              <div className="text-sm text-blue-700">Gesamtstunden</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">€{selectedEmployee.hourlyRate}</div>
              <div className="text-sm text-green-700">Stundenlohn</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{selectedEmployee.events.length}</div>
              <div className="text-sm text-purple-700">Events</div>
            </div>
          </div>
        </div>


        {/* Events Details Table */}
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Event Details</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100/80 hover:bg-transparent">
                  <TableHead className="h-12 px-6 font-semibold text-gray-900">Event</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Datum</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Ort</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Arbeitszeit</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Stunden</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Zahlung</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedEmployee.events.map((event, index) => (
                  <TableRow key={event.id} className="group border-gray-100/80 transition-colors duration-200 hover:bg-gray-50/50">
                    <TableCell className="px-6 py-4 font-medium text-gray-900">{event.eventName}</TableCell>
                    <TableCell className="py-4">{new Date(event.date).toLocaleDateString()}</TableCell>
                    <TableCell className="py-4 text-gray-600">{event.location}</TableCell>
                    <TableCell className="py-4">{event.startTime} - {event.endTime}</TableCell>
                    <TableCell className="py-4">{event.hoursWorked}h</TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="font-bold text-green-600">€{(event.hoursWorked * event.hourlyRate).toFixed(2)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    )
  }

  // Main Mitarbeiter Table View
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Mitarbeiter/Events</h1>
            <p className="text-gray-600">Arbeitszeiten analysieren und exportieren</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleSyncRoles}
              disabled={isSyncing}
              variant="outline"
              className="gap-2 rounded-xl border-gray-200"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Synchronisiere...' : 'Rollen synchronisieren'}
            </Button>
            
            <Button
              onClick={handleExportToExcel}
              className="gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 font-medium shadow-sm transition-all duration-200 hover:from-green-600 hover:to-green-700"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export to Excel
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 rounded-xl border-gray-200 bg-white/50 font-medium transition-all duration-200 hover:bg-gray-50"
                >
                  <CalendarDays className="h-4 w-4" />
                  {isCustomRange ? "Benutzerdefiniert" : selectedPeriod}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem onClick={() => { setSelectedPeriod("July 2023"); setIsCustomRange(false); }}>
                  July 2023
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSelectedPeriod("June 2023"); setIsCustomRange(false); }}>
                  June 2023
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSelectedPeriod("May 2023"); setIsCustomRange(false); }}>
                  May 2023
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Verfügbare Mitarbeiter</h2>
          <p className="text-sm text-gray-600 mt-1">
            {loadingAvailableEmployees ? 'Lade...' : 
             contextSelectedEvent ? 
               `${filteredEmployees.length} verfügbare Mitarbeiter für ${contextSelectedEvent.name}` :
               'Kein Event ausgewählt'
            }
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100/80 hover:bg-transparent">
                <TableHead className="h-12 px-6 font-semibold text-gray-900">Zeitraum</TableHead>
                <TableHead className="h-12 font-semibold text-gray-900">Mitarbeitername</TableHead>
                <TableHead className="h-12 font-semibold text-gray-900">Gesamte Arbeitsstunden</TableHead>
                <TableHead className="h-12 font-semibold text-gray-900">Gesamtzahlung</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingAvailableEmployees ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <div className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      Lade verfügbare Mitarbeiter...
                    </div>
                  </TableCell>
                </TableRow>
              ) : !contextSelectedEvent ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center">
                    <div className="text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>Kein Event ausgewählt</p>
                      <p className="text-sm">Wählen Sie ein Event aus, um verfügbare Mitarbeiter zu sehen</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedEmployees.map((employee, index) => (
                  <TableRow
                    key={employee.id}
                    className="group cursor-pointer border-gray-100/80 transition-colors duration-200 hover:bg-gray-50/50"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    <TableCell className="px-6 py-4 font-medium text-gray-900">{employee.period}</TableCell>
                    <TableCell className="py-4">
                      <div className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
                        {employee.employeeName}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{employee.totalHours}h</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="font-bold text-green-600">€{employee.totalPayment.toFixed(2)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}



