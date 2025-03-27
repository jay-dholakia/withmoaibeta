
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Armchair, 
  Umbrella 
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  isSameDay 
} from 'date-fns';
import { WorkoutHistoryItem } from '@/types/workout';

interface MonthlyCalendarViewProps {
  workouts: WorkoutHistoryItem[];
}

export const MonthlyCalendarView = ({ workouts }: MonthlyCalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const goToPreviousMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };

  // Process workouts by date
  const completedWorkouts = workouts
    .filter(workout => workout.completed_at && !workout.life_happens_pass && !workout.rest_day)
    .map(workout => new Date(workout.completed_at));
  
  const lifeHappensWorkouts = workouts
    .filter(workout => workout.completed_at && workout.life_happens_pass)
    .map(workout => new Date(workout.completed_at));
  
  const restDays = workouts
    .filter(workout => workout.completed_at && workout.rest_day)
    .map(workout => new Date(workout.completed_at));

  // Custom day content renderer
  const renderDayContent = (props: { date: Date; disabled?: boolean }) => {
    if (!props.date) return null;

    const isCompleted = completedWorkouts.some(date => isSameDay(date, props.date));
    const isLifeHappens = lifeHappensWorkouts.some(date => isSameDay(date, props.date));
    const isRestDay = restDays.some(date => isSameDay(date, props.date));

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-sm">{props.date.getDate()}</div>
        {isCompleted && (
          <Star className="absolute top-0 right-0 h-3 w-3 text-green-500 fill-green-500" />
        )}
        {isLifeHappens && (
          <Umbrella className="absolute bottom-0 left-0 h-3 w-3 text-blue-500" />
        )}
        {isRestDay && (
          <Armchair className="absolute bottom-0 right-0 h-3 w-3 text-amber-500" />
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl p-2 shadow-sm mb-8 overflow-hidden max-w-full">
      <div className="flex justify-between items-center mb-2">
        <Button 
          variant="outline" 
          onClick={goToPreviousMonth}
          className="h-8 w-8 p-0"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h3 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        
        <Button 
          variant="outline" 
          onClick={goToNextMonth}
          className="h-8 w-8 p-0"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="w-full flex justify-center">
        <Calendar 
          mode="single"
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          selected={undefined}
          onSelect={() => {}}
          disabled={{ after: new Date() }}
          className="pointer-events-auto w-full px-0 scale-[0.97] transform-origin-top"
          hideHead={false}
          components={{
            DayContent: ({ date, ...props }) => renderDayContent({ date, ...props }),
            Caption: () => null // This completely hides the built-in caption/navigation
          }}
          showOutsideDays={true}
        />
      </div>
      
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center space-x-1">
          <Star className="h-4 w-4 text-green-500 fill-green-500" />
          <span className="text-xs text-gray-600">Workout</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Umbrella className="h-4 w-4 text-blue-500" />
          <span className="text-xs text-gray-600">Life Happens</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Armchair className="h-4 w-4 text-amber-500" />
          <span className="text-xs text-gray-600">Rest Day</span>
        </div>
      </div>
    </div>
  );
};
