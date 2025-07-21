"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, CheckCircle, Settings, MoreHorizontal, Users, UserX, BarChart3, Calendar, MapPin, Euro, FileSpreadsheet, Download } from "lucide-react"
import { WorkAreaAssignment } from "./work-area-assignment"
import { useWorkAreas } from "@/hooks/use-work-areas"
import { useEmployees } from "@/hooks/use-employees"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SignOutRecord {
  id: string
  employeeName: string
  userId: string
  signOutTime: string
  signInTime?: string
  status: "signed-in" | "signed-out"
  location: string
  hourlyRate: number
}

interface SignOutTableProps {
  statusFilter?: string
  searchTerm?: string
  showWorkAreaAssignment?: boolean
  setShowWorkAreaAssignment?: (show: boolean) => void
  workAreaView?: string
  setWorkAreaView?: (view: string) => void
  selectedEvent?: {
    name: string
    date: string
    location?: string
    employeesNeeded?: number
    employeesToAsk?: number
    id?: string
    time?: string
    hourlyRate?: number
  } | null
  // Add props for work area employee distribution
  availableEmployees?: any[]
  onEmployeeStatusChange?: (employeeId: string, newStatus: string) => void
}

const mockSignOutData: SignOutRecord[] = [
  {
    id: "SO001",
    employeeName: "Anna Schmidt",
    userId: "a.schmidt",
    signOutTime: "2024-01-16 14:30",
    signInTime: "2024-01-16 16:45",
    status: "signed-in",
    location: "Warehouse A",
    hourlyRate: 15.50,
  },
  {
    id: "SO002",
    employeeName: "Tom Fischer",
    userId: "t.fischer",
    signOutTime: "2024-01-16 15:15",
    status: "signed-out",
    location: "Production Floor B",
    hourlyRate: 14.75,
  },
  {
    id: "SO003",
    employeeName: "Sarah Klein",
    userId: "s.klein",
    signOutTime: "2024-01-16 13:00",
    status: "signed-out",
    location: "Office Building",
    hourlyRate: 16.25,
  },
]

const statusConfig = {
  "signed-in": {
    label: "Angemeldet",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle,
  },
  "signed-out": {
    label: "Abgemeldet",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Clock,
  },
}



