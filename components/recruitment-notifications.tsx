"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, Clock, Users, MessageCircle, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { clientLifecycleService } from "@/lib/client-lifecycle"


interface RecruitmentNotification {
  id: string
  eventId: string
  eventTitle: string
  type: 'low_response_rate' | 'recruitment_complete' | 'event_starting' | 'additional_recruitment'
  message: string
  severity: 'info' | 'warning' | 'success' | 'error'
  timestamp: Date
  actionRequired?: boolean
  actionLabel?: string
  actionHandler?: () => void
}

export function RecruitmentNotifications() {
  const [notifications, setNotifications] = useState<RecruitmentNotification[]>([])
  const [loading, setLoading] = useState(false)

  // Check for events that need attention
  const checkEventsNeedingAttention = async () => {
    setLoading(true)
    try {
      // Get all recruiting events
      const { data: recruitingEvents, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'recruiting')

      if (error) throw error

      const newNotifications: RecruitmentNotification[] = []

      for (const event of recruitingEvents || []) {
        // Check recruitment status
        const { data: recruitmentStatus, error: statusError } = await supabase
          .rpc('check_recruitment_status', { p_event_id: event.id })

        if (statusError) continue

        if (recruitmentStatus && recruitmentStatus.length > 0) {
          const status = recruitmentStatus[0]
          
          // Check if we need more recruitment
          if (status.needs_more_recruitment && status.suggested_additional_asks > 0) {
            newNotifications.push({
              id: `low_response_${event.id}`,
              eventId: event.id,
              eventTitle: event.title,
              type: 'low_response_rate',
              message: `Niedrige Antwortrate für "${event.title}". ${status.suggested_additional_asks} weitere Mitarbeiter werden benötigt.`,
              severity: 'warning',
              timestamp: new Date(),
              actionRequired: true,
              actionLabel: 'Zusätzliche Rekrutierung starten',
              actionHandler: () => triggerAdditionalRecruitment(event.id)
            })
          }

          // Check if recruitment is complete
          if (status.employees_available >= status.employees_needed) {
            newNotifications.push({
              id: `complete_${event.id}`,
              eventId: event.id,
              eventTitle: event.title,
              type: 'recruitment_complete',
              message: `Rekrutierung für "${event.title}" abgeschlossen! ${status.employees_available}/${status.employees_needed} Mitarbeiter verfügbar.`,
              severity: 'success',
              timestamp: new Date(),
              actionRequired: false
            })
          }
        }
      }

      // Check for events starting soon
      const now = new Date()
      const { data: upcomingEvents, error: upcomingError } = await supabase
        .from('events')
        .select('*')
        .in('status', ['recruiting', 'planned'])
        .gte('event_date', now.toISOString().split('T')[0])

      if (!upcomingError && upcomingEvents) {
        for (const event of upcomingEvents) {
          const eventDateTime = new Date(`${event.event_date}T${event.start_time}`)
          const timeUntilStart = eventDateTime.getTime() - now.getTime()
          
          // If event starts within 2 hours
          if (timeUntilStart <= 2 * 60 * 60 * 1000 && timeUntilStart > 0) {
            newNotifications.push({
              id: `starting_${event.id}`,
              eventId: event.id,
              eventTitle: event.title,
              type: 'event_starting',
              message: `"${event.title}" beginnt in ${Math.ceil(timeUntilStart / (60 * 60 * 1000))} Stunden.`,
              severity: 'info',
              timestamp: new Date(),
              actionRequired: false
            })
          }
        }
      }

      setNotifications(newNotifications)
    } catch (error) {
      console.error('Error checking events needing attention:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerAdditionalRecruitment = async (eventId: string) => {
    try {
      await clientLifecycleService.triggerAdditionalRecruitment(eventId)
      
      // Remove the notification after action
      setNotifications(prev => prev.filter(n => n.id !== `low_response_${eventId}`))
      
      // Add success notification
      setNotifications(prev => [...prev, {
        id: `additional_sent_${eventId}`,
        eventId,
        eventTitle: 'Event',
        type: 'additional_recruitment',
        message: 'Zusätzliche WhatsApp-Einladungen wurden gesendet.',
        severity: 'success',
        timestamp: new Date(),
        actionRequired: false
      }])
    } catch (error) {
      console.error('Error triggering additional recruitment:', error)
    }
  }

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const getSeverityConfig = (severity: RecruitmentNotification['severity']) => {
    switch (severity) {
      case 'success':
        return {
          color: 'bg-green-100 text-green-700 border-green-200',
          icon: CheckCircle,
          bgColor: 'bg-green-50 border-green-200'
        }
      case 'warning':
        return {
          color: 'bg-orange-100 text-orange-700 border-orange-200',
          icon: AlertTriangle,
          bgColor: 'bg-orange-50 border-orange-200'
        }
      case 'error':
        return {
          color: 'bg-red-100 text-red-700 border-red-200',
          icon: AlertTriangle,
          bgColor: 'bg-red-50 border-red-200'
        }
      default:
        return {
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          icon: Clock,
          bgColor: 'bg-blue-50 border-blue-200'
        }
    }
  }

  useEffect(() => {
    // Check for notifications on mount
    void checkEventsNeedingAttention()

    // Set up interval to check every 5 minutes
    const interval = setInterval(() => {
      void checkEventsNeedingAttention()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  if (notifications.length === 0) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            Rekrutierungsstatus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Alle Veranstaltungen sind auf dem neuesten Stand</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void checkEventsNeedingAttention()}
              disabled={loading}
              className="mt-2"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Rekrutierungsbenachrichtigungen
            <Badge variant="secondary" className="ml-2">
              {notifications.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void checkEventsNeedingAttention()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.map((notification) => {
          const config = getSeverityConfig(notification.severity)
          const Icon = config.icon

          return (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border ${config.bgColor} transition-all duration-200`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`h-5 w-5 mt-0.5 ${config.color.replace('bg-', 'text-').replace(' border-', '')}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={config.color}>
                      {notification.type === 'low_response_rate' && 'Niedrige Antwortrate'}
                      {notification.type === 'recruitment_complete' && 'Rekrutierung abgeschlossen'}
                      {notification.type === 'event_starting' && 'Event beginnt bald'}
                      {notification.type === 'additional_recruitment' && 'Zusätzliche Rekrutierung'}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {notification.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                  <div className="flex items-center gap-2">
                    {notification.actionRequired && notification.actionHandler && (
                      <Button
                        size="sm"
                        onClick={notification.actionHandler}
                        className="h-7 text-xs"
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        {notification.actionLabel}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissNotification(notification.id)}
                      className="h-7 text-xs text-gray-500 hover:text-gray-700"
                    >
                      Schließen
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
} 