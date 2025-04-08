
import React from 'react';
import { format } from 'date-fns';
import { WorkoutHistoryItem, StandardWorkoutType } from '@/types/workout';
import { WorkoutTypeIcon } from './WorkoutTypeIcon';
import { detectWorkoutTypeFromText } from '@/services/workout-edit-service';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteWorkoutCompletion } from '@/services/workout-edit-service';
import { toast } from 'sonner';

interface WorkoutDayDetailsProps {
  date: Date;
  workouts: WorkoutHistoryItem[];
  onWorkoutDeleted?: () => void;
}

export const WorkoutDayDetails = ({ 
  date, 
  workouts,
  onWorkoutDeleted
}: WorkoutDayDetailsProps) => {
  const formattedDate = format(date, 'EEEE, MMMM d, yyyy');
  
  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      const success = await deleteWorkoutCompletion(workoutId);
      if (success) {
        toast.success("Workout completion removed");
        if (onWorkoutDeleted) {
          onWorkoutDeleted();
        }
      } else {
        toast.error("Failed to remove workout completion");
      }
    } catch (error) {
      console.error("Error deleting workout:", error);
      toast.error("An error occurred while removing the workout");
    }
  };
  
  return (
    <div>
      <h3 className="font-semibold">{formattedDate}</h3>
      
      <div className="space-y-4 mt-3">
        {workouts.map((workout, index) => {
          // Determine workout type
          let workoutType = workout.workout?.workout_type || '';
          if (!workoutType && workout.title) {
            workoutType = detectWorkoutTypeFromText(workout.title);
          } else if (!workoutType) {
            // Default to strength if no type could be detected
            workoutType = 'strength' as StandardWorkoutType;
          }
          
          return (
            <div key={workout.id || index} className="border rounded-md p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <WorkoutTypeIcon 
                      type={workoutType as StandardWorkoutType} 
                      className="h-5 w-5"
                    />
                  </div>
                  
                  <div>
                    <h4 className="font-medium">
                      {workout.title || workout.workout?.title || 'Workout'}
                    </h4>
                    
                    {workout.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {workout.description}
                      </p>
                    )}
                    
                    {workout.notes && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Notes: </span>
                        <span className="text-muted-foreground">{workout.notes}</span>
                      </div>
                    )}
                    
                    {workout.completed_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Completed: {format(new Date(workout.completed_at), 'PPp')}
                      </p>
                    )}
                  </div>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleDeleteWorkout(workout.id)}
                  title="Remove completion"
                  className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
