import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { WorkoutTypeIcon } from './WorkoutTypeIcon';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
  exercises?: any[];
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
  dayOfWeek,
  exercises = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isCurrentUserCompleted = completed || 
    groupMembers.find(member => member.id === currentUserId)?.completed_workout_ids.includes(workoutId);

  const handleStartWorkout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onStartWorkout(workoutId);
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      isCurrentUserCompleted ? "bg-gray-50 border-gray-100" : "bg-white"
    )}>
      <CardHeader className="px-4 py-3 flex flex-row items-start justify-between">
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
                        "h-7 w-7 border-2 border-white",
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
      
      <CardContent className="px-4 pb-2">
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        
        {exercises && exercises.length > 0 && (
          <Collapsible
            open={isExpanded}
            onOpenChange={setIsExpanded}
            className="mt-2 space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
              </p>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span className="sr-only">Toggle exercises</span>
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent className="space-y-1">
              {exercises.map((exercise, index) => (
                <div 
                  key={exercise.id || index}
                  className="text-sm py-1 border-t first:border-t-0 border-gray-100"
                >
                  <p className="font-medium">{exercise.title || exercise.exercise?.name}</p>
                  <p className="text-muted-foreground">
                    {exercise.sets} {exercise.sets === 1 ? 'set' : 'sets'} × {exercise.reps}
                  </p>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
      
      <CardFooter className="p-3 flex flex-col gap-2">
        <Button 
          className={cn(
            "w-full h-9 py-1",
            isCurrentUserCompleted ? "bg-gray-400 hover:bg-gray-500" : ""
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
