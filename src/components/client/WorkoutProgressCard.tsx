
import React from 'react';
import { WeekProgressBar } from './WeekProgressBar';
import { WorkoutType } from './WorkoutTypeIcon';

interface WorkoutProgressCardProps {
  label: string;
  completedDates: Date[];
  lifeHappensDates: Date[];
  count: number;
  total: number;
  workoutTypesMap?: Record<string, WorkoutType>;
  workoutTitlesMap?: Record<string, string>;
  onClick?: () => void;
  userName?: string;
  isCurrentUser?: boolean;
  cardioMinutes?: number;
  targetCardioMinutes?: number;
  currentWeek?: number;
  currentProgram?: any;
}

export const WorkoutProgressCard: React.FC<WorkoutProgressCardProps> = ({
  label,
  completedDates,
  lifeHappensDates,
  count,
  total,
  workoutTypesMap = {},
  workoutTitlesMap = {},
  onClick,
  userName = 'User',
  isCurrentUser = false,
  cardioMinutes = 0,
  targetCardioMinutes = 0,
  currentWeek,
  currentProgram
}) => {
  return (
    <div 
      className={`border rounded-lg p-4 shadow-sm transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-1">
        <h4 className="text-sm font-medium">{label}</h4>
        <span className="text-sm font-semibold">{count} / {total}</span>
      </div>
      
      <WeekProgressBar 
        completedDates={completedDates}
        lifeHappensDates={lifeHappensDates}
        workoutTypes={workoutTypesMap}
        workoutTitlesMap={workoutTitlesMap}
        userName={userName}
        count={count}
        total={total}
      />
      
      {/* Cardio minutes progress */}
      <div className="mt-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm">Cardio Minutes</span>
          <span className="text-sm font-medium">{cardioMinutes}/{targetCardioMinutes}</span>
        </div>
        <div className="bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-blue-800 h-full" 
            style={{ 
              width: targetCardioMinutes > 0 ? 
                `${Math.min(100, (cardioMinutes / targetCardioMinutes) * 100)}%` : 
                '0%' 
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};
