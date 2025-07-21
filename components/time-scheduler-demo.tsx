"use client"

import * as React from "react"
import { TimeScheduler } from "./time-scheduler"

export function TimeSchedulerDemo() {
  const [selectedDateTime, setSelectedDateTime] = React.useState<Date>()

  return (
    <div className="p-6 max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-semibold">Time Scheduler Demo</h2>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Date & Time:</label>
        <TimeScheduler
          value={selectedDateTime}
          onChange={setSelectedDateTime}
          placeholder="Choose date and time"
        />
      </div>
      
      {selectedDateTime && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Selected:</p>
          <p className="font-medium">
            {selectedDateTime.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })} at {selectedDateTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      )}
    </div>
  )
}