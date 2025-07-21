"use client"

import * as React from "react"
import { Calendar, ChevronLeft, ChevronRight, Clock, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface TimeSchedulerProps {
  value?: Date
  onChange?: (date: Date) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  showEndTime?: boolean
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
}

const TimeScheduler = React.forwardRef<HTMLButtonElement, TimeSchedulerProps>(
  ({ value, onChange, placeholder = "Select date and time", className, disabled, showEndTime = true }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value)
    const [currentMonth, setCurrentMonth] = React.useState(
      value ? new Date(value.getFullYear(), value.getMonth()) : new Date()
    )
    const [startTime, setStartTime] = React.useState(
      value ? value.toTimeString().slice(0, 5) : "09:00"
    )
    const [endTime, setEndTime] = React.useState(
      value ? new Date(value.getTime() + 8 * 60 * 60 * 1000).toTimeString().slice(0, 5) : "17:00"
    )

    const monthNames = [
      "Januar", "Februar", "März", "April", "Mai", "Juni",
      "Juli", "August", "September", "Oktober", "November", "Dezember"
    ]

    const dayNames = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"]

    const getDaysInMonth = (date: Date): CalendarDay[] => {
      const year = date.getFullYear()
      const month = date.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const daysInMonth = lastDay.getDate()
      const startingDayOfWeek = firstDay.getDay()

      const days: CalendarDay[] = []
      
      // Add days from previous month only if needed (for the first week)
      if (startingDayOfWeek > 0) {
        const prevMonth = new Date(year, month - 1, 0)
        const prevMonthDays = prevMonth.getDate()
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
          const prevDate = new Date(year, month - 1, prevMonthDays - i)
          days.push({ date: prevDate, isCurrentMonth: false })
        }
      }
      
      // Add days of the current month
      for (let day = 1; day <= daysInMonth; day++) {
        days.push({ date: new Date(year, month, day), isCurrentMonth: true })
      }
      
      // Add days from next month only to complete the last week (max 6 days)
      const totalDaysAdded = days.length
      const remainingInLastWeek = totalDaysAdded % 7
      if (remainingInLastWeek > 0) {
        const daysToAdd = 7 - remainingInLastWeek
        for (let day = 1; day <= daysToAdd; day++) {
          const nextDate = new Date(year, month + 1, day)
          days.push({ date: nextDate, isCurrentMonth: false })
        }
      }
      
      return days
    }

    const navigateMonth = (direction: 'prev' | 'next') => {
      setCurrentMonth(prev => {
        const newMonth = new Date(prev)
        if (direction === 'prev') {
          newMonth.setMonth(prev.getMonth() - 1)
        } else {
          newMonth.setMonth(prev.getMonth() + 1)
        }
        return newMonth
      })
    }

    const handleDateSelect = (date: Date) => {
      setSelectedDate(date)
    }

    const handleConfirm = () => {
      if (selectedDate && onChange) {
        const [startHours, startMinutes] = startTime.split(':').map(Number)
        const finalDate = new Date(selectedDate)
        finalDate.setHours(startHours, startMinutes, 0, 0)
        onChange(finalDate)
      }
      setIsOpen(false)
    }

    const handleToday = () => {
      const today = new Date()
      setSelectedDate(today)
      setCurrentMonth(new Date(today.getFullYear(), today.getMonth()))
    }

    const formatDisplayDate = () => {
      if (!selectedDate) return placeholder
      return selectedDate.toLocaleDateString('de-DE', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) + ` um ${startTime}`
    }

    const days = getDaysInMonth(currentMonth)

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground",
              className
            )}
            disabled={disabled}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {formatDisplayDate()}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md p-0 bg-white rounded-2xl shadow-2xl border-0">
          <DialogTitle className="sr-only">Start auswählen</DialogTitle>
          <div className="p-6 w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Start auswählen</h3>
                  <p className="text-sm text-gray-500">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMonth('prev')}
                  className="h-8 w-8 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMonth('next')}
                  className="h-8 w-8 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                </Button>
              </div>
            </div>

            {/* Time Inputs */}
            <div className={cn("grid gap-4 mb-6", showEndTime ? "grid-cols-2" : "grid-cols-1")}>
              <div>
                <label className="text-sm text-gray-500 mb-2 block font-medium">Startzeit</label>
                <div className="relative">
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="pl-12 h-12 text-lg font-medium border-gray-200 rounded-xl"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                </div>
              </div>
              {showEndTime && (
                <div>
                  <label className="text-sm text-gray-500 mb-2 block font-medium">Endzeit</label>
                  <div className="relative">
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="pl-12 h-12 text-lg font-medium border-gray-200 rounded-xl"
                    />
                    <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              )}
            </div>

            {/* Selected Date Display */}
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-1 font-medium">Start</p>
              <p className="font-semibold text-gray-900 text-lg">
                {selectedDate ? selectedDate.toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                }) : 'Datum wählen'}
              </p>
            </div>

            {/* Calendar Grid */}
            <div className="mb-6">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-3">
                {dayNames.map((day) => (
                  <div key={day} className="text-center text-sm text-gray-500 font-medium py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((dayObj, index) => {
                  const { date: day, isCurrentMonth } = dayObj
                  
                  const isSelected = selectedDate && 
                    day.getDate() === selectedDate.getDate() &&
                    day.getMonth() === selectedDate.getMonth() &&
                    day.getFullYear() === selectedDate.getFullYear()
                  
                  const isToday = 
                    day.getDate() === new Date().getDate() &&
                    day.getMonth() === new Date().getMonth() &&
                    day.getFullYear() === new Date().getFullYear()

                  return (
                    <button
                      key={index}
                      onClick={() => isCurrentMonth && handleDateSelect(day)}
                      disabled={!isCurrentMonth}
                      className={cn(
                        "h-12 w-12 rounded-xl text-sm font-medium transition-all duration-200",
                        isCurrentMonth 
                          ? "hover:bg-blue-50 text-gray-900" 
                          : "text-gray-300 cursor-not-allowed",
                        isSelected && "bg-blue-500 text-white hover:bg-blue-600 shadow-lg",
                        isToday && !isSelected && isCurrentMonth && "bg-blue-50 font-bold text-blue-600 ring-2 ring-blue-200"
                      )}
                    >
                      {day.getDate()}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                onClick={handleToday}
                className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 font-medium rounded-xl px-4 py-2"
              >
                Heute
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 font-medium rounded-xl px-6 py-2"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={!selectedDate}
                >
                  Datum übernehmen
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
)

TimeScheduler.displayName = "TimeScheduler"

export { TimeScheduler }