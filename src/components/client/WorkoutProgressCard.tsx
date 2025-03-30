
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format, isThisWeek } from 'date-fns';
import { WorkoutTypeIcon, WorkoutType } from './WorkoutTypeIcon';

interface WorkoutProgressCardProps {
  label?: string;
  count: number;
  total: number;
  completedDates: Date[];
  lifeHappensDates: Date[];
  workoutTypesMap: Record<string, WorkoutType>;
  userName: string;
  isCurrentUser: boolean;
}

export const WorkoutProgressCard: React.FC<WorkoutProgressCardProps> = ({
  label,
  count,
  total,
  completedDates,
  lifeHappensDates,
  workoutTypesMap,
  userName,
  isCurrentUser
}) => {
  const percentage = Math.min(Math.round((count / total) * 100), 100);
  
  // Get this week's dates for display
  const thisWeekWorkouts = completedDates
    .filter(date => isThisWeek(date, { weekStartsOn: 1 }))
    .map(date => format(date, 'yyyy-MM-dd'));
    
  const thisWeekLifeHappens = lifeHappensDates
    .filter(date => isThisWeek(date, { weekStartsOn: 1 }))
    .map(date => format(date, 'yyyy-MM-dd'));
  
  // Handle click to prevent bubbling and accidental navigation
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  return (
    <Card className="relative overflow-hidden" onClick={handleClick}>
      {isCurrentUser && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-bl-md">
          You
        </div>
      )}
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">{userName}</h3>
          <span className="text-lg font-semibold">{count}/{total}</span>
        </div>
        
        <Progress value={percentage} className="h-2 mb-4" />
        
        <div className="grid grid-cols-7 gap-1 mt-4">
          {Array.from({ length: 7 }).map((_, i) => {
            const dayNum = i + 1;
            const dateKey = format(new Date(2025, 2, 23 + i), 'yyyy-MM-dd');
            const isCompleted = thisWeekWorkouts.includes(dateKey);
            const isLifeHappens = thisWeekLifeHappens.includes(dateKey);
            const workoutType = workoutTypesMap[dateKey];
            
            return (
              <div 
                key={i} 
                className="flex flex-col items-center"
                data-week={`day-${dayNum}`}
              >
                <div className="text-xs text-gray-500">Day {dayNum}</div>
                <div className="h-8 w-8 flex items-center justify-center mt-1">
                  {isCompleted ? (
                    <WorkoutTypeIcon type={workoutType || 'strength'} />
                  ) : isLifeHappens ? (
                    <WorkoutTypeIcon type="rest_day" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-200"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
