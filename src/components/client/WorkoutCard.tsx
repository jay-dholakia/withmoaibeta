
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Bike, Run, Dumbbell, Shirt } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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
  type?: 'run' | 'bike' | 'swim' | 'strength';
  groupMembers?: GroupMember[];
  currentUserId: string;
  onStartWorkout: (workoutId: string) => void;
  completed?: boolean;
}

export const WorkoutTypeIcon: React.FC<{ type?: string; className?: string }> = ({ type, className }) => {
  switch (type?.toLowerCase()) {
    case 'run':
      return <Run className={cn("h-5 w-5", className)} />;
    case 'bike':
    case 'cycling':
      return <Bike className={cn("h-5 w-5", className)} />;
    case 'swim':
    case 'swimming':
      return <Shirt className={cn("h-5 w-5", className)} />;
    default:
      return <Dumbbell className={cn("h-5 w-5", className)} />;
  }
};

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workoutId,
  title,
  description,
  type = 'strength',
  groupMembers = [],
  currentUserId,
  onStartWorkout,
  completed = false
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
      "overflow-hidden transition-all",
      isCurrentUserCompleted ? "bg-gray-50 border-gray-100" : "bg-white"
    )}>
      <CardHeader className="px-4 py-3 flex flex-row items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="text-client">
            <WorkoutTypeIcon type={type} />
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
                        <AvatarImage src={member.profile_picture_url} alt={member.name} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
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
      
      <CardContent className="px-4 py-2">
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardContent>
      
      <CardFooter className="p-3">
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
