"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { ChevronDown, ArrowLeft, Clock, DollarSign, Calendar, FileSpreadsheet, CalendarDays, Users, BarChart3, MapPin, Euro } from "lucide-react"

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
  }
]

// Mock employee data (keeping existing structure)
const mockEmployeeData: EmployeeWorkRecord[] = [
  {
    id: "1",
    employeeName: "Alice Johnson",
    period: "July 2023",
    totalHours: 32,
    totalPayment: 640,
    hourlyRate: 20,
    events: [
      {
        id: "E1",
        eventName: "Summer Festival",
        date: "2023-07-15",
        hoursWorked: 8,
        hourlyRate: 20,
        location: "Downtown Park",
        startTime: "09:00",
        endTime: "17:00"
      },
      {
        id: "E2", 
        eventName: "Corporate Gala",
        date: "2023-07-22",
        hoursWorked: 6,
        hourlyRate: 20,
        location: "Grand Hotel",
        startTime: "18:00",
        endTime: "24:00"
      }
    ]
  },
  {
    id: "2",
    employeeName: "Bob Smith", 
    period: "July 2023",
    totalHours: 28,
    totalPayment: 560,
    hourlyRate: 20,
    events: [
      {
        id: "E3",
        eventName: "Product Launch",
        date: "2023-07-10",
        hoursWorked: 10,
        hourlyRate: 20,
        location: "Convention Center",
        startTime: "08:00",
        endTime: "18:00"
      }
    ]
  },
  {
    id: "3",
    employeeName: "Charlie Brown",
    period: "July 2023", 
    totalHours: 40,
    totalPayment: 800,
    hourlyRate: 20,
    events: [
      {
        id: "E4",
        eventName: "Music Concert",
        date: "2023-07-28",
        hoursWorked: 12,
        hourlyRate: 20,
        location: "Arena Stadium",
        startTime: "16:00",
        endTime: "04:00"
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

  // Mitarbeiter View (existing functionality)
  const filteredEmployees = mockEmployeeData.filter((employee) => {
    const matchesPeriod = isCustomRange ? true : employee.period === selectedPeriod
    return matchesPeriod
  })

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
          <h2 className="text-lg font-semibold text-gray-900">Mitarbeiter Arbeitsübersicht</h2>
          <p className="text-sm text-gray-600 mt-1">{filteredEmployees.length} Mitarbeiter für {isCustomRange ? "Benutzerdefiniert" : selectedPeriod}</p>
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
              {sortedEmployees.map((employee, index) => (
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
                      <span className="font-medium text-gray-900">{employee.totalHours}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className="font-bold text-green-600">€{employee.totalPayment.toFixed(2)}</span>
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



