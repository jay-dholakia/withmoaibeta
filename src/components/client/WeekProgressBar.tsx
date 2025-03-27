
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { format, startOfWeek, addDays, isSameDay, isThisWeek, isSameWeek } from 'date-fns';
import { Star, Umbrella, AlertCircle } from 'lucide-react';
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
  showProgressBar?: boolean; // Prop to control progress bar visibility
  selectedDate?: Date; // New prop for selected date
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
  selectedDate = new Date() // Default to current date
}: WeekProgressBarProps) => {
  const isMobile = useIsMobile();
  
  // Get start of the selected week (Sunday)
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  
  // Create array of days for the selected week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // Convert dates to ISO strings for logging and debugging
  console.log("Selected date:", selectedDate.toISOString());
  console.log("Week start:", weekStart.toISOString());
  console.log("Completed dates:", completedDates.map(d => d.toISOString()));
  console.log("Life happens dates:", lifeHappensDates.map(d => d.toISOString()));
  
  // Check if the selected week is the current week
  const isSelectedWeekCurrentWeek = isThisWeek(weekStart, { weekStartsOn: 0 });
  
  // Filter completed dates for the selected week
  const completedDatesThisWeek = completedDates.filter(date => 
    isSameWeek(date, weekStart, { weekStartsOn: 0 })
  );
  
  const lifeHappensDatesThisWeek = lifeHappensDates.filter(date => 
    isSameWeek(date, weekStart, { weekStartsOn: 0 })
  );
  
  // Calculate percentage complete - including both completed workouts and life happens passes
  const completedDaysThisWeek = count !== undefined 
    ? count 
    : completedDatesThisWeek.length;
  
  const lifeHappensDaysThisWeek = lifeHappensDatesThisWeek.length;
  
  console.log("Completed days this week:", completedDaysThisWeek);
  console.log("Life happens days this week:", lifeHappensDaysThisWeek);
  
  const totalCompletedCount = count !== undefined ? count : completedDaysThisWeek + lifeHappensDaysThisWeek;
  const percentComplete = (totalCompletedCount / total) * 100;
  
  console.log("Total completed count:", totalCompletedCount);
  console.log("Percent complete:", percentComplete);
  
  const hasAssignedWorkouts = total > 0;

  return (
    <div className="space-y-2 mb-8 bg-white rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-base font-semibold">{label}</h3>
          {hasAssignedWorkouts ? (
            <p className="text-sm text-slate-500">
              {totalCompletedCount} of {total} {total === 1 ? 'workout' : 'workouts'} completed
              {!isSelectedWeekCurrentWeek && (
                <span className="ml-1">
                  ({format(weekStart, 'MM/dd')} - {format(addDays(weekStart, 6), 'MM/dd')})
                </span>
              )}
            </p>
          ) : (
            <p className="text-sm text-amber-500 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>No assigned workouts this week</span>
            </p>
          )}
        </div>
        {showProgressBar && hasAssignedWorkouts && (
          <span className={`text-lg font-bold ${textColor}`}>{Math.round(percentComplete)}%</span>
        )}
      </div>

      {showProgressBar && hasAssignedWorkouts && (
        <Progress 
          value={percentComplete} 
          className="h-3 mb-4" 
          style={{ 
            backgroundColor: "rgb(241 245 249)",
          }}
        />
      )}
      
      {showDayCircles && (
        <div className="flex justify-between px-1 sm:px-4 mt-3">
          {weekDays.map((day, index) => {
            const isCompleted = completedDates.some(date => isSameDay(day, date));
            const isLifeHappens = lifeHappensDates.some(date => isSameDay(day, date));
            
            return (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full ${
                    isCompleted ? 'bg-green-100' : isLifeHappens ? 'bg-blue-100' : 'bg-slate-100'
                  }`}
                >
                  {isLifeHappens ? (
                    <Umbrella className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                  ) : isCompleted ? (
                    <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 fill-green-500" />
                  ) : null}
                </div>
                <div className="text-xs text-center text-slate-500 mt-1">
                  {format(day, 'MM/dd')}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
