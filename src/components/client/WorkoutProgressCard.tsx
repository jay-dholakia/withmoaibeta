
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { WorkoutTypeIcon, WorkoutType } from './WorkoutTypeIcon';
import { format, isThisWeek, addDays, startOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatWeekDateRange } from '@/services/assigned-workouts-service';

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
  currentProgram
}: WorkoutProgressCardProps) {
  // Always use Monday as the first day of the week
  const today = new Date();
  const startDate = startOfWeek(today, { weekStartsOn: 1 });
  
  // Generate array of the 7 days in the current week
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startDate, i);
    return {
      date,
      dayName: format(date, 'EEE')[0], // Just get the first letter
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
  
  return (
    <Card className={cn("w-full overflow-hidden border bg-transparent shadow-none", className)}>
      <CardContent className="p-3">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium">
            {count}/{total}
          </div>
          <Progress value={progressPercentage} className="h-1.5 flex-grow mx-3 max-w-[100px]" />
        </div>
        
        <div className="grid grid-cols-[auto,1fr] gap-2">
          <div className="flex items-center">
            <span className="text-sm font-medium truncate pr-2 w-16">
              {label ? label : userName}
            </span>
          </div>
          
          <div>
            {/* Days of week labels - shown only once at the top */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {daysOfWeek.map((day) => (
                <div key={`day-${day.dateStr}`} className="text-center">
                  <div className="text-[10px] text-muted-foreground font-medium">
                    {day.dayName}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Progress circles */}
            <div className="grid grid-cols-7 gap-0.5">
              {daysOfWeek.map((day) => {
                const hasWorkout = hasWorkoutOnDate(day.dateStr);
                const restDay = isRestDay(day.dateStr);
                const workoutType = getWorkoutType(day.dateStr);
                const workoutTitle = getWorkoutTitle(day.dateStr);
                
                return (
                  <TooltipProvider key={`circle-${day.dateStr}`}>
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
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
