
import React from 'react';
import { Flame } from 'lucide-react';
import { useFireBadges } from '@/hooks/useFireBadges';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FireBadgeProps {
  userId: string;
  className?: string;
}

export const FireBadge: React.FC<FireBadgeProps> = ({ userId, className }) => {
  const { badgeCount, isCurrentWeekEarned, isLoading } = useFireBadges(userId);

  if (isLoading || badgeCount === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "relative inline-flex items-center justify-center",
            className
          )}>
            <Flame 
              size={18} 
              className={cn(
                "text-amber-500 drop-shadow-sm",
                isCurrentWeekEarned ? "animate-pulse" : ""
              )} 
              fill={isCurrentWeekEarned ? "#f59e0b" : "none"} 
            />
            {badgeCount > 0 && (
              <span className="absolute -top-1 -right-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                {badgeCount}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs text-center">
            <span className="font-medium">
              {badgeCount} {badgeCount === 1 ? 'week' : 'weeks'} of completed workouts
            </span>
            <div>
              {isCurrentWeekEarned ? 
                <span>Completed all workouts this week! 🔥</span> : 
                <span>Has earned fire badges in the past</span>
              }
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
