
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeekProgressBar } from './WeekProgressBar';
import { WorkoutType } from './WorkoutTypeIcon';

interface WorkoutProgressCardProps {
  label: string;
  completedDates: Date[];
  lifeHappensDates: Date[];
  count: number;
  total: number;
  workoutTypesMap?: Record<string, WorkoutType>;
  userName?: string;
  isCurrentUser?: boolean;
}

export const WorkoutProgressCard = ({
  label,
  completedDates,
  lifeHappensDates,
  count,
  total,
  workoutTypesMap = {},
  userName,
  isCurrentUser
}: WorkoutProgressCardProps) => {
  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-medium">
            {userName ? (
              <span>
                {userName}
                {isCurrentUser && <span className="text-xs text-muted-foreground ml-1">(You)</span>}
              </span>
            ) : (
              label
            )}
          </CardTitle>
          <span className="text-base font-semibold text-client">{count}/{total}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4 px-4">
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-client h-full rounded-full"
            style={{ width: `${Math.min(100, (count / total) * 100)}%` }}
          />
        </div>
        
        <div className="flex justify-between items-center mt-4 px-1">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
            const today = new Date();
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay() + 1); // Start from Monday
            
            const currentDay = new Date(weekStart);
            currentDay.setDate(weekStart.getDate() + index);
            
            const isDayCompleted = completedDates.some(date => 
              new Date(date).toDateString() === currentDay.toDateString()
            );
            
            const isLifeHappens = lifeHappensDates.some(date => 
              new Date(date).toDateString() === currentDay.toDateString()
            );
            
            const isToday = today.toDateString() === currentDay.toDateString();
            
            // Format date to get the correct workout type from map
            const dateStr = currentDay.toISOString().split('T')[0];
            const workoutType = isDayCompleted ? (workoutTypesMap[dateStr] || 'strength') : undefined;
            
            let bgColor = 'bg-slate-100';
            let textColor = 'text-slate-400';
            let border = '';
            
            if (isToday) {
              border = 'border-2 border-slate-300';
              textColor = 'text-slate-500';
            }
            
            if (isLifeHappens) {
              bgColor = 'bg-yellow-100';
              textColor = 'text-yellow-700';
            }
            
            if (isDayCompleted) {
              bgColor = 'bg-client/90';
              textColor = 'text-white';
            }
            
            return (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center ${bgColor} ${textColor} ${border}`}
                >
                  <span className="text-xs font-medium">{day}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