export function SignOutTable({ 
  statusFilter = "event", 
  searchTerm = "", 
  showWorkAreaAssignment = false, 
  setShowWorkAreaAssignment, 
  workAreaView, 
  setWorkAreaView, 
  selectedEvent,
  availableEmployees = [],
  onEmployeeStatusChange
}: SignOutTableProps) {
  // Hooks to get real data
  const { workAreas: dbWorkAreas, fetchWorkAreasByEvent } = useWorkAreas()
  const { employees: dbEmployees } = useEmployees()

  const [signOutRecords, setSignOutRecords] = useState<SignOutRecord[]>(mockSignOutData)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [editingHourlyRate, setEditingHourlyRate] = useState<string | null>(null)

  // Fetch work areas when selected event changes
  useEffect(() => {
    if (selectedEvent?.id) {
      fetchWorkAreasByEvent(selectedEvent.id)
    }
  }, [selectedEvent?.id, fetchWorkAreasByEvent])

  // Automatically sort records - signed-in first, then signed-out
  const filteredRecords = signOutRecords
    .filter((record) => {
      const matchesSearch =
        searchTerm === "" ||
        record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.location.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
    .sort((a, b) => {
      // Sort by status: signed-in (angemeldet) first, then signed-out (abgemeldet)
      if (a.status === "signed-in" && b.status === "signed-out") return -1
      if (a.status === "signed-out" && b.status === "signed-in") return 1
      // If same status, sort by name
      return a.employeeName.localeCompare(b.employeeName)
    })

  const handleSignInConfirm = () => {
    if (selectedRecordId) {
      setSignOutRecords((prev) =>
        prev.map((record) =>
          record.id === selectedRecordId
            ? {
              ...record,
              status: "signed-in" as const,
              signInTime: new Date().toISOString().slice(0, 16).replace("T", " "),
            }
            : record,
        ),
      )
      setConfirmDialogOpen(false)
      setSelectedRecordId(null)
    }
  }

  const handleSignOutToggle = (recordId: string, currentStatus: "signed-in" | "signed-out") => {
    if (currentStatus === "signed-in") {
      // Sign out directly
      setSignOutRecords((prev) =>
        prev.map((record) =>
          record.id === recordId
            ? {
              ...record,
              status: "signed-out" as const,
              signInTime: undefined,
            }
            : record,
        ),
      )
    } else {
      // For sign in, show confirmation dialog
      setSelectedRecordId(recordId)
      setConfirmDialogOpen(true)
    }
  }

  const handleHourlyRateChange = (recordId: string, value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      setSignOutRecords((prev) =>
        prev.map((record) =>
          record.id === recordId
            ? {
              ...record,
              hourlyRate: numValue,
            }
            : record,
        ),
      )
    }
    setEditingHourlyRate(null)
  }

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const calculateDuration = (signOut: string, signIn?: string) => {
    const signOutTime = new Date(signOut)
    const signInTime = signIn ? new Date(signIn) : new Date()
    const diffMs = signInTime.getTime() - signOutTime.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`
    }
    return `${diffMinutes}m`
  }

  const stats = {
    total: signOutRecords.length,
    signedIn: signOutRecords.filter((r) => r.status === "signed-in").length,
    signedOut: signOutRecords.filter((r) => r.status === "signed-out").length,
  }

  // Transform real work areas data for download functionality
  const getWorkAreasForDownload = () => {
    if (dbWorkAreas.length === 0) {
      // Fallback to mock data if no real data available
      return [
        {
          id: "WA001",
          name: "Verkaufsbereich",
          employees: ["Anna Schmidt", "Tom Fischer", "Sarah Klein"]
        },
        {
          id: "WA002", 
          name: "Gastronomie", 
          employees: ["Mike Johnson", "Lisa Weber", "Peter Mueller"]
        },
        {
          id: "WA003",
          name: "Sicherheit",
          employees: ["David Brown", "Emma Wilson"]
        },
        {
          id: "WA004",
          name: "Technik",
          employees: ["Alex Turner", "Sofia Rodriguez", "James Davis"]
        }
      ]
    }

    // Transform real work areas - using employee names from available employees
    return dbWorkAreas
      .filter(area => area.is_active)
      .map(area => {
        // Get employee names assigned to this work area
        const assignedEmployeeNames = availableEmployees
          .filter(emp => emp.workAreaId === area.id) // Assuming employee has workAreaId
          .map(emp => emp.name)
          .slice(0, 4) // Limit to 4 employees for display

        // If no specific assignments, use sample employees from the available employees list
        let employeeNames = assignedEmployeeNames
        if (employeeNames.length === 0 && availableEmployees.length > 0) {
          // Take a sample of available employees for this work area
          employeeNames = availableEmployees
            .slice(0, Math.min(4, availableEmployees.length))
            .map(emp => emp.name)
        }

        return {
          id: area.id,
          name: area.name,
          employees: employeeNames.length > 0 ? employeeNames : ["Keine Zuweisungen"]
        }
      })
  }

  const handleDownloadWorkAreaSheets = () => {
    // Create HTML content for PDF generation with auto-download
    // Using string concatenation to avoid Next.js static analysis issues
    const htmlStart = '<!DOCTYPE ' + 'html>' + '\n<' + 'html>';
    const htmlHead = `
        <head>
          <meta charset="utf-8">
          <title>Arbeitsbereich Aufteilung - ${selectedEvent?.name || 'Event'}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 40px;
              background: white;
              color: #333;
            }
            .event-title {
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #1f2937;
            }
            .event-date {
              text-align: center;
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 40px;
            }
            .work-area {
              margin-bottom: 50px;
              page-break-inside: avoid;
            }
            .work-area-title {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 20px;
              color: #1f2937;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 8px;
            }
            .employee-list {
              margin-left: 20px;
            }
            .employee-name {
              font-size: 16px;
              margin-bottom: 12px;
              color: #374151;
              line-height: 1.4;
            }
            @media print {
              body { padding: 20px; }
              .work-area { page-break-inside: avoid; }
            }
          </style>
          <script>
            window.onload = function() {
              // Automatically open print dialog
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </head>`;
    
    const htmlBody = `
        <body>
          <div class="event-title">${selectedEvent?.name || 'Event'}</div>
          <div class="event-date">${selectedEvent?.date || new Date().toLocaleDateString('de-DE')}</div>
          
          ${getWorkAreasForDownload().map((workArea: any) => `
            <div class="work-area">
              <div class="work-area-title">${workArea.name}</div>
              <div class="employee-list">
                ${workArea.employees.map((employee: string) => `
                  <div class="employee-name">${employee}</div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </body>`;
    
    const htmlEnd = '</' + 'html>';
    
    const htmlContent = htmlStart + htmlHead + htmlBody + htmlEnd;

    // Create blob and download HTML file that will auto-print
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedEvent?.name || 'Event'}_Arbeitsbereich_aufteilung_${new Date().toLocaleDateString('de-DE').replace(/\./g, '-')}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  if (showWorkAreaAssignment) {
    return <WorkAreaAssignment 
      onBack={() => setShowWorkAreaAssignment?.(false)} 
      activeView={workAreaView}
      setActiveView={setWorkAreaView}
      availableEmployees={availableEmployees} // Pass available employees from Mitteilungen
      onEmployeeStatusChange={onEmployeeStatusChange} // Pass status change handler
    />
  }

  // Render Event view
  if (statusFilter === "event") {
    // Calculate attendance metrics
    const employeesNeeded = selectedEvent?.employeesNeeded || 15;
    const employeesPresent = stats.signedIn;
    const attendancePercentage = Math.round((employeesPresent / employeesNeeded) * 100);

    // Transform real work area data for Event view display
    const getWorkAreasForEventView = () => {
      if (dbWorkAreas.length === 0) {
        // Fallback to mock data if no real data available
        return [
          {
            id: "WA001",
            name: "Main Entrance",
            location: "Emslandarena",
            needed: 4,
            present: 3,
            employees: ["Anna Schmidt", "Max Müller", "Lisa Weber", "Tom Fischer"]
          },
          {
            id: "WA002",
            name: "Food Court",
            location: "Emslandhalle",
            needed: 6,
            present: 4,
            employees: ["Sarah Klein", "Julia Hoffmann", "Michael Berg", "Anna Becker", "David Wolf", "Maria Hansen"]
          },
          {
            id: "WA003",
            name: "Mobile Counter",
            location: "Outdoor Area", 
            needed: 3,
            present: 2,
            employees: ["Lisa Schmidt", "Paul Weber", "Nina Fischer"]
          }
        ]
      }

      // Transform real work areas
      return dbWorkAreas
        .filter(area => area.is_active)
        .map(area => {
          // Calculate employees needed based on role requirements
          const needed = Object.values(area.role_requirements).reduce((sum: number, count) => sum + (count as number), 0)
          
          // Get employee names - use available employees or database employees
          const employeesToUse = availableEmployees.length > 0 ? availableEmployees : dbEmployees
          let assignedEmployeeNames = employeesToUse
            .filter(emp => emp.workAreaId === area.id) // Assuming employee has workAreaId
            .map(emp => emp.name)

          // If no specific assignments, use sample employees
          if (assignedEmployeeNames.length === 0) {
            // Take a sample based on the area's capacity
            const sampleSize = Math.min(needed, employeesToUse.length)
            assignedEmployeeNames = employeesToUse
              .slice(0, sampleSize)
              .map(emp => emp.name)
          }

          return {
            id: area.id,
            name: area.name,
            location: area.location,
            needed: needed,
            present: assignedEmployeeNames.length,
            employees: assignedEmployeeNames.length > 0 ? assignedEmployeeNames : ["Keine Zuweisungen"]
          }
        })
    }

    const workAreas = getWorkAreasForEventView();

    return (
      <div className="space-y-8">
        {/* Header - Event Information */}
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {selectedEvent?.name || "Event Übersicht"}
              </h1>
              <p className="mt-1 text-gray-600">
                {selectedEvent?.date || "Event-Informationen und Status"}
              </p>
            </div>
            <Button
              onClick={() => handleDownloadWorkAreaSheets()}
              className="gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 font-medium shadow-sm transition-all duration-200 hover:from-green-600 hover:to-green-700"
            >
              <Download className="h-4 w-4" />
              Arbeitsbereich aufteilung
            </Button>
          </div>
        </div>

        {/* Event Details with Attendance */}
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h2>
          {selectedEvent ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Datum: {selectedEvent.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Ort: {selectedEvent.location || 'Nicht angegeben'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Benötigt: {selectedEvent.employeesNeeded || 'Nicht angegeben'} Mitarbeiter</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Zeit: {selectedEvent.time || 'Nicht angegeben'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Stundenlohn: €{selectedEvent.hourlyRate || '15.50'}</span>
                  </div>
                </div>
              </div>

              {/* Subtle Attendance Progress */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Mitarbeiter Anwesenheit</span>
                  <span className="text-gray-900 font-medium">{employeesPresent} / {employeesNeeded}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(attendancePercentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Kein Event ausgewählt</p>
          )}
        </div>

        {/* Work Area Distribution - Separate Container */}
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Arbeitsbereich-Verteilung</h2>
          
          <div className="space-y-4">
            {workAreas.map((area) => {
              return (
                <div key={area.id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                  {/* Area Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{area.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">• {area.location}</span>
                  </div>

                  {/* Employee Grid - No Status Colors */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {area.employees.map((employee, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-white border border-gray-200 text-gray-700"
                      >
                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                        <span className="font-medium truncate">{employee}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )
  }

  // Render Arbeit view (original table)
  return (
    <div className="space-y-8">
      {/* Header - Event Information */}
      <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedEvent?.name || "Anwesenheitsliste"}
            </h1>
            <p className="mt-1 text-gray-600">
              {selectedEvent?.date || "Mitarbeiterabmeldungen und -rückkehr verfolgen"}
            </p>
          </div>
          <Button
            onClick={() => handleDownloadWorkAreaSheets()}
            className="gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 font-medium shadow-sm transition-all duration-200 hover:from-green-600 hover:to-green-700"
          >
            <Download className="h-4 w-4" />
            Arbeitsbereich aufteilung
          </Button>
        </div>
      </div>



      {/* Sign-out Records Table */}
      <div className="overflow-hidden bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)]">

        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Clock className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">Keine Datensätze gefunden</h3>
              <p className="text-gray-500">Keine Abmeldungsdatensätze entsprechen Ihren aktuellen Filtern.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100/80 hover:bg-transparent">
                  <TableHead className="h-12 px-6 font-semibold text-gray-900">Mitarbeiter</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Abmeldezeit</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Dauer</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Stundensatz (€)</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Status</TableHead>
                  <TableHead className="h-12 font-semibold text-gray-900">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record, index) => {
                  const StatusIcon = statusConfig[record.status].icon
                  return (
                    <TableRow
                      key={record.id}
                      className="group border-gray-100/80 transition-colors duration-200 hover:bg-gray-50/50"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">{record.employeeName}</div>
                          <div className="text-sm text-gray-500">
                            {record.location}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">{formatDateTime(record.signOutTime)}</div>
                          {record.signInTime && (
                            <div className="text-sm text-gray-500">Zurückgekehrt: {formatDateTime(record.signInTime)}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="font-medium text-gray-700">
                          {calculateDuration(record.signOutTime, record.signInTime)}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        {editingHourlyRate === record.id ? (
                          <Input
                            type="number"
                            step="0.25"
                            min="0"
                            defaultValue={record.hourlyRate.toString()}
                            className="w-20 h-8"
                            onBlur={(e) => handleHourlyRateChange(record.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleHourlyRateChange(record.id, e.currentTarget.value)
                              }
                              if (e.key === 'Escape') {
                                setEditingHourlyRate(null)
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <div
                            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                            onClick={() => setEditingHourlyRate(record.id)}
                          >
                            €{record.hourlyRate.toFixed(2)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge className={`border font-medium ${statusConfig[record.status].color} gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[record.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <Button
                          size="sm"
                          onClick={() => handleSignOutToggle(record.id, record.status)}
                          className={`h-8 rounded-lg px-3 text-xs font-medium transition-all duration-200 ${record.status === "signed-out"
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200"
                            : "bg-red-500 text-white hover:bg-red-600"
                            }`}
                        >
                          {record.status === "signed-out" ? "Anmelden" : "Abmelden"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>


      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold text-gray-900">Anmeldebestätigung</DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Sind Sie sicher, dass Sie diesen Mitarbeiter wieder anmelden möchten?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmDialogOpen(false)
                setSelectedRecordId(null)
              }}
              className="rounded-xl border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              Abbrechen
            </Button>
            <Button 
              type="button" 
              onClick={handleSignInConfirm}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-sm transition-all duration-200 hover:shadow-md"
            >
              Ja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
