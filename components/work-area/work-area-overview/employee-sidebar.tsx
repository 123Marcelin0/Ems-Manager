import { Badge } from "@/components/ui/badge"
import type { Employee } from "@/hooks/use-work-area-assignment"
import { roleConfig } from "./constants"
import type { RoleType } from "./constants"

interface EmployeeSidebarProps {
  showEmployeeList: boolean
  unassignedEmployees: Employee[]
  draggedEmployee: Employee | null
  onDragStart: (e: React.DragEvent, employee: Employee) => void
  onDragEnd: () => void
}

export function EmployeeSidebar({
  showEmployeeList,
  unassignedEmployees,
  draggedEmployee,
  onDragStart,
  onDragEnd
}: EmployeeSidebarProps) {
  return (
    <div 
      className={`fixed left-0 top-0 h-full w-80 bg-white/95 backdrop-blur-sm shadow-xl border-r border-gray-200 z-40 transform transition-transform duration-500 ease-in-out ${
        showEmployeeList ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-6 h-full overflow-y-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">Mitarbeiter Zuweisen</h2>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                {unassignedEmployees.length}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600">Einfach automatisch zuteilen oder in Arbeitsbereiche ziehen!</p>
        </div>
        
        <div className="space-y-3">
          {unassignedEmployees.map((employee, index) => (
            <div 
              key={employee.id}
              draggable
              onDragStart={(e) => onDragStart(e, employee)}
              onDragEnd={onDragEnd}
              className={`p-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 transform cursor-grab active:cursor-grabbing ${
                showEmployeeList ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
              } ${draggedEmployee?.id === employee.id ? 'opacity-50 scale-95' : ''}`}
              style={{ 
                transitionDelay: showEmployeeList ? `${index * 50}ms` : '0ms'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-gray-900">{employee.name}</div>
                    <Badge className={`text-xs ${roleConfig[employee.role as RoleType]?.color || 'bg-gray-100 text-gray-700'}`}>
                      {roleConfig[employee.role as RoleType]?.label || employee.role}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {unassignedEmployees.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Alle Mitarbeiter zugewiesen</h3>
            <p className="text-gray-600">Alle verfügbaren Mitarbeiter wurden den Arbeitsbereichen zugewiesen</p>
          </div>
        )}
      </div>
    </div>
  )
} 