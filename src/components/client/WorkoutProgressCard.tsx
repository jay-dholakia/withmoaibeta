
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkoutType, WorkoutTypeIcon } from './WorkoutTypeIcon';
import { format } from 'date-fns';

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
  // Default to 6 if total is 0 or undefined
  const displayTotal = total <= 0 ? 6 : total;
  
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
          <span className="text-base font-semibold text-client">{count}/{displayTotal}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4 px-4">
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-client h-full rounded-full"
            style={{ width: `${Math.min(100, (count / displayTotal) * 100)}%` }}
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
            const dateStr = format(currentDay, 'yyyy-MM-dd');
            const workoutType = workoutTypesMap[dateStr] || (isLifeHappens ? 'rest_day' : 'strength');
            
            // Use lighter background colors for better emoji visibility
            let bgColor = 'bg-slate-50';
            
            if (isLifeHappens) {
              bgColor = 'bg-yellow-50';
            }
            
            if (isDayCompleted) {
              bgColor = 'bg-client/10';
            }
            
            return (
              <div key={index} className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${bgColor} border border-slate-200`}>
                  {(isDayCompleted || isLifeHappens) ? (
                    <WorkoutTypeIcon type={workoutType} />
                  ) : (
                    <span className="text-xs font-medium text-slate-600">{day}</span>
                  )}
                </div>
                
                {isToday && (
                  <div className="w-1.5 h-1.5 bg-client rounded-full mt-0.5"></div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
