// src/components/ui/calendar.tsx
import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import { CalendarCaption } from './calendar-caption'

export interface CalendarProps {
  selected?: Date | undefined
  onSelect: (date: Date | undefined) => void
  mode?: 'single'
  className?: string
  disabled?: (date: Date) => boolean
  initialFocus?: boolean
}

export function Calendar({
  selected,
  onSelect,
  mode = 'single',
  className,
  disabled,
  initialFocus,
}: CalendarProps) {
  return (
    <DayPicker
      mode={mode}
      selected={selected}
      onSelect={onSelect}
      captionLayout="buttons"
      components={{ Caption: CalendarCaption }}
      className={`pointer-events-auto ${className || ''}`}
      disabled={disabled}
      initialFocus={initialFocus}
    />
  )
}

