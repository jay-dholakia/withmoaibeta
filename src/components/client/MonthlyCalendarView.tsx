
import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isSameMonth, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkoutHistoryItem } from '@/types/workout';
import { WorkoutTypeIcon, WorkoutType } from './WorkoutTypeIcon';

interface MonthlyCalendarViewProps {
  workouts: WorkoutHistoryItem[];
  onDaySelect?: (date: Date, workouts: WorkoutHistoryItem[]) => void;
  workoutTypesMap?: Record<string, WorkoutType>;
}

export const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({ 
  workouts, 
  onDaySelect,
  workoutTypesMap = {} 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [isLegendExpanded, setIsLegendExpanded] = useState(true);

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

  // Function to get workouts for a specific day
  const getWorkoutsForDay = (day: Date): WorkoutHistoryItem[] => {
    // Debug the day we're looking for
    console.log(`Getting workouts for: ${format(day, 'yyyy-MM-dd')}`);
    
    if (!workouts || workouts.length === 0) {
      console.log('No workouts data available');
      return [];
    }
    
    // Filter workouts for the given day
    const filteredWorkouts = workouts.filter(workout => {
      if (!workout.completed_at) {
        return false;
      }
      
      try {
        const completionDate = new Date(workout.completed_at);
        
        const match = (
          completionDate.getFullYear() === day.getFullYear() &&
          completionDate.getMonth() === day.getMonth() &&
          completionDate.getDate() === day.getDate()
        );
        
        if (match) {
          console.log(`Found workout: completed at ${workout.completed_at}, type: ${workout.workout?.workout_type || 'unknown'}`);
        }
        
        return match;
      } catch (error) {
        console.error('Date parsing error:', error);
        return false;
      }
    });
    
    console.log(`Found ${filteredWorkouts.length} workouts for ${format(day, 'yyyy-MM-dd')}`);
    return filteredWorkouts;
  };

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    if (onDaySelect) {
      const workoutsForDay = getWorkoutsForDay(day);
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

  const getWorkoutTypeForDay = (day: Date): WorkoutType | undefined => {
    const formattedDate = format(day, 'yyyy-MM-dd');
    
    // First check if we have a predefined type in the map
    if (workoutTypesMap && workoutTypesMap[formattedDate]) {
      return workoutTypesMap[formattedDate];
    }
    
    const workoutsForDay = getWorkoutsForDay(day);

    if (workoutsForDay.length === 0) return undefined;

    // If it's a rest day, mark it as such
    if (workoutsForDay.some(w => w.rest_day)) {
      return 'rest_day';
    }

    // If it's a life happens pass, mark it as rest_day
    if (workoutsForDay.every(w => w.life_happens_pass)) {
      return 'rest_day';
    }

    // Check if there's explicitly a workout type provided from the database
    for (const workout of workoutsForDay) {
      if (workout.workout?.workout_type) {
        // Directly return the workout type if it matches one of our known types
        const workoutType = workout.workout.workout_type as WorkoutType;
        if (workoutType === 'sport' || 
            workoutType === 'strength' || 
            workoutType === 'cardio' || 
            workoutType === 'bodyweight' ||
            workoutType === 'flexibility' ||
            workoutType === 'rest_day' ||
            workoutType === 'custom' ||
            workoutType === 'one_off' ||
            workoutType === 'hiit' ||
            workoutType === 'swimming' ||
            workoutType === 'cycling' ||
            workoutType === 'dance') {
          return workoutType;
        }
      }
    }

    // Fallbacks for workouts without an explicit type
    // Check workout titles first
    for (const workout of workoutsForDay) {
      const title = workout.workout?.title?.toLowerCase() || '';
      
      if (title.includes('sport') || title.includes('game') || title.includes('play') || title.includes('match')) {
        return 'sport';
      }
      if (title.includes('dance')) {
        return 'dance';  
      }
      if (title.includes('swim')) {
        return 'swimming';
      }
      if (title.includes('cycl') || title.includes('bike')) {
        return 'cycling';
      }
      if (title.includes('hiit')) {
        return 'hiit';
      }
      if (title.includes('strength')) {
        return 'strength';
      }
      if (title.includes('cardio') || title.includes('run')) {
        return 'cardio';
      }
      if (title.includes('flex') || title.includes('stretch') || title.includes('yoga')) {
        return 'flexibility';
      }
      if (title.includes('bodyweight')) {
        return 'bodyweight';
      }
    }

    // Check first exercise type if available
    for (const workout of workoutsForDay) {
      if (workout.workout?.workout_exercises?.length > 0) {
        const firstExercise = workout.workout.workout_exercises[0];
        if (firstExercise.exercise?.exercise_type) {
          const type = firstExercise.exercise.exercise_type.toLowerCase();
          if (type.includes('sport')) return 'sport';
          if (type.includes('dance')) return 'dance';
          if (type.includes('swim')) return 'swimming';
          if (type.includes('cycl')) return 'cycling';
          if (type.includes('hiit')) return 'hiit';
          if (type.includes('strength')) return 'strength';
          if (type.includes('cardio')) return 'cardio';
          if (type.includes('body')) return 'bodyweight';
          if (type.includes('flex')) return 'flexibility';
        }
      }
    }

    // Default for any other type of workout
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
            isCurrentDay ? 'border-2 border-primary text-primary font-bold rounded-md' : ''
          }`}
        >
          <div className="flex flex-col h-full justify-between items-center gap-0.5">
            <span className="text-xs mb-0">{formattedDate}</span>
            {hasWorkout && (
              <div className="mt-[-2px]">
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
      { type: 'bodyweight', label: 'Bodyweight' },
      { type: 'cardio', label: 'Cardio' },
      { type: 'flexibility', label: 'Flexibility' },
      { type: 'rest_day', label: 'Rest Day' },
      { type: 'custom', label: 'Custom' },
      { type: 'one_off', label: 'One-off' },
      { type: 'hiit', label: 'HIIT' },
      { type: 'sport', label: 'Sport' },
      { type: 'swimming', label: 'Swimming' },
      { type: 'cycling', label: 'Cycling' },
      { type: 'dance', label: 'Dance' },
    ] as const;

    return (
      <div className="mt-4 pt-3 border-t">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsLegendExpanded(!isLegendExpanded)}
          className="w-full flex items-center justify-between text-xs font-medium mb-2"
        >
          <span>Workout Types</span>
          {isLegendExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
        
        {isLegendExpanded && (
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            {legendItems.map((item) => (
              <div key={item.type} className="flex items-center gap-1.5">
                <WorkoutTypeIcon type={item.type} />
                <span className="text-xs">{item.label}</span>
              </div>
            ))}
          </div>
        )}
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
