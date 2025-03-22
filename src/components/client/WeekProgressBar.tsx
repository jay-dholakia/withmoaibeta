
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { DAYS_OF_WEEK } from '@/types/workout';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Star } from 'lucide-react';

interface WeekProgressBarProps {
  completedDates: Date[];
  label: string;
  count?: number;
  total?: number;
  color?: string;
  textColor?: string;
}

export const WeekProgressBar = ({ 
  completedDates, 
  label, 
  count, 
  total = 7, 
  color = 'bg-client', 
  textColor = 'text-client'
}: WeekProgressBarProps) => {
  // Get start of current week (Sunday)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  
  // Create array of days for the current week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // Calculate percentage complete
  const completedDaysThisWeek = count !== undefined 
    ? count 
    : completedDates.filter(date => 
        weekDays.some(day => isSameDay(day, date))
      ).length;
  
  const percentComplete = (completedDaysThisWeek / total) * 100;

  return (
    <div className="space-y-2 mb-8 bg-white rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-base font-semibold">{label}</h3>
          <p className="text-sm text-slate-500">
            {completedDaysThisWeek} of {total} workouts completed
          </p>
        </div>
        <span className={`text-lg font-bold ${textColor}`}>{Math.round(percentComplete)}%</span>
      </div>

      <Progress value={percentComplete} className="h-3 mb-4" />
      
      <div className="flex justify-between">
        {weekDays.map((day, index) => {
          const isCompleted = completedDates.some(date => isSameDay(day, date));
          
          return (
            <div key={index} className="flex flex-col items-center">
              <div 
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  isCompleted ? 'bg-green-100' : 'bg-slate-100'
                }`}
              >
                {isCompleted && (
                  <Star className="h-4 w-4 text-green-500 fill-green-500" />
                )}
              </div>
              <div className="text-xs text-center text-slate-500 mt-1">
                {format(day, 'E')[0]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
