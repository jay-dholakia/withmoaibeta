
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { WorkoutTypeIcon, WorkoutType } from './WorkoutTypeIcon';
import { format, isThisWeek, addDays, startOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatWeekDateRange } from '@/services/assigned-workouts-service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  showWeekdayLabels = false
}: WorkoutProgressCardProps) {
  // Always use Monday as the first day of the week
  const today = new Date();
  const startDate = startOfWeek(today, { weekStartsOn: 1 });
  
  // Generate array of the 7 days in the current week
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startDate, i);
    return {
      date,
      dayName: format(date, 'EEE'),
      isToday: format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'),
      dateStr: format(date, 'yyyy-MM-dd'),
    };
  });
  
  // Function to get workout type for a specific date
  const getWorkoutType = (dateStr: string): WorkoutType => {
    return workoutTypesMap[dateStr] || null;
  };
  
  // Function to get workout title for a specific date
  const getWorkoutTitle = (dateStr: string): string => {
    return workoutTitlesMap[dateStr] || '';
  };
  
  // Check if a specific date has a workout
  const hasWorkoutOnDate = (dateStr: string): boolean => {
    return completedDates.some(date => format(date, 'yyyy-MM-dd') === dateStr);
  };
  
  // Check if a specific date is a rest day
  const isRestDay = (dateStr: string): boolean => {
    return lifeHappensDates.some(date => format(date, 'yyyy-MM-dd') === dateStr);
  };
  
  // Calculate progress percentage safely
  const progressPercentage = total > 0 ? Math.min(Math.round((count / total) * 100), 100) : 0;
  
  const displayName = firstName || userName;
  const initials = firstName ? firstName.charAt(0).toUpperCase() : userName.charAt(0).toUpperCase();
  
  return (
    <div className={cn("flex items-center gap-3 pb-2", className)}>
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
        {!showWeekdayLabels && (
          <Progress value={progressPercentage} className="h-1.5 mb-2" />
        )}
        <div className="grid grid-cols-7 gap-0.5">
          {daysOfWeek.map((day) => {
            const hasWorkout = hasWorkoutOnDate(day.dateStr);
            const restDay = isRestDay(day.dateStr);
            const workoutType = getWorkoutType(day.dateStr);
            const workoutTitle = getWorkoutTitle(day.dateStr);
            
            return (
              <div key={day.dateStr} className="text-center">
                {showWeekdayLabels && (
                  <div className="text-xs text-muted-foreground mb-1">
                    {day.dayName[0]}
                  </div>
                )}
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "relative mx-auto w-6 h-6 rounded-full flex items-center justify-center", 
                        day.isToday ? "ring-1 ring-primary ring-offset-1" : "",
                        hasWorkout || restDay ? "bg-muted" : "bg-muted/30"
                      )}>
                        {(hasWorkout || restDay) && workoutType && (
                          <WorkoutTypeIcon
                            type={workoutType}
                            className="h-4 w-4"
                            colorOverride={hasWorkout ? undefined : "text-muted-foreground"}
                          />
                        )}
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
                          <span>{workoutTitle}</span>
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
        </div>
      </div>
    </div>
  );
}
