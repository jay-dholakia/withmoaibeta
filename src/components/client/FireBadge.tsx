
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
                fill="#f97316" // Changed to solid orange fill for all cases
              />
              {count > 1 && (
                <span className="ml-0.5 text-xs font-medium text-orange-500 translate-y-[0.5px]">
                  {count}
                </span>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
          <p className="text-sm">
            {count} {count === 1 ? 'week' : 'weeks'} of logging activities on 5+ days
            {isCurrentWeekEarned ? ' (including this week)' : ''}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Fire badges are earned by logging workouts on at least 5 different days in a week
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
