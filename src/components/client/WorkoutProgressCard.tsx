
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { WorkoutTypeIcon, WorkoutType } from './WorkoutTypeIcon';
import { format, isThisWeek, addDays, startOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatWeekDateRange } from '@/services/assigned-workouts-service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Superscript } from 'lucide-react';

interface WorkoutProgressCardProps {
  label?: string;
  count: number;
  total: number;
  userName: string;
  isCurrentUser: boolean;
  completedDates: Date[];
  lifeHappensDates: Date[];
  workoutTypesMap: Record<string, WorkoutType>;
  workoutTitlesMap: Record<string, string>;
  className?: string;
  currentWeek?: number;
  currentProgram?: any;
  avatarUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  showWeekdayLabels?: boolean;
  showLabelsBelow?: boolean;
  showProgressBar?: boolean;
}

export function WorkoutProgressCard({ 
  label,
  count,
  total,
  userName,
  isCurrentUser,
  completedDates,
  lifeHappensDates,
  workoutTypesMap,
  workoutTitlesMap,
  className,
  currentWeek,
  currentProgram,
  avatarUrl,
  firstName,
  lastName,
  showWeekdayLabels = false,
  showLabelsBelow = false,
  showProgressBar = false
}: WorkoutProgressCardProps) {
  const today = new Date();
  const startDate = startOfWeek(today, { weekStartsOn: 1 });
  
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startDate, i);
    return {
      date,
      dayName: format(date, 'EEE'),
      isToday: format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'),
      dateStr: format(date, 'yyyy-MM-dd'),
    };
  });
  
  const getWorkoutType = (dateStr: string): WorkoutType => {
    return workoutTypesMap[dateStr] || null;
  };
  
  const getWorkoutTitle = (dateStr: string): string => {
    return workoutTitlesMap[dateStr] || '';
  };
  
  const getWorkoutsOnDate = (dateStr: string): Date[] => {
    return completedDates.filter(date => format(date, 'yyyy-MM-dd') === dateStr);
  };
  
  const hasWorkoutOnDate = (dateStr: string): boolean => {
    return completedDates.some(date => format(date, 'yyyy-MM-dd') === dateStr);
  };
  
  const isRestDay = (dateStr: string): boolean => {
    return lifeHappensDates.some(date => format(date, 'yyyy-MM-dd') === dateStr);
  };
  
  const progressPercentage = total > 0 ? Math.min(Math.round((count / total) * 100), 100) : 0;
  
  const displayName = firstName || userName;
  
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : userName.charAt(0).toUpperCase();
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  const initials = `${firstInitial}${lastInitial}`;
  
  const todayColumnIndex = daysOfWeek.findIndex(day => day.isToday);
  
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex-shrink-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-8 w-8 border">
                <AvatarImage 
                  src={avatarUrl || ''} 
                  alt={displayName} 
                />
                <AvatarFallback className="bg-client/80 text-white text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="right">
              <span className="text-sm font-medium">
                {displayName}
                {isCurrentUser && <span className="text-xs ml-1 text-muted-foreground">(You)</span>}
              </span>
              <div className="text-xs text-muted-foreground">
                {count}/{total} workouts completed
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="flex-1">
        <div className="grid grid-cols-7 gap-0.5">
          {daysOfWeek.map((day, columnIndex) => {
            const hasWorkout = hasWorkoutOnDate(day.dateStr);
            const restDay = isRestDay(day.dateStr);
            const workoutType = getWorkoutType(day.dateStr);
            const workoutTitle = getWorkoutTitle(day.dateStr);
            const workoutsOnDate = getWorkoutsOnDate(day.dateStr);
            const workoutCount = workoutsOnDate.length;
            
            return (
              <div 
                key={day.dateStr} 
                className="text-center"
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative">
                        <div className={cn(
                          "mx-auto w-6 h-6 rounded-full flex items-center justify-center", 
                          "bg-gray-300/50 border border-gray-400/30"
                        )}>
                          {(hasWorkout || restDay) && workoutType && (
                            <WorkoutTypeIcon
                              type={workoutType}
                              className="h-4 w-4"
                              colorOverride="text-muted-foreground"
                            />
                          )}
                          
                          {workoutCount >= 2 && (
                            <div className="absolute -top-2 -right-2 bg-client text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium shadow-sm">
                              {workoutCount}
                            </div>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[220px]">
                      <div className="text-xs">
                        <div className="font-medium">{format(day.date, 'MMM d, yyyy')}</div>
                        <div>
                          <span className="font-medium">{displayName}</span>
                          {isCurrentUser && <span className="text-xs ml-1 text-muted-foreground">(You)</span>}
                        </div>
                        {hasWorkout && workoutTitle ? (
                          <>
                            <span>{workoutTitle}</span>
                            {workoutCount > 1 && (
                              <div className="mt-1 font-medium text-client">{workoutCount} workouts completed</div>
                            )}
                          </>
                        ) : restDay ? (
                          <span>Rest Day</span>
                        ) : (
                          <span>No workout completed</span>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            );
          })}
          
          {showLabelsBelow && (
            <>
              {daysOfWeek.map((day) => (
                <div key={`below-label-${day.dateStr}`} className="text-xs text-muted-foreground text-center mt-1">
                  {day.dayName[0]}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
