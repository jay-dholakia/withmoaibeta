
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

  // Custom calendar day renderer
  const renderDay = (day: Date | undefined) => {
    if (!day) return null;

    const isCompleted = completedWorkouts.some(date => isSameDay(date, day));
    const isLifeHappens = lifeHappensWorkouts.some(date => isSameDay(date, day));
    const isRestDay = restDays.some(date => isSameDay(date, day));

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        {isCompleted && (
          <Star className="absolute h-4 w-4 text-green-500 fill-green-500" />
        )}
        {isLifeHappens && (
          <Umbrella className="absolute h-4 w-4 text-blue-500" />
        )}
        {isRestDay && (
          <Armchair className="absolute h-4 w-4 text-amber-500" />
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm mb-8">
      <div className="flex justify-between items-center mb-4">
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
      
      <div className="mt-2">
        <Calendar 
          mode="single"
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          selected={undefined}
          onSelect={() => {}}
          disabled={{ after: new Date() }}
          className="pointer-events-auto"
          components={{
            DayContent: ({ day }) => renderDay(day),
          }}
        />
      </div>
      
      <div className="flex justify-center space-x-6 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 flex items-center justify-center">
            <Star className="h-4 w-4 text-green-500 fill-green-500" />
          </div>
          <span className="text-xs text-gray-600">Workout</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 flex items-center justify-center">
            <Umbrella className="h-4 w-4 text-blue-500" />
          </div>
          <span className="text-xs text-gray-600">Life Happens</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 flex items-center justify-center">
            <Armchair className="h-4 w-4 text-amber-500" />
          </div>
          <span className="text-xs text-gray-600">Rest Day</span>
        </div>
      </div>
    </div>
  );
};
