
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigation } from 'react-day-picker'
import type { CalendarProps } from './calendar'
import type { CalendarMonth } from 'react-day-picker'

export function CalendarCaption(props: CalendarProps & { calendarMonth: CalendarMonth }) {
  const { goToMonth, nextMonth, previousMonth } = useNavigation();
  const displayMonth = props.calendarMonth.date;

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
        {new Intl.DateTimeFormat('default', { 
          month: 'long', 
          year: 'numeric' 
        }).format(displayMonth)}
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
