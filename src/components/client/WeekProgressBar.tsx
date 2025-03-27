
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { format, startOfWeek, addDays, isSameDay, isThisWeek } from 'date-fns';
import { Star, Umbrella, AlertCircle, Calendar } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  weekNumber
}: WeekProgressBarProps) => {
  const isMobile = useIsMobile();
  
  // Get start of current week (Monday as weekStartsOn: 1)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  
  // Create array of days for the current week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // Convert dates to ISO strings for logging and debugging
  console.log("Completed dates:", completedDates.map(d => d.toISOString()));
  console.log("Life happens dates:", lifeHappensDates.map(d => d.toISOString()));
  
  // Calculate percentage complete - including both completed workouts and life happens passes
  const completedDaysThisWeek = count !== undefined 
    ? count 
    : completedDates.filter(date => isThisWeek(date, { weekStartsOn: 1 })).length;
  
  const lifeHappensDaysThisWeek = lifeHappensDates.filter(date => 
    isThisWeek(date, { weekStartsOn: 1 })
  ).length;
  
  console.log("Completed days this week:", completedDaysThisWeek);
  console.log("Life happens days this week:", lifeHappensDaysThisWeek);
  
  const totalCompletedCount = count !== undefined ? count : completedDaysThisWeek + lifeHappensDaysThisWeek;
  const percentComplete = (totalCompletedCount / total) * 100;
  
  console.log("Total completed count:", totalCompletedCount);
  console.log("Percent complete:", percentComplete);
  
  const hasAssignedWorkouts = total > 0;

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
              <AlertCircle className="h-3.5 w-3.5" />
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
        <div className="flex justify-center space-x-1.5 mt-4">
          {weekDays.map((day, index) => {
            const isCompleted = completedDates.some(date => isSameDay(day, date));
            const isLifeHappens = lifeHappensDates.some(date => isSameDay(day, date));
            
            return (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className={`flex items-center justify-center w-6 h-6 rounded-full ${
                    isCompleted ? 'bg-green-100' : isLifeHappens ? 'bg-blue-100' : 'bg-slate-100'
                  }`}
                >
                  {isLifeHappens ? (
                    <Umbrella className="h-3 w-3 text-blue-500" />
                  ) : isCompleted ? (
                    <Star className="h-3 w-3 text-green-500 fill-green-500" />
                  ) : null}
                </div>
                <div className="text-xs text-center text-slate-500 mt-1">
                  {format(day, 'E')[0]}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
