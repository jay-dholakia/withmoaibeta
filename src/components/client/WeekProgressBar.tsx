
import React, { useMemo } from 'react';
import { format, isThisWeek, startOfWeek, endOfWeek, addDays, isSameDay } from 'date-fns';
import { WorkoutTypeIcon, WorkoutType } from './WorkoutTypeIcon';

interface WeekProgressBarProps {
  label?: string;
  completedDates: Date[];
  lifeHappensDates: Date[];
  count: number;
  total?: number;
  color?: string;
  textColor?: string;
  showProgressBar?: boolean;
  showDayCircles?: boolean;
  weekNumber?: number;
  workoutTypes?: Record<string, WorkoutType>;
  hasError?: boolean;
  compact?: boolean;
}

export const WeekProgressBar = ({
  label,
  completedDates = [],
  lifeHappensDates = [],
  count,
  total = 0,
  color = 'bg-client',
  textColor = 'text-client',
  showProgressBar = true,
  showDayCircles = true,
  weekNumber,
  workoutTypes = {},
  hasError = false,
  compact = false,
}: WeekProgressBarProps) => {
  const { weekStart, weekDays } = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    
    return {
      weekStart: start,
      weekDays: days,
    };
  }, []);
  
  const dayStatus = useMemo(() => {
    return weekDays.map(day => {
      const hasCompleted = completedDates.some(date => {
        // Handle both Date objects and string dates
        if (typeof date === 'string') {
          return isSameDay(new Date(date), day);
        }
        return isSameDay(date, day);
      });
      
      const hasLifeHappens = lifeHappensDates.some(date => {
        // Handle both Date objects and string dates
        if (typeof date === 'string') {
          return isSameDay(new Date(date), day);
        }
        return isSameDay(date, day);
      });
      
      const dateStr = format(day, 'yyyy-MM-dd');
      const workoutType = workoutTypes[dateStr] || (hasLifeHappens ? 'rest_day' : 'strength');
      
      return {
        date: day,
        isCompleted: hasCompleted,
        isLifeHappens: hasLifeHappens,
        workoutType,
      };
    });
  }, [weekDays, completedDates, lifeHappensDates, workoutTypes]);
  
  const progressPercentage = total > 0 ? Math.min(100, (count / total) * 100) : 0;
  
  const renderProgressBar = () => (
    <div className="relative pt-1 w-full">
      <div className="flex mb-2 items-center justify-between">
        {!compact && (
          <div>
            {label && <span className="text-xs font-semibold inline-block text-gray-600">{label}</span>}
          </div>
        )}
        <div className="text-right">
          <span className={`text-xs font-semibold inline-block ${textColor}`}>
            {count}/{total}
          </span>
        </div>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-gray-200">
        <div
          style={{ width: `${progressPercentage}%` }}
          className={`${color} transition-all duration-300 shadow-none flex flex-col whitespace-nowrap justify-center`}
        ></div>
      </div>
    </div>
  );
  
  const renderDayCircles = () => {
    if (!showDayCircles) return null;
    
    const today = new Date();
    
    return (
      <div className="flex justify-between items-center mt-3 px-1">
        {dayStatus.map((day, index) => {
          const dayName = format(day.date, 'E')[0];
          const isToday = isSameDay(today, day.date);
          
          // Use lighter background colors for better emoji visibility
          let bgColor = 'bg-gray-100';
          let border = '';
          
          if (isToday) {
            border = 'border-2 border-gray-300';
          }
          
          if (day.isLifeHappens) {
            bgColor = 'bg-yellow-100';
          }
          
          if (day.isCompleted) {
            bgColor = `${color}/10`;
          }
          
          return (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center ${bgColor} ${border} transition-all duration-200`}
              >
                {(day.isCompleted || day.isLifeHappens) ? (
                  <WorkoutTypeIcon type={day.workoutType} />
                ) : (
                  <span className="text-xs font-medium text-gray-600">{dayName}</span>
                )}
              </div>
              
              {isToday && (
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full mt-0.5"></div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  if (hasError) {
    return (
      <div className="py-2 px-2 text-center rounded-md text-sm text-gray-500 bg-gray-50">
        Error loading workout data
      </div>
    );
  }
  
  return (
    <div className={`w-full ${compact ? 'py-0' : 'py-2'}`}>
      {showProgressBar && renderProgressBar()}
      {showDayCircles && renderDayCircles()}
    </div>
  );
};
