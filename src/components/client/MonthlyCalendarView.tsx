
import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isSameMonth, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkoutHistoryItem } from '@/types/workout';
import { WorkoutTypeIcon } from './WorkoutTypeIcon';

interface MonthlyCalendarViewProps {
  workouts: WorkoutHistoryItem[];
}

export const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({ workouts }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const prevMonth = () => {
    setCurrentMonth(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const nextMonth = () => {
    setCurrentMonth(nextDate => {
      const newDate = new Date(nextDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startWeekday = getDay(monthStart);

  const renderHeader = () => {
    const dateFormat = "MMMM yyyy";
    return (
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-lg font-semibold">
          {format(currentMonth, dateFormat)}
        </div>
        <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderDays = () => {
    return (
      <div className="grid grid-cols-7 gap-1 mb-1">
        {daysOfWeek.map(day => (
          <div key={day} className="text-center text-xs font-medium py-1">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const getWorkoutTypeForDay = (day: Date): 'strength' | 'cardio' | 'flexibility' | 'bodyweight' | 'rest_day' | 'custom' | 'one_off' | undefined => {
    // Find workouts for this day
    const workoutsForDay = workouts.filter(workout => {
      if (!workout.completed_at) return false;
      return isSameDay(new Date(workout.completed_at), day);
    });

    if (workoutsForDay.length === 0) return undefined;

    // If it's a rest day, return that type
    if (workoutsForDay.some(w => w.rest_day)) {
      return 'rest_day';
    }

    // If it's a life happens pass, we don't show anything special
    if (workoutsForDay.every(w => w.life_happens_pass)) {
      return undefined;
    }

    // Try to determine workout type from the workout details
    // This might need adjustments based on your actual data structure
    for (const workout of workoutsForDay) {
      if (workout.workout?.workout_exercises?.length > 0) {
        const firstExercise = workout.workout.workout_exercises[0];
        if (firstExercise.exercise?.exercise_type) {
          return firstExercise.exercise.exercise_type;
        }
      }
    }

    // If we couldn't determine the type, use a fallback based on workout properties
    if (workoutsForDay.some(w => w.workout?.title?.toLowerCase().includes('strength'))) {
      return 'strength';
    } else if (workoutsForDay.some(w => w.workout?.title?.toLowerCase().includes('cardio') || 
                                        w.workout?.title?.toLowerCase().includes('run'))) {
      return 'cardio';
    } else if (workoutsForDay.some(w => w.workout?.title?.toLowerCase().includes('flex') || 
                                        w.workout?.title?.toLowerCase().includes('stretch') || 
                                        w.workout?.title?.toLowerCase().includes('yoga'))) {
      return 'flexibility';
    } else if (workoutsForDay.some(w => w.workout?.title?.toLowerCase().includes('bodyweight'))) {
      return 'bodyweight';
    }

    // Default to custom if we can't determine
    return 'custom';
  };

  const renderCells = () => {
    const dateFormat = "d";
    const rows = [];
    let days = [];
    
    // Add empty cells for the start of the month
    for (let i = 0; i < startWeekday; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-10 p-1 border border-transparent"></div>
      );
    }
    
    // Add days of the month
    for (const day of monthDays) {
      const formattedDate = format(day, dateFormat);
      const isCurrentDay = isToday(day);
      const isSameMonthDay = isSameMonth(day, currentMonth);
      
      // Check if there's a workout for this day
      const workoutType = getWorkoutTypeForDay(day);
      const hasWorkout = !!workoutType;
      
      days.push(
        <div 
          key={day.toString()} 
          className={`h-10 p-1 text-center relative ${
            !isSameMonthDay ? 'text-gray-300' : 
            isCurrentDay ? 'bg-primary/10 text-primary font-bold rounded-md' : ''
          }`}
        >
          <div className="flex flex-col h-full justify-between">
            <span className="text-xs">{formattedDate}</span>
            {hasWorkout && (
              <div className="flex justify-center">
                <WorkoutTypeIcon type={workoutType} />
              </div>
            )}
          </div>
        </div>
      );
      
      if (days.length === 7) {
        rows.push(
          <div key={day.toString()} className="grid grid-cols-7 gap-1">
            {days}
          </div>
        );
        days = [];
      }
    }
    
    // Add any remaining days
    if (days.length > 0) {
      rows.push(
        <div key="last-row" className="grid grid-cols-7 gap-1">
          {days}
          {/* Add empty cells to complete the row */}
          {Array(7 - days.length).fill(null).map((_, i) => (
            <div key={`empty-end-${i}`} className="h-10 p-1 border border-transparent"></div>
          ))}
        </div>
      );
    }
    
    return <div className="space-y-1">{rows}</div>;
  };
  
  return (
    <div className="p-2 bg-white rounded-lg">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
};
