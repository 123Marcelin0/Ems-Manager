"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Users, MessageSquare } from "lucide-react"

interface EmployeeAssignmentWarningProps {
  isOpen: boolean
  onClose: () => void
  onContinue: () => void
  onStartInquiry: () => void
  eventData: {
    name: string
    date: string
    employeesNeeded: number
    employeesAssigned: number
    employeesAsked: number
    employeesToAsk: number
  }
}

export function EmployeeAssignmentWarning({
  isOpen,
  onClose,
  onContinue,
  onStartInquiry,
  eventData
}: EmployeeAssignmentWarningProps) {
  const missingEmployees = eventData.employeesNeeded - eventData.employeesAssigned
  const hasAskedEmployees = eventData.employeesAsked > 0
  const progressPercentage = (eventData.employeesAssigned / eventData.employeesNeeded) * 100
  const allEmployeesAsked = eventData.employeesAsked >= eventData.employeesToAsk

  // Don't show dialog if all employees have been asked
  if (allEmployeesAsked) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-gray-900">
                Mitarbeiter fehlen
              </DialogTitle>
              <p className="text-xs text-gray-500">{eventData.name}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Essential Info Only */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Benötigt:</span>
              <span className="font-medium">{eventData.employeesNeeded}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Zugewiesen:</span>
              <span className="font-medium text-green-600">{eventData.employeesAssigned}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Fehlen:</span>
              <span className="font-medium text-red-600">{missingEmployees}</span>
            </div>
            
            <div className="mt-3">
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-xs text-gray-500 mt-1 text-center">{Math.round(progressPercentage)}% zugewiesen</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {hasAskedEmployees ? (
              <>
                <Button variant="outline" onClick={onClose} size="sm" className="flex-1">
                  Abbrechen
                </Button>
                <Button onClick={onContinue} size="sm" className="flex-1">
                  Fortfahren
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={onClose} size="sm" className="flex-1">
                  Abbrechen
                </Button>
                <Button onClick={onStartInquiry} size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Anfragen
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}