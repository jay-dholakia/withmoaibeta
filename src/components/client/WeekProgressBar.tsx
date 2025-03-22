
import React from 'react';
import { Progress } from '@/components/ui/progress';

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
  // Calculate percentage complete
  const completedDaysThisWeek = count !== undefined 
    ? count 
    : completedDates.filter(date => {
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        return date >= weekStart && date < weekEnd;
      }).length;
  
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
    </div>
  );
};
