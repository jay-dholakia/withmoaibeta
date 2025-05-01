
import React from 'react';
import { Flame } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FireBadgeProps {
  count: number;
  isCurrentWeekEarned?: boolean;
}

export const FireBadge: React.FC<FireBadgeProps> = ({ count, isCurrentWeekEarned }) => {
  if (count === 0) return null;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            <div className="flex items-center">
              <Flame 
                className={`h-4 w-4 text-orange-500 ${isCurrentWeekEarned ? 'animate-pulse' : ''}`} 
                fill={isCurrentWeekEarned ? 'rgba(249, 115, 22, 0.5)' : 'none'}
              />
              {count > 1 && (
                <span className="ml-0.5 text-xs font-medium text-orange-500">
                  {count}
                </span>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
          <p className="text-sm">
            {count} {count === 1 ? 'week' : 'weeks'} of completing all assigned workouts
            {isCurrentWeekEarned ? ' (including this week)' : ''}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Badges are awarded automatically at the end of each week
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
