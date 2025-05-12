
import React from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkoutTypeIcon } from '../WorkoutTypeIcon';
import { CustomWorkout } from '@/services/clients/custom-workout/types';

interface WorkoutHeaderProps {
  workout: CustomWorkout;
  onBackClick: () => void;
}

export const WorkoutHeader: React.FC<WorkoutHeaderProps> = ({
  workout,
  onBackClick
}) => {
  return (
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onBackClick}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Workouts
      </Button>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold">{workout.title}</h1>
          {workout.workout_type && (
            <WorkoutTypeIcon 
              type={workout.workout_type as any} 
              className="text-xl"
            />
          )}
        </div>
        
        <div className="flex items-center text-muted-foreground mb-4">
          {workout.duration_minutes && (
            <div className="flex items-center mr-4">
              <Clock className="h-4 w-4 mr-1" />
              <span>{workout.duration_minutes} minutes</span>
            </div>
          )}
          <div>Created: {new Date(workout.created_at).toLocaleDateString()}</div>
        </div>
        
        {workout.description && (
          <p className="text-muted-foreground mb-6">{workout.description}</p>
        )}
      </div>
    </div>
  );
};
