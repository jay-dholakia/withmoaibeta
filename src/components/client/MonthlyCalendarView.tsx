import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isSameMonth, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkoutHistoryItem } from '@/types/workout';
import { WorkoutTypeIcon, WorkoutType } from './WorkoutTypeIcon';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface MonthlyCalendarViewProps {
  workouts: WorkoutHistoryItem[];
  onDaySelect?: (date: Date, workouts: WorkoutHistoryItem[]) => void;
  workoutTypesMap?: Record<string, WorkoutType>;
  workoutTitlesMap?: Record<string, string>;
  showWorkoutTooltips?: boolean;
}

export const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({ 
  workouts, 
  onDaySelect,
  workoutTypesMap = {},
  workoutTitlesMap = {},
  showWorkoutTooltips = false
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  console.log(`User timezone: ${userTimeZone}`);

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

  const getWorkoutsForDay = (day: Date): WorkoutHistoryItem[] => {
    const dayStr = format(day, 'yyyy-MM-dd');
    
    if (!workouts || workouts.length === 0) {
      return [];
    }
    
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
        
        return match;
      } catch (error) {
        console.error('Date parsing error:', error);
        return false;
      }
    });
    
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
    
    if (workoutTypesMap && workoutTypesMap[formattedDate]) {
      return workoutTypesMap[formattedDate];
    }
    
    const workoutsForDay = getWorkoutsForDay(day);

    if (workoutsForDay.length === 0) return undefined;

    if (workoutsForDay.some(w => w.rest_day)) {
      return 'rest_day';
    }

    if (workoutsForDay.every(w => w.life_happens_pass)) {
      return 'rest_day';
    }

    for (const workout of workoutsForDay) {
      const title = (workout.title || workout.workout?.title || '').toLowerCase();
      
      if (title.includes('tennis')) return 'tennis';
      if (title.includes('basketball')) return 'basketball';
      if (title.includes('golf')) return 'golf';
      if (title.includes('volleyball')) return 'volleyball';
      if (title.includes('baseball')) return 'baseball';
      if (title.includes('hiking')) return 'hiking';
      if (title.includes('skiing')) return 'skiing';
      if (title.includes('yoga')) return 'yoga';
    }
    
    for (const workout of workoutsForDay) {
      if (workout.workout_type) {
        const type = workout.workout_type.toLowerCase();
        if (type === 'strength') return 'strength';
        if (type === 'cardio') return 'cardio';
        if (type === 'bodyweight') return 'bodyweight';
        if (type === 'flexibility') return 'flexibility';
        if (type === 'hiit') return 'hiit';
        if (type === 'swimming') return 'swimming';
        if (type === 'cycling') return 'cycling';
        if (type === 'dance') return 'dance';
        if (type === 'custom') return 'custom';
        if (type === 'basketball') return 'basketball';
        if (type === 'golf') return 'golf';
        if (type === 'volleyball') return 'volleyball'; 
        if (type === 'baseball') return 'baseball';
        if (type === 'tennis') return 'tennis';
        if (type === 'hiking') return 'hiking';
        if (type === 'skiing') return 'skiing';
        if (type === 'yoga') return 'yoga';
      }
    }

    for (const workout of workoutsForDay) {
      if (workout.workout?.workout_type) {
        const workoutType = workout.workout.workout_type.toLowerCase();
        
        if (workoutType === 'basketball') return 'basketball';
        if (workoutType === 'golf') return 'golf';
        if (workoutType === 'volleyball') return 'volleyball';
        if (workoutType === 'baseball') return 'baseball';
        if (workoutType === 'tennis') return 'tennis';
        if (workoutType === 'hiking') return 'hiking';
        if (workoutType === 'skiing') return 'skiing';
        if (workoutType === 'yoga') return 'yoga';
        
        if (workoutType === 'strength') return 'strength';
        if (workoutType === 'cardio') return 'cardio';
        if (workoutType === 'bodyweight') return 'bodyweight';
        if (workoutType === 'flexibility') return 'flexibility';
        if (workoutType === 'hiit') return 'hiit';
        if (workoutType === 'swimming') return 'swimming';
        if (workoutType === 'cycling') return 'cycling';
        if (workoutType === 'dance') return 'dance';
        if (workoutType === 'custom') return 'custom';
      }
    }

    for (const workout of workoutsForDay) {
      const description = (workout.description || workout.workout?.description || '').toLowerCase();
      
      if (description.includes('basketball')) return 'basketball';
      if (description.includes('golf')) return 'golf';
      if (description.includes('volleyball')) return 'volleyball';
      if (description.includes('baseball')) return 'baseball';
      if (description.includes('tennis')) return 'tennis';
      if (description.includes('hiking')) return 'hiking';
      if (description.includes('skiing')) return 'skiing';
      if (description.includes('yoga')) return 'yoga';
      
      if (description.includes('dance')) return 'dance';
      if (description.includes('swim')) return 'swimming';
      if (description.includes('cycl') || description.includes('bike')) return 'cycling';
      if (description.includes('hiit')) return 'hiit';
      if (description.includes('strength')) return 'strength';
      if (description.includes('cardio') || description.includes('run')) return 'cardio';
      if (description.includes('flex') || description.includes('stretch') || description.includes('yoga')) return 'flexibility';
      if (description.includes('bodyweight')) return 'bodyweight';
    }

    return 'custom';
  };

  const getWorkoutTooltipContent = (day: Date): string => {
    const workoutsForDay = getWorkoutsForDay(day);
    if (workoutsForDay.length === 0) return "No workouts";
    
    if (workoutsForDay.some(w => w.rest_day)) {
      return "Rest Day";
    }
    
    return workoutsForDay.map(workout => {
      const title = workout.title || workout.workout?.title || 'Unknown Workout';
      const type = workout.workout_type || workout.workout?.workout_type || 'Unknown Type';
      return `${title} (${type})`;
    }).join('\n');
  };
  
  const renderDayContent = (day: Date, isSelected: boolean, isCurrentDay: boolean) => {
    const formattedDate = format(day, 'd');
    const workoutType = getWorkoutTypeForDay(day);
    const hasWorkout = !!workoutType;
    
    const dayContent = (
      <div className="flex flex-col h-full justify-between items-center gap-0.5">
        <span className="text-xs mb-0">{formattedDate}</span>
        {hasWorkout && (
          <div className="mt-[-2px]">
            <WorkoutTypeIcon type={workoutType} />
          </div>
        )}
      </div>
    );
    
    if (showWorkoutTooltips && hasWorkout) {
      const dateKey = format(day, 'yyyy-MM-dd');
      const workoutTitle = workoutTitlesMap[dateKey] || getWorkoutTooltipContent(day);
      
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {dayContent}
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              {workoutTitle}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return dayContent;
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
      const isCurrentDay = isToday(day);
      const isSameMonthDay = isSameMonth(day, currentMonth);
      const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
      
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
          {renderDayContent(day, isSelected, isCurrentDay)}
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
      { type: 'flexibility', label: 'Flexibility' },
      { type: 'rest_day', label: 'Rest Day' },
      { type: 'custom', label: 'Custom' },
      { type: 'hiit', label: 'HIIT' },
      { type: 'swimming', label: 'Swimming' },
      { type: 'cycling', label: 'Cycling' },
      { type: 'dance', label: 'Dance' },
      { type: 'basketball', label: 'Basketball' },
      { type: 'golf', label: 'Golf' },
      { type: 'volleyball', label: 'Volleyball' },
      { type: 'baseball', label: 'Baseball' },
      { type: 'tennis', label: 'Tennis' },
      { type: 'hiking', label: 'Hiking' },
      { type: 'skiing', label: 'Skiing' },
      { type: 'yoga', label: 'Yoga' },
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
