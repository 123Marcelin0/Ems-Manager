"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, ChevronDown, Lock } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Employee {
  id: string
  name: string
  userId: string
  lastSelection: string
  status: string
  notes: string
}

interface EmployeeTableProps {
  employees: Employee[]
  onStatusChange: (employeeId: string, newStatus: string) => void
  authorizationMode: boolean
  selectedForAuth: string[]
  setSelectedForAuth: (selected: string[]) => void
  authorizedUsers: string[]
}

const statusConfig = {
  available: { label: "Verfügbar", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  selected: { label: "Ausgewählt", color: "bg-blue-100 text-blue-700 border-blue-200" },
  unavailable: { label: "Nicht Verfügbar", color: "bg-red-100 text-red-700 border-red-200" },
  "always-needed": { label: "Immer Gebraucht", color: "bg-amber-100 text-amber-700 border-amber-200" },
  "not-selected": { label: "Nicht Ausgewählt", color: "bg-gray-100 text-gray-700 border-gray-200" },
}

export function EmployeeTable({ 
  employees, 
  onStatusChange, 
  authorizationMode, 
  selectedForAuth, 
  setSelectedForAuth, 
  authorizedUsers 
}: EmployeeTableProps) {
  
  const handleAuthCheckboxChange = (employeeId: string, checked?: boolean) => {
    const isCurrentlySelected = selectedForAuth.includes(employeeId)
    const shouldCheck = checked !== undefined ? checked : !isCurrentlySelected
    
    if (shouldCheck) {
      setSelectedForAuth([...selectedForAuth, employeeId])
    } else {
      setSelectedForAuth(selectedForAuth.filter(id => id !== employeeId))
    }
  }

  const handleRowClick = (employeeId: string, event: React.MouseEvent) => {
    // Don't trigger row click if clicking on interactive elements
    const target = event.target as HTMLElement
    if (target.closest('button') || target.closest('[role="button"]') || target.closest('input')) {
      return
    }
    
    if (authorizationMode) {
      handleAuthCheckboxChange(employeeId)
    }
  }
  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-xl">👥</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Mitarbeiter gefunden</h3>
          <p className="text-gray-500">Keine Mitarbeiter entsprechen den aktuellen Filterkriterien.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-100/80 hover:bg-transparent">
            {authorizationMode && (
              <TableHead className="h-12 px-4 font-semibold text-gray-900 w-12"></TableHead>
            )}
            <TableHead className="h-12 px-6 font-semibold text-gray-900">Mitarbeiter</TableHead>
            <TableHead className="h-12 font-semibold text-gray-900">Benutzer ID</TableHead>
            <TableHead className="h-12 font-semibold text-gray-900">Letzte Auswahl</TableHead>
            <TableHead className="h-12 font-semibold text-gray-900">Status</TableHead>
            <TableHead className="h-12 font-semibold text-gray-900">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee, index) => {
            const isAuthorized = authorizedUsers.includes(employee.id)
            const isSelected = selectedForAuth.includes(employee.id)
            
            return (
              <TableRow
                key={employee.id}
                onClick={(e) => handleRowClick(employee.id, e)}
                className={`group border-gray-100/80 transition-colors duration-200 ${
                  authorizationMode ? "cursor-pointer" : ""
                } ${
                  isAuthorized 
                    ? "bg-yellow-50/80 hover:bg-yellow-100/60" 
                    : "hover:bg-gray-50/50"
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {authorizationMode && (
                  <TableCell className="px-4 py-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleAuthCheckboxChange(employee.id, checked as boolean)}
                      className="rounded-md data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                    />
                  </TableCell>
                )}
                <TableCell className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{employee.name}</span>
                      {isAuthorized && (
                        <Lock className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>

                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <code className="rounded-md bg-gray-100 px-2 py-1 text-sm font-mono text-gray-700">
                    {employee.userId}
                  </code>
                </TableCell>
                <TableCell className="py-4 text-gray-600">{employee.lastSelection}</TableCell>
                <TableCell className="py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 rounded-lg p-2 transition-all duration-200 hover:bg-gray-100"
                        aria-label={`Change status for ${employee.name}`}
                      >
                        <Badge
                          className={`border font-medium ${statusConfig[employee.status as keyof typeof statusConfig]?.color}`}
                        >
                          {statusConfig[employee.status as keyof typeof statusConfig]?.label || employee.status}
                        </Badge>
                        <ChevronDown className="h-3 w-3 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-40">
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <DropdownMenuItem
                          key={key}
                          onClick={() => {
                            console.log('🔄 Status change clicked:', { employeeId: employee.id, newStatus: key, employeeName: employee.name });
                            onStatusChange(employee.id, key);
                          }}
                          className="cursor-pointer"
                        >
                          {config.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell className="py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-lg p-0 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-gray-100"
                        aria-label={`Actions for ${employee.name}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2 cursor-pointer">
                        <Edit className="h-4 w-4" />
                        Mitarbeiter bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-red-600 cursor-pointer focus:text-red-600">
                        <Trash2 className="h-4 w-4" />
                        Mitarbeiter löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
