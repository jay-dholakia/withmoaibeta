
import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isSameMonth, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkoutHistoryItem } from '@/types/workout';
import { WorkoutTypeIcon } from './WorkoutTypeIcon';

interface MonthlyCalendarViewProps {
  workouts: WorkoutHistoryItem[];
  onDaySelect?: (date: Date, workouts: WorkoutHistoryItem[]) => void;
}

export const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({ workouts, onDaySelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

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

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    if (onDaySelect) {
      const workoutsForDay = workouts.filter(workout => {
        if (!workout.completed_at) return false;
        return isSameDay(new Date(workout.completed_at), day);
      });
      onDaySelect(day, workoutsForDay);
    }
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
    const workoutsForDay = workouts.filter(workout => {
      if (!workout.completed_at) return false;
      return isSameDay(new Date(workout.completed_at), day);
    });

    if (workoutsForDay.length === 0) return undefined;

    if (workoutsForDay.some(w => w.rest_day)) {
      return 'rest_day';
    }

    if (workoutsForDay.every(w => w.life_happens_pass)) {
      return undefined;
    }

    for (const workout of workoutsForDay) {
      if (workout.workout?.workout_exercises?.length > 0) {
        const firstExercise = workout.workout.workout_exercises[0];
        if (firstExercise.exercise?.exercise_type) {
          return firstExercise.exercise.exercise_type;
        }
      }
    }

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

    return 'custom';
  };

  const renderCells = () => {
    const dateFormat = "d";
    const rows = [];
    let days = [];
    
    for (let i = 0; i < startWeekday; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-10 p-1 border border-transparent"></div>
      );
    }
    
    for (const day of monthDays) {
      const formattedDate = format(day, dateFormat);
      const isCurrentDay = isToday(day);
      const isSameMonthDay = isSameMonth(day, currentMonth);
      const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
      
      const workoutType = getWorkoutTypeForDay(day);
      const hasWorkout = !!workoutType;
      
      days.push(
        <div 
          key={day.toString()} 
          onClick={() => handleDayClick(day)}
          className={`h-10 p-1 text-center relative cursor-pointer hover:bg-gray-50 ${
            !isSameMonthDay ? 'text-gray-300' : 
            isSelected ? 'bg-primary/20 text-primary font-bold rounded-md' :
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
    
    if (days.length > 0) {
      rows.push(
        <div key="last-row" className="grid grid-cols-7 gap-1">
          {days}
          {Array(7 - days.length).fill(null).map((_, i) => (
            <div key={`empty-end-${i}`} className="h-10 p-1 border border-transparent"></div>
          ))}
        </div>
      );
    }
    
    return <div className="space-y-1">{rows}</div>;
  };

  const renderLegend = () => {
    const legendItems = [
      { type: 'strength', label: 'Strength' },
      { type: 'cardio', label: 'Cardio' },
      { type: 'flexibility', label: 'Flexibility' },
      { type: 'bodyweight', label: 'Bodyweight' },
      { type: 'rest_day', label: 'Rest Day' },
      { type: 'custom', label: 'Custom' },
      { type: 'one_off', label: 'One-off' },
    ] as const;

    return (
      <div className="mt-4 pt-3 border-t">
        <h3 className="text-xs font-medium mb-2 text-center">Workout Types</h3>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {legendItems.map((item) => (
            <div key={item.type} className="flex items-center gap-1.5">
              <WorkoutTypeIcon type={item.type} />
              <span className="text-xs">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-2 bg-white rounded-lg">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      {renderLegend()}
    </div>
  );
};
