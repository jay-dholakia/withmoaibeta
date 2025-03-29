
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { format, startOfWeek, addDays, isSameDay, isThisWeek, isToday } from 'date-fns';
import { Calendar } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { WorkoutTypeIcon, WorkoutType } from './WorkoutTypeIcon';

interface WeekProgressBarProps {
  completedDates: Date[];
  lifeHappensDates?: Date[]; // Optional prop for life happens dates
  label: string;
  count?: number;
  total?: number;
  color?: string;
  textColor?: string;
  showDayCircles?: boolean;
  showProgressBar?: boolean; // New prop to control progress bar visibility
  weekNumber?: number; // Optional week number to display
  compact?: boolean; // New prop for compact display in member cards
  workoutTypes?: Record<string, WorkoutType>;
}

export const WeekProgressBar = ({ 
  completedDates, 
  lifeHappensDates = [], // Default to empty array
  label, 
  count, 
  total = 7, 
  color = 'bg-client', 
  textColor = 'text-client',
  showDayCircles = false,
  showProgressBar = false, // Default to not showing the progress bar
  weekNumber,
  compact = false,
  workoutTypes = {} // Default to empty object
}: WeekProgressBarProps) => {
  const isMobile = useIsMobile();
  
  // Get start of current week (Monday as weekStartsOn: 1)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  
  // Create array of days for the current week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // Calculate percentage complete - including both completed workouts and life happens passes
  const completedDaysThisWeek = count !== undefined 
    ? count 
    : completedDates.filter(date => isThisWeek(date, { weekStartsOn: 1 })).length;
  
  const lifeHappensDaysThisWeek = lifeHappensDates.filter(date => 
    isThisWeek(date, { weekStartsOn: 1 })
  ).length;
  
  const totalCompletedCount = count !== undefined ? count : completedDaysThisWeek + lifeHappensDaysThisWeek;
  const percentComplete = (totalCompletedCount / total) * 100;
  
  const hasAssignedWorkouts = total > 0;

  // Helper function to get the workout type for a date
  const getWorkoutTypeForDay = (day: Date): WorkoutType | undefined => {
    const dateString = format(day, 'yyyy-MM-dd');
    
    // First check if we have a predefined type in the map
    if (workoutTypes && workoutTypes[dateString]) {
      return workoutTypes[dateString];
    }
    
    // If it's a life happens pass, mark it as rest day
    if (lifeHappensDates.some(d => isSameDay(d, day))) {
      return 'rest_day';
    }
    
    // For completed dates without an explicit type, default to strength
    if (completedDates.some(d => isSameDay(d, day))) {
      return 'strength';
    }
    
    return undefined;
  };

  // If compact mode is enabled, render a simplified version
  if (compact) {
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-slate-500">
            {totalCompletedCount} of {total} completed
          </span>
          {weekNumber !== undefined && (
            <span className="inline-flex items-center bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
              <Calendar className="h-3 w-3 mr-1" />
              Week {weekNumber}
            </span>
          )}
        </div>
        
        <div className="flex justify-between space-x-1">
          {weekDays.map((day, index) => {
            const isCompleted = completedDates.some(date => isSameDay(day, date));
            const isLifeHappens = lifeHappensDates.some(date => isSameDay(day, date));
            const workoutType = getWorkoutTypeForDay(day);
            const isCurrentDay = isToday(day);
            
            return (
              <div key={index} className="flex flex-col items-center space-y-1">
                <div 
                  className={`h-7 w-7 rounded-md flex items-center justify-center ${
                    isCompleted ? 'bg-green-100' : isLifeHappens ? 'bg-blue-100' : 'bg-slate-100'
                  } ${isCurrentDay ? 'ring-2 ring-client/70' : ''}`}
                >
                  {(isLifeHappens || isCompleted) && workoutType && (
                    <WorkoutTypeIcon type={workoutType} size={14} />
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <span className={`text-xs ${isCurrentDay ? 'font-bold text-client' : 'text-slate-400'}`}>
                    {format(day, 'E')[0]}
                  </span>
                  {isCurrentDay && <span className="h-1 w-1 rounded-full bg-client mt-0.5"></span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 mb-8 bg-white rounded-xl p-5 shadow-sm text-center">
      <div className="flex justify-center flex-col items-center mb-2">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-base font-semibold">{label}</h3>
            {weekNumber !== undefined && (
              <span className="inline-flex items-center bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                <Calendar className="h-3 w-3 mr-1" />
                Week {weekNumber}
              </span>
            )}
          </div>
          {hasAssignedWorkouts ? (
            <p className="text-sm text-slate-500 text-center">
              {totalCompletedCount} of {total} {total === 1 ? 'workout' : 'workouts'} completed
            </p>
          ) : (
            <p className="text-sm text-amber-500 flex items-center justify-center gap-1">
              <span>No assigned workouts this week</span>
            </p>
          )}
        </div>
        {showProgressBar && hasAssignedWorkouts && (
          <span className={`text-lg font-bold ${textColor} mt-2 text-center`}>{Math.round(percentComplete)}%</span>
        )}
      </div>

      {showProgressBar && hasAssignedWorkouts && (
        <Progress 
          value={percentComplete} 
          className="h-3 mb-4 mx-auto" 
          style={{ 
            backgroundColor: "rgb(241 245 249)",
          }}
        />
      )}
      
      {showDayCircles && (
        <div className="flex justify-center space-x-3 mt-4">
          {weekDays.map((day, index) => {
            const isCompleted = completedDates.some(date => isSameDay(day, date));
            const isLifeHappens = lifeHappensDates.some(date => isSameDay(day, date));
            const workoutType = getWorkoutTypeForDay(day);
            const isCurrentDay = isToday(day);
            
            return (
              <div key={index} className="flex flex-col items-center space-y-1">
                <div 
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    isCompleted ? 'bg-green-100' : isLifeHappens ? 'bg-blue-100' : 'bg-slate-100'
                  } ${isCurrentDay ? 'ring-2 ring-client/70' : ''}`}
                >
                  {(isLifeHappens || isCompleted) && workoutType && (
                    <WorkoutTypeIcon type={workoutType} size={16} />
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <span className={`text-xs ${isCurrentDay ? 'font-bold text-client' : 'text-slate-500'}`}>
                    {format(day, 'E')[0]}
                  </span>
                  {isCurrentDay && <span className="h-1 w-1 rounded-full bg-client mt-0.5"></span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
