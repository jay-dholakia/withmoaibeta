import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { WorkoutTypeIcon } from './WorkoutTypeIcon';

interface GroupMember {
  id: string;
  name: string;
  profile_picture_url: string;
  completed_workout_ids: string[];
}

interface WorkoutCardProps {
  workoutId: string;
  title: string;
  description?: string;
  type?: string;
  groupMembers?: GroupMember[];
  currentUserId: string;
  onStartWorkout: (workoutId: string) => void;
  completed?: boolean;
  dayOfWeek?: number;
}

const getMemberInitials = (name: string): string => {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workoutId,
  title,
  description,
  type = 'strength',
  groupMembers = [],
  currentUserId,
  onStartWorkout,
  completed = false,
  dayOfWeek
}) => {
  const isCurrentUserCompleted = completed || 
    groupMembers.find(member => member.id === currentUserId)?.completed_workout_ids.includes(workoutId);

  const handleStartWorkout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onStartWorkout(workoutId);
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all rounded-lg border-none shadow-none",
      "bg-transparent",
      isCurrentUserCompleted ? "opacity-80" : ""
    )}>
      <CardHeader className="px-2 py-2 flex flex-row items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="text-client text-lg">
            <WorkoutTypeIcon type={type as any} />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        
        {groupMembers.length > 0 && (
          <div className="flex -space-x-2">
            <TooltipProvider>
              {groupMembers.map((member) => {
                const hasCompleted = member.completed_workout_ids.includes(workoutId);
                return (
                  <Tooltip key={member.id}>
                    <TooltipTrigger>
                      <Avatar className={cn(
                        "h-7 w-7 border-none",
                        !hasCompleted && "grayscale opacity-60"
                      )}>
                        {member.profile_picture_url && (
                          <AvatarImage src={member.profile_picture_url} alt={member.name} />
                        )}
                        <AvatarFallback className="bg-client/80 text-white text-xs">
                          {getMemberInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{member.name} {hasCompleted ? '(Completed)' : '(Not Completed)'}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="px-2 py-1">
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardContent>
      
      <CardFooter className="p-2 flex flex-col gap-2">
        <Button 
          className={cn(
            "w-full h-9 py-1 border-none shadow-none",
            isCurrentUserCompleted ? "bg-gray-400 hover:bg-gray-500" : "bg-transparent"
          )}
          size="sm"
          onClick={handleStartWorkout}
          disabled={isCurrentUserCompleted}
        >
          {isCurrentUserCompleted ? 'Workout Completed' : 'Log Workout'}
        </Button>
      </CardFooter>
    </Card>
  );
};
