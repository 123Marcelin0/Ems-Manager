"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FileText, Bell, Calendar, Plus, MapPin, Star, Save } from "lucide-react"
import { TimeScheduler } from "./time-scheduler"

interface ActionButtonsProps {
  onEventScheduled?: (eventData: any) => void
}

export function ActionButtons({ onEventScheduled }: ActionButtonsProps) {
  const [isScheduleOpen, setIsScheduleOpen] = React.useState(false)
  const [selectedDateTime, setSelectedDateTime] = React.useState<Date>()
  const [formData, setFormData] = React.useState({
    title: "",
    location: "",
    description: "",
    specialties: "",
  })

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDateTime) return

    const eventData = {
      ...formData,
      date: selectedDateTime.toISOString().split('T')[0],
      time: selectedDateTime.toTimeString().slice(0, 5),
    }

    onEventScheduled?.(eventData)

    // Reset form
    setFormData({
      title: "",
      location: "",
      description: "",
      specialties: "",
    })
    setSelectedDateTime(undefined)
    setIsScheduleOpen(false)
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex gap-3">
      <Button
        variant="outline"
        size="sm"
        className="h-9 gap-2 rounded-lg border-gray-200 bg-white/50 font-medium transition-all duration-200 hover:bg-gray-50 hover:border-gray-300"
        aria-label="Generate employee report"
      >
        <FileText className="h-4 w-4" />
        Report
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-9 gap-2 rounded-lg border-gray-200 bg-white/50 font-medium transition-all duration-200 hover:bg-gray-50 hover:border-gray-300"
        aria-label="Send notification to employees"
      >
        <Bell className="h-4 w-4" />
        Notify
      </Button>

      {/* Quick Schedule Dropdown */}
      <Popover open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            className="h-9 gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 font-medium shadow-sm transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-md"
            aria-label="Schedule new event"
          >
            <Calendar className="h-4 w-4" />
            Schedule
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <div className="bg-white rounded-xl shadow-lg border p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Quick Schedule Event</h3>
              <p className="text-sm text-gray-600">Create a new event quickly</p>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              {/* Event Title */}
              <div className="space-y-2">
                <Label htmlFor="quick-title" className="text-sm font-medium text-gray-700">
                  Event Title
                </Label>
                <Input
                  id="quick-title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Enter event title"
                  className="h-10 rounded-lg border-gray-200"
                  required
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="quick-location" className="text-sm font-medium text-gray-700">
                  Location
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="quick-location"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    placeholder="Enter location"
                    className="h-10 rounded-lg border-gray-200 pl-10"
                    required
                  />
                </div>
              </div>

              {/* Date and Time */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Date & Time
                </Label>
                <TimeScheduler
                  value={selectedDateTime}
                  onChange={setSelectedDateTime}
                  placeholder="Select date and time"
                  className="h-10 rounded-lg"
                  showEndTime={false}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="quick-description" className="text-sm font-medium text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="quick-description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Brief event description..."
                  rows={2}
                  className="rounded-lg border-gray-200"
                  required
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  className="flex-1 gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 font-medium"
                  disabled={!selectedDateTime || !formData.title || !formData.location}
                >
                  <Save className="h-4 w-4" />
                  Schedule Event
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsScheduleOpen(false)}
                  className="rounded-lg"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        size="sm"
        className="h-9 gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 font-medium shadow-sm transition-all duration-200 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-md"
        aria-label="Add new employee"
      >
        <Plus className="h-4 w-4" />
        Add Employee
      </Button>
    </div>
  )
}
