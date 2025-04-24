// src/components/ui/calendar-caption.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CaptionProps } from 'react-day-picker'

export function CalendarCaption({
  displayMonth,
  goToMonth,
}: CaptionProps): JSX.Element {
  const handlePrev = () => {
    const prev = new Date(displayMonth)
    prev.setMonth(prev.getMonth() - 1)
    goToMonth(prev)
  }

  const handleNext = () => {
    const next = new Date(displayMonth)
    next.setMonth(next.getMonth() + 1)
    goToMonth(next)
  }

  return (
    <div className="flex items-center justify-between px-3 py-2">
      <button onClick={handlePrev}>
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-medium">
        {displayMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
      </span>
      <button onClick={handleNext}>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

