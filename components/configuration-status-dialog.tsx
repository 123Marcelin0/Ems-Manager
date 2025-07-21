"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, Calendar, Users, Settings, MapPin } from "lucide-react"

interface ConfigurationItem {
  id: string
  title: string
  description: string
  status: "completed" | "pending" | "warning"
  icon: React.ReactNode
}

interface ConfigurationStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedEvent?: any
  workAreas?: any[]
  onNavigateToStep?: (step: string) => void
}

export function ConfigurationStatusDialog({
  open,
  onOpenChange,
  selectedEvent,
  workAreas = [],
  onNavigateToStep
}: ConfigurationStatusDialogProps) {
  const [animationPhase, setAnimationPhase] = useState<"enter" | "show" | "exit">("enter")

  useEffect(() => {
    if (open) {
      setAnimationPhase("enter")
      const timer = setTimeout(() => setAnimationPhase("show"), 100)
      return () => clearTimeout(timer)
    } else {
      setAnimationPhase("exit")
    }
  }, [open])

  // Generate configuration items based on current state
  const getConfigurationItems = (): ConfigurationItem[] => {
    const items: ConfigurationItem[] = []

    // Event Selection
    items.push({
      id: "event",
      title: "Event ausgewählt",
      description: selectedEvent ? `${selectedEvent.name} - ${selectedEvent.date}` : "Kein Event ausgewählt",
      status: selectedEvent ? "completed" : "pending",
      icon: <Calendar className="h-4 w-4" />
    })

    // Work Areas Configuration
    const workAreasConfigured = workAreas.length > 0
    items.push({
      id: "workAreas",
      title: "Arbeitsbereiche konfiguriert",
      description: workAreasConfigured 
        ? `${workAreas.length} Arbeitsbereiche eingerichtet`
        : "Arbeitsbereiche müssen konfiguriert werden",
      status: workAreasConfigured ? "completed" : "pending",
      icon: <MapPin className="h-4 w-4" />
    })

    // Employee Assignment
    if (workAreasConfigured && selectedEvent) {
      const totalRequired = workAreas.reduce((total, area) => total + area.maxCapacity, 0)
      const totalAssigned = workAreas.reduce((total, area) => total + area.currentAssigned, 0)
      const assignmentComplete = totalAssigned >= totalRequired

      items.push({
        id: "assignment",
        title: "Mitarbeiter zugewiesen",
        description: `${totalAssigned} von ${totalRequired} Mitarbeitern zugewiesen`,
        status: assignmentComplete ? "completed" : totalAssigned > 0 ? "warning" : "pending",
        icon: <Users className="h-4 w-4" />
      })
    }

    // Employee Inquiries
    if (selectedEvent) {
      const employeesAsked = selectedEvent.employeesAsked || 0
      const employeesToAsk = selectedEvent.employeesToAsk || selectedEvent.employeesNeeded || 0
      const inquiriesComplete = employeesAsked >= employeesToAsk

      items.push({
        id: "inquiries",
        title: "Mitarbeiter angefragt",
        description: inquiriesComplete 
          ? `Alle ${employeesToAsk} Mitarbeiter wurden angefragt`
          : `${employeesAsked} von ${employeesToAsk} Mitarbeitern angefragt`,
        status: inquiriesComplete ? "completed" : employeesAsked > 0 ? "warning" : "pending",
        icon: <Settings className="h-4 w-4" />
      })
    }

    return items
  }

  const configItems = getConfigurationItems()
  const pendingItems = configItems.filter(item => item.status === "pending")
  const warningItems = configItems.filter(item => item.status === "warning")
  const completedItems = configItems.filter(item => item.status === "completed")
  const allConfigured = pendingItems.length === 0 && warningItems.length === 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200"
      case "warning":
        return "bg-amber-100 text-amber-700 border-amber-200"
      case "pending":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />
      case "pending":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  const handleNavigateToStep = (stepId: string) => {
    onNavigateToStep?.(stepId)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className={`transition-all duration-300 ease-out ${
          animationPhase === "enter" ? "opacity-0 scale-95 translate-y-2" : 
          animationPhase === "show" ? "opacity-100 scale-100 translate-y-0" :
          "opacity-0 scale-95 translate-y-2"
        }`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {allConfigured ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Konfiguration vollständig</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span>Konfigurationsstatus</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {allConfigured ? (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Alles konfiguriert!
                </h3>
                <p className="text-gray-600">
                  Ihr Event ist vollständig eingerichtet und bereit.
                </p>
              </div>
            ) : (
              <>
                <div className="text-sm text-gray-600 mb-4">
                  Überprüfen Sie den Status Ihrer Event-Konfiguration:
                </div>

                <div className="space-y-3">
                  {configItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 hover:shadow-sm ${
                        animationPhase === "show" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                      }`}
                      style={{ transitionDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {getStatusIcon(item.status)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {item.icon}
                            <span className="font-medium text-gray-900">
                              {item.title}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                        {item.status === "completed" ? "Erledigt" :
                         item.status === "warning" ? "Teilweise" : "Ausstehend"}
                      </Badge>
                    </div>
                  ))}
                </div>

                {(pendingItems.length > 0 || warningItems.length > 0) && (
                  <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-amber-800">
                          Nächste Schritte
                        </h4>
                        <p className="text-sm text-amber-700 mt-1">
                          {pendingItems.length > 0 
                            ? `${pendingItems.length} Konfiguration${pendingItems.length > 1 ? 'en' : ''} ausstehend`
                            : `${warningItems.length} Konfiguration${warningItems.length > 1 ? 'en' : ''} unvollständig`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl"
              >
                Schließen
              </Button>
              {!allConfigured && onNavigateToStep && (
                <Button
                  onClick={() => {
                    const nextStep = pendingItems[0]?.id || warningItems[0]?.id
                    if (nextStep) {
                      const stepMap: Record<string, string> = {
                        event: "event",
                        workAreas: "arbeitsbereiche",
                        assignment: "ubersicht",
                        inquiries: "mitteilungen"
                      }
                      handleNavigateToStep(stepMap[nextStep] || "event")
                    }
                  }}
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  Fortfahren
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 