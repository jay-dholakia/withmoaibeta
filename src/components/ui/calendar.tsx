// src/components/ui/calendar.tsx
import { DayPicker } from 'react-day-picker'
import { CalendarCaption } from './calendar-caption'

export function Calendar({
  selected,
  onSelect,
}: {
  selected: Date | undefined
  onSelect: (date: Date | undefined) => void
}) {
  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={onSelect}
      captionLayout="buttons"
      components={{ Caption: CalendarCaption }}
    />
  )
}
