"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Clock, Users, RefreshCw, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Event {
  id: string
  name: string
  employeesNeeded: number
  employeesToAsk: number
}

interface EmployeeStatus {
  id: string
  name: string
  phone_number: string
  status: 'not_asked' | 'asked' | 'available' | 'unavailable' | 'selected' | 'working' | 'completed'
  asked_at: string | null
  responded_at: string | null
  response_method: string | null
}

interface RecruitmentStatusProps {
  selectedEvent: Event | null
}

export function EmployeeRecruitmentStatus({ selectedEvent }: RecruitmentStatusProps) {
  const [employeeStatuses, setEmployeeStatuses] = useState<EmployeeStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [recruitmentSummary, setRecruitmentSummary] = useState({
    total: 0,
    notAsked: 0,
    asked: 0,
    available: 0,
    unavailable: 0,
    selected: 0
  })

  const fetchEmployeeStatuses = async () => {
    if (!selectedEvent) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('employee_event_status')
        .select(`
          *,
          employees (
            id,
            name,
            phone_number
          )
        `)
        .eq('event_id', selectedEvent.id)

      if (error) throw error

      const statuses = data?.map(item => ({
        id: item.employees.id,
        name: item.employees.name,
        phone_number: item.employees.phone_number,
        status: item.status,
        asked_at: item.asked_at,
        responded_at: item.responded_at,
        response_method: item.response_method
      })) || []

      setEmployeeStatuses(statuses)

      // Calculate summary
      const summary = {
        total: statuses.length,
        notAsked: statuses.filter(s => s.status === 'not_asked').length,
        asked: statuses.filter(s => s.status === 'asked').length,
        available: statuses.filter(s => s.status === 'available').length,
        unavailable: statuses.filter(s => s.status === 'unavailable').length,
        selected: statuses.filter(s => s.status === 'selected').length
      }
      setRecruitmentSummary(summary)

    } catch (error) {
      console.error('Error fetching employee statuses:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployeeStatuses()
  }, [selectedEvent])

  // Set up real-time subscription for status changes
  useEffect(() => {
    if (!selectedEvent) return

    const subscription = supabase
      .channel('employee-status-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'employee_event_status',
        filter: `event_id=eq.${selectedEvent.id}`
      }, () => {
        fetchEmployeeStatuses()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [selectedEvent])

  if (!selectedEvent) {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="text-center py-8">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-gray-400" />
          </div>
          <CardTitle className="text-lg text-gray-600">Keine Veranstaltung ausgewählt</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  const isCompleted = recruitmentSummary.available >= selectedEvent.employeesNeeded

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Status und Fortschritt</h2>
            <p className="text-sm text-gray-600">{selectedEvent.name}</p>
          </div>
        </div>
        <Button
          onClick={fetchEmployeeStatuses}
          disabled={loading}
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
          <div className="text-3xl font-bold text-green-600 mb-1">{recruitmentSummary.available}</div>
          <div className="text-sm font-medium text-green-700">Verfügbar</div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
          <div className="text-3xl font-bold text-red-600 mb-1">{recruitmentSummary.unavailable}</div>
          <div className="text-sm font-medium text-red-700">Nicht verfügbar</div>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium text-gray-900">Rekrutierung</span>
          <span className="text-sm text-gray-600">
            {recruitmentSummary.available} / {selectedEvent.employeesNeeded} benötigt
          </span>
        </div>
        
        {isCompleted ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Vollständig besetzt!</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-600">
            <Clock className="h-5 w-5" />
            <span className="font-medium">
              {selectedEvent.employeesNeeded - recruitmentSummary.available} weitere Mitarbeiter benötigt
            </span>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>Insgesamt gefragt: {recruitmentSummary.asked}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>Ausgewählt: {recruitmentSummary.selected}</span>
        </div>
      </div>
    </div>
  )
}