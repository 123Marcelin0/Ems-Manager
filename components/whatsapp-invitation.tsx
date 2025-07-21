"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { MessageCircle, Send, Clock, CheckCircle, XCircle, Users } from "lucide-react"
import { useWhatsApp } from "@/hooks/use-whatsapp"
import { useEmployees } from "@/hooks/use-employees"

interface Employee {
  id: string
  name: string
  phone_number: string
  role: string
  is_always_needed: boolean
  last_worked_date: string | null
}

interface Event {
  id: string
  name: string
  date: string
  employeesNeeded: number
  employeesToAsk: number
}

interface WhatsAppInvitationProps {
  selectedEvent: Event | null
  onClose?: () => void
}

export function WhatsAppInvitation({ selectedEvent, onClose }: WhatsAppInvitationProps) {
  const { employees, getEmployeesForSelection } = useEmployees()
  const { sending, sendEventInvitations } = useWhatsApp()
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [invitationResults, setInvitationResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)

  if (!selectedEvent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            WhatsApp Einladungen
          </CardTitle>
          <CardDescription>
            Wählen Sie zuerst eine Veranstaltung aus
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([])
    } else {
      setSelectedEmployees(employees.map(emp => emp.id))
    }
  }

  const handleFairSelection = async () => {
    try {
      const fairEmployees = await getEmployeesForSelection(selectedEvent.id, 0)
      const employeeIds = fairEmployees.map((emp: any) => emp.employee_id)
      setSelectedEmployees(employeeIds)
    } catch (error) {
      console.error('Error getting fair selection:', error)
    }
  }

  const handleSendInvitations = async () => {
    if (selectedEmployees.length === 0) return

    try {
      const results = await sendEventInvitations({
        eventId: selectedEvent.id,
        employeeIds: selectedEmployees
      })
      
      setInvitationResults(results)
      setShowResults(true)
      setSelectedEmployees([])
    } catch (error) {
      console.error('Error sending invitations:', error)
    }
  }

  const selectedEmployeeData = employees.filter(emp => selectedEmployees.includes(emp.id))
  const successCount = invitationResults.filter(r => r.success).length
  const failureCount = invitationResults.filter(r => !r.success).length

  if (showResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Einladungen Gesendet
          </CardTitle>
          <CardDescription>
            Ergebnisse für {selectedEvent.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{successCount}</div>
              <div className="text-sm text-green-700">Erfolgreich gesendet</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{failureCount}</div>
              <div className="text-sm text-red-700">Fehlgeschlagen</div>
            </div>
          </div>

          <div className="space-y-2">
            {invitationResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{result.employeeName}</span>
                {result.success ? (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Gesendet
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700">
                    <XCircle className="h-3 w-3 mr-1" />
                    Fehler
                  </Badge>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setShowResults(false)} variant="outline" className="flex-1">
              Weitere Einladungen senden
            </Button>
            {onClose && (
              <Button onClick={onClose} className="flex-1">
                Schließen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          WhatsApp Einladungen
        </CardTitle>
        <CardDescription>
          Senden Sie Einladungen für {selectedEvent.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selection Controls */}
        <div className="flex gap-2">
          <Button 
            onClick={handleSelectAll} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            {selectedEmployees.length === employees.length ? 'Alle abwählen' : 'Alle auswählen'}
          </Button>
          <Button 
            onClick={handleFairSelection} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Faire Auswahl ({selectedEvent.employeesToAsk})
          </Button>
        </div>

        {/* Employee List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
            >
              <Checkbox
                checked={selectedEmployees.includes(employee.id)}
                onCheckedChange={() => handleEmployeeToggle(employee.id)}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{employee.name}</span>
                  {employee.is_always_needed && (
                    <Badge className="bg-amber-100 text-amber-700">
                      Immer gebraucht
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {employee.role} • {employee.phone_number}
                </div>
                {employee.last_worked_date && (
                  <div className="text-xs text-gray-400">
                    Zuletzt gearbeitet: {new Date(employee.last_worked_date).toLocaleDateString('de-DE')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Summary */}
        {selectedEmployees.length > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-blue-900">
                  {selectedEmployees.length} Mitarbeiter ausgewählt
                </div>
                <div className="text-sm text-blue-700">
                  {selectedEmployeeData.map(emp => emp.name).join(', ')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send Button */}
        <Button
          onClick={handleSendInvitations}
          disabled={selectedEmployees.length === 0 || sending}
          className="w-full flex items-center gap-2"
        >
          {sending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Sende Einladungen...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Einladungen senden ({selectedEmployees.length})
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}