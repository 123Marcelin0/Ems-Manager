import React from "react"

interface EventFormProps {
  event?: any
  onSave: (data: any) => void
  onCancel: () => void
}

export function EventForm({ event, onSave, onCancel }: EventFormProps) {
  return (
    <div>
      <p>EventForm stub</p>
      <button onClick={() => onSave(event)}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
} 