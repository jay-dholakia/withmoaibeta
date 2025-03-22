
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { DAYS_OF_WEEK } from '@/types/workout';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

interface WeekProgressBarProps {
  completedDates: Date[];
  label: string;
  color?: string;
}

export const WeekProgressBar = ({ completedDates, label, color = 'bg-client' }: WeekProgressBarProps) => {
  // Get start of current week (Sunday)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  
  // Create array of days for the current week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // Calculate percentage complete
  const completedDaysThisWeek = completedDates.filter(date => 
    weekDays.some(day => isSameDay(day, date))
  ).length;
  
  const percentComplete = (completedDaysThisWeek / 7) * 100;

  return (
    <div className="space-y-2 mb-6">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">{completedDaysThisWeek}/7 days</span>
      </div>
      <div className="relative">
        <Progress value={percentComplete} className="h-2" />
        <div className="absolute top-0 left-0 right-0 flex justify-between">
          {weekDays.map((day, index) => {
            const isCompleted = completedDates.some(date => isSameDay(day, date));
            const position = `${(index / 6) * 100}%`;
            
            return (
              <div 
                key={index}
                className={`absolute h-3 w-3 rounded-full -mt-0.5 border-2 border-background ${isCompleted ? color : 'bg-muted'}`}
                style={{ left: position }}
              />
            );
          })}
        </div>
        <div className="absolute top-3 left-0 right-0 flex justify-between mt-1">
          {weekDays.map((day, index) => (
            <div key={index} className="text-xs text-muted-foreground" style={{ width: '14.28%', textAlign: 'center' }}>
              {format(day, 'EEE')}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
