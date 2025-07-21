"use client"

import { WorkAreaAssignment } from "./work-area-assignment"

interface WorkPlannerProps {
  workAreaView?: string
  setWorkAreaView?: (view: string) => void
  onNavigateToDashboard?: () => void
  onAddNewEvent?: (eventData: any) => void
  // Add props for employee filtering
  availableEmployees?: any[]
  onEmployeeStatusChange?: (employeeId: string, newStatus: string) => void
}

export function WorkPlanner({ 
  workAreaView = "event", 
  setWorkAreaView, 
  onNavigateToDashboard, 
  onAddNewEvent, 
  availableEmployees = [],
  onEmployeeStatusChange 
}: WorkPlannerProps) {
  return (
    <div>
      <WorkAreaAssignment 
        onBack={() => {}} // No back button needed since this is a dedicated page
        activeView={workAreaView}
        setActiveView={setWorkAreaView}
        onNavigateToDashboard={onNavigateToDashboard}
        onAddNewEvent={onAddNewEvent}
        availableEmployees={availableEmployees}
        onEmployeeStatusChange={onEmployeeStatusChange}
      />
    </div>
  )
}