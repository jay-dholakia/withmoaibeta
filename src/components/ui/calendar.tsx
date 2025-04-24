
// src/components/ui/calendar.tsx
import * as React from "react"
import { DayPicker, DayPickerSingleProps } from 'react-day-picker'
import { CalendarCaption } from './calendar-caption'

// Define a type that includes only the properties we need
export interface CalendarProps {
  selected?: Date | undefined
  onSelect: (date: Date | undefined) => void
  mode?: "single" // Only supporting single mode for simplicity
  className?: string
  disabled?: (date: Date) => boolean
  initialFocus?: boolean
}

export function Calendar({
  selected,
  onSelect,
  mode = "single",
  className,
  disabled,
  initialFocus,
}: CalendarProps) {
  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={onSelect}
      captionLayout="dropdown"
      components={{
        // Remove custom Caption component for now to get things working
      }}
      className={className}
      disabled={disabled}
      initialFocus={initialFocus}
    />
  )
}
