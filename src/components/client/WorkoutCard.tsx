import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { WorkoutTypeIcon } from './WorkoutTypeIcon';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Umbrella } from 'lucide-react';

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
  isLifeHappensPass?: boolean;
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
  exercises = [],
  isLifeHappensPass = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isCurrentUserCompleted = completed || 
    groupMembers.find(member => member.id === currentUserId)?.completed_workout_ids.includes(workoutId);

  return (
    <Card className={cn(
      "overflow-hidden transition-all shadow-lg",
      isCurrentUserCompleted 
        ? "bg-gray-50 dark:bg-gray-800/70" 
        : "bg-white dark:bg-gray-800 dark:border-gray-700"
    )}>
      <CardHeader className="px-3 py-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-client dark:text-blue-400">
            {isLifeHappensPass ? 
              <Umbrella className="h-4 w-4" /> : 
              <WorkoutTypeIcon type={type as any} />
            }
          </div>
          <CardTitle className="text-base dark:text-gray-100 flex-grow">
            {isLifeHappensPass ? "Life Happens Pass" : title}
          </CardTitle>
        </div>
        
        {groupMembers.length > 0 && (
          <div className="flex -space-x-1 items-center mt-1">
            <TooltipProvider>
              {groupMembers.map((member, index) => {
                const hasCompleted = member.completed_workout_ids.includes(workoutId);
                return (
                  <Tooltip key={member.id}>
                    <TooltipTrigger>
                      <Avatar className={cn(
                        "h-5 w-5 border-2 border-white dark:border-gray-700 relative",
                        !hasCompleted && "grayscale opacity-60",
                        "hover:translate-y-0.5 transition-transform"
                      )}
                      style={{
                        zIndex: groupMembers.length - index
                      }}>
                        {member.profile_picture_url && (
                          <AvatarImage src={member.profile_picture_url} alt={member.name} />
                        )}
                        <AvatarFallback className="bg-client/80 text-white text-xs">
                          {getMemberInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                      <p>{member.name} {hasCompleted ? '(Completed)' : '(Not Completed)'}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="px-3 pb-1 pt-0">
        {description && !isLifeHappensPass && (
          <p className="text-xs text-muted-foreground dark:text-gray-300">{description}</p>
        )}
        
        {isLifeHappensPass && (
          <p className="text-xs text-muted-foreground dark:text-gray-300">Workout credit used via Life Happens Pass</p>
        )}
        
        {exercises && exercises.length > 0 && !isLifeHappensPass && (
          <Collapsible
            open={isExpanded}
            onOpenChange={setIsExpanded}
            className="mt-1 space-y-1"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground dark:text-gray-300">
                {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
              </p>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  <span className="sr-only">Toggle exercises</span>
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent className="space-y-0.5">
              {exercises.map((exercise, index) => (
                <div 
                  key={exercise.id || index}
                  className="text-xs py-0.5 border-t first:border-t-0 border-gray-100 dark:border-gray-700"
                >
                  <p className="font-medium dark:text-gray-200">{exercise.title || exercise.exercise?.name}</p>
                  <p className="text-muted-foreground dark:text-gray-400">
                    {exercise.sets} {exercise.sets === 1 ? 'set' : 'sets'} × {exercise.reps}
                  </p>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
      
      <CardFooter className="p-2 flex flex-col gap-1">
        <Button 
          className={cn(
            "w-full h-10 py-2 text-sm outline-none focus:outline-none",
            isCurrentUserCompleted 
              ? "bg-gray-400 hover:bg-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200" 
              : "dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
          )}
          size="default"
          onClick={() => onStartWorkout(workoutId)}
          disabled={isCurrentUserCompleted}
        >
          {isCurrentUserCompleted ? 'Workout Completed' : 'Log Workout'}
        </Button>
      </CardFooter>
    </Card>
  );
};
