"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Users, MapPin, MoreHorizontal, Edit, Trash2, UserPlus } from "lucide-react"
import type { WorkArea, Employee } from "@/hooks/use-work-area-assignment"

const roleConfig = {
  allrounder: { label: "Allrounder", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  versorger: { label: "Versorger", color: "bg-blue-100 text-blue-700 border-blue-200" },
  verkauf: { label: "Verkauf", color: "bg-amber-100 text-amber-700 border-amber-200" },
  manager: { label: "Manager", color: "bg-red-100 text-red-700 border-red-200" },
  essen: { label: "Essen", color: "bg-gray-100 text-gray-700 border-gray-200" },
}

interface WorkAreaCardProps {
  area: WorkArea
  availableEmployees: Employee[]
  onAssignEmployee: (workAreaId: string, employee: Employee) => void
  onRemoveEmployee: (workAreaId: string, employeeId: string) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: (e: React.DragEvent, areaId: string) => void
  onDrop?: (e: React.DragEvent) => void
  isDragOver?: boolean
  draggedEmployee?: Employee | null
  onDragStart?: (e: React.DragEvent, employee: Employee) => void
  onDragEnd?: () => void
}

export function WorkAreaCard({ 
  area, 
  availableEmployees, 
  onAssignEmployee, 
  onRemoveEmployee,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOver,
  draggedEmployee,
  onDragStart,
  onDragEnd
}: WorkAreaCardProps) {
  // Check if dragged employee can be assigned to this area
  const canAcceptDrop = draggedEmployee && area.requiredRoles.includes(draggedEmployee.role) && area.currentAssigned < area.maxCapacity

  return (
    <div 
      className={`overflow-hidden bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6 transition-all duration-200 ${
        isDragOver && canAcceptDrop 
          ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50/30 scale-[1.02]' 
          : isDragOver 
            ? 'ring-2 ring-red-500 ring-opacity-50 bg-red-50/30' 
            : ''
      }`}
      onDragOver={onDragOver}
      onDragLeave={(e) => onDragLeave?.(e, area.id)}
      onDrop={onDrop}
    >
      {/* Area Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{area.name}</h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            {area.location}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg p-0 hover:bg-gray-100">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <Edit className="h-4 w-4" />
              Edit Area
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-red-600 cursor-pointer">
              <Trash2 className="h-4 w-4" />
              Delete Area
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Capacity */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            Capacity: {area.currentAssigned}/{area.maxCapacity}
          </span>
        </div>
        <div className="flex gap-1">
          {area.requiredRoles.map((role) => (
            <Badge key={role} className={`text-xs ${roleConfig[role as keyof typeof roleConfig].color}`}>
              {roleConfig[role as keyof typeof roleConfig].label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              area.currentAssigned >= area.maxCapacity
                ? "bg-red-500"
                : area.currentAssigned > area.maxCapacity * 0.7
                  ? "bg-amber-500"
                  : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min((area.currentAssigned / area.maxCapacity) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Assigned Employees */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">Assigned Employees</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 rounded-lg border-gray-200 bg-white/50 text-xs"
                disabled={area.currentAssigned >= area.maxCapacity}
              >
                <UserPlus className="h-3 w-3" />
                Assign
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {availableEmployees
                .filter((emp) => area.requiredRoles.includes(emp.role))
                .map((employee) => (
                  <DropdownMenuItem
                    key={employee.id}
                    onClick={() => onAssignEmployee(area.id, employee)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-xs text-gray-500">{roleConfig[employee.role].label}</div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              {availableEmployees.filter((emp) => area.requiredRoles.includes(emp.role)).length === 0 && (
                <div className="px-2 py-1 text-sm text-gray-500">No available employees</div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Drop Zone Indicator */}
        {isDragOver && draggedEmployee && (
          <div className={`mb-3 p-4 border-2 border-dashed rounded-lg text-center ${
            canAcceptDrop 
              ? 'border-blue-400 bg-blue-50/50 text-blue-700' 
              : 'border-red-400 bg-red-50/50 text-red-700'
          }`}>
            {canAcceptDrop ? (
              <div className="text-sm font-medium">
                Drop {draggedEmployee.name} here to assign
              </div>
            ) : (
              <div className="text-sm font-medium">
                {area.currentAssigned >= area.maxCapacity 
                  ? 'Area is at full capacity' 
                  : `${draggedEmployee.name} doesn't have required role`}
              </div>
            )}
          </div>
        )}

        {area.assignedEmployees.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500">
            {isDragOver && canAcceptDrop ? 'Drop employee here to assign' : 'No employees assigned yet'}
          </div>
        ) : (
          <div className="space-y-2">
            {area.assignedEmployees.map((employee) => (
              <div 
                key={employee.id} 
                draggable
                onDragStart={(e) => onDragStart?.(e, employee)}
                onDragEnd={onDragEnd}
                className={`flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing ${
                  draggedEmployee?.id === employee.id ? 'opacity-50 scale-95' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-gray-900">{employee.name}</div>
                    <Badge className={`text-xs ${roleConfig[employee.role as keyof typeof roleConfig]?.color || 'bg-gray-100 text-gray-700'}`}>
                      {roleConfig[employee.role as keyof typeof roleConfig]?.label || employee.role}
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveEmployee(area.id, employee.id)}
                  className="h-8 w-8 rounded-lg p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}