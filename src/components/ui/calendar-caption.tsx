
// src/components/ui/calendar-caption.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CaptionProps, useNavigation } from 'react-day-picker'

export function CalendarCaption(props: CaptionProps) {
  const { goToMonth, nextMonth, previousMonth } = useNavigation();
  // Use calendarMonth instead of displayMonth
  const { calendarMonth } = props;

  const handlePrev = () => {
    if (previousMonth) {
      goToMonth(previousMonth);
    }
  }

  const handleNext = () => {
    if (nextMonth) {
      goToMonth(nextMonth);
    }
  }

  return (
    <div className="flex items-center justify-between px-3 py-2">
      <button 
        onClick={handlePrev}
        disabled={!previousMonth}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-medium">
        {calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
      </span>
      <button 
        onClick={handleNext}
        disabled={!nextMonth}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
