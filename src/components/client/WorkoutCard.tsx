
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
          <div className="flex -space-x-1 items-center mt-2">
            <TooltipProvider>
              {groupMembers.map((member, index) => {
                const hasCompleted = member.completed_workout_ids.includes(workoutId);
                return (
                  <Tooltip key={member.id}>
                    <TooltipTrigger>
                      <Avatar className={cn(
                        "h-6 w-6 border-2 border-white dark:border-gray-700 relative",
                        !hasCompleted && "grayscale opacity-60",
                        "hover:translate-y-0.5 transition-transform"
                      )}
                      style={{
                        zIndex: groupMembers.length - index
                      }}>
                        {member.profile_picture_url && (
                          <AvatarImage src={member.profile_picture_url} alt={member.name} />
                        )}
                        <AvatarFallback className="bg-muted-foreground/20 text-foreground">
                          {getMemberInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent className="py-1 px-2" side="top">
                      <p className="text-xs">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {hasCompleted ? 'Completed' : 'Not completed'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="px-3 pb-0">
        {description && (
          <Collapsible open={isExpanded}>
            <CollapsibleContent>
              <p className="text-sm text-muted-foreground pb-3">{description}</p>
            </CollapsibleContent>
            {description.length > 0 && (
              <CollapsibleTrigger 
                className="text-xs text-muted-foreground hover:text-foreground flex items-center py-1 w-full justify-center"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" /> Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" /> Show More
                  </>
                )}
              </CollapsibleTrigger>
            )}
          </Collapsible>
        )}
        
        {exercises && exercises.length > 0 && (
          <div className="pb-3">
            <p className="text-xs text-muted-foreground mb-1">
              {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
            </p>
            <div className="flex flex-wrap gap-1">
              {exercises.slice(0, 3).map((exercise) => (
                <div key={exercise.id} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  {exercise.exercise?.name || 'Exercise'}
                </div>
              ))}
              {exercises.length > 3 && (
                <div className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                  +{exercises.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="px-3 py-3 pt-2 border-t border-border/50">
        <Button 
          onClick={() => onStartWorkout(workoutId)} 
          className="w-full" 
          variant={isCurrentUserCompleted ? "secondary" : "default"}
          size="sm"
        >
          {isCurrentUserCompleted ? "View Completed" : "Start Workout"}
        </Button>
      </CardFooter>
    </Card>
  );
};
