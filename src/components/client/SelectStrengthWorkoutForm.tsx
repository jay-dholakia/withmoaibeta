
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAssignedWorkouts } from '@/services/workout-history-service';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';
import { WorkoutHistoryItem } from '@/types/workout';
import { createWorkoutCompletion } from '@/services/workout-history-service';

interface SelectStrengthWorkoutFormProps {
  onComplete: () => void;
}

const SelectStrengthWorkoutForm: React.FC<SelectStrengthWorkoutFormProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const { data: assignedWorkouts, isLoading, error } = useQuery({
    queryKey: ['assigned-workouts', user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return fetchAssignedWorkouts(user.id);
    },
    enabled: !!user?.id,
  });

  // Filter for only strength/mobility workouts that haven't been completed yet
  const availableWorkouts = assignedWorkouts?.filter(workout => 
    !workout.completed_at && 
    workout.workout?.workout_type && 
    ['strength', 'bodyweight', 'flexibility', 'mobility'].includes(workout.workout.workout_type)
  ) || [];

  const startWorkout = async (workout: WorkoutHistoryItem) => {
    if (!user?.id || !workout.workout_id) {
      toast.error('Missing required information to start workout');
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, [workout.workout_id]: true }));
      
      const completion = await createWorkoutCompletion(
        user.id,
        workout.workout_id
      );
      
      if (completion) {
        // Invalidate related queries to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['weekly-run-progress'] });
        
        toast.success('Workout started');
        navigate(`/client-dashboard/workouts/active/${completion.id}`);
        onComplete();
      } else {
        toast.error('Failed to start workout');
        setLoading(prev => ({ ...prev, [workout.workout_id]: false }));
      }
    } catch (error) {
      console.error('Error starting workout:', error);
      toast.error('Failed to start workout');
      setLoading(prev => ({ ...prev, [workout.workout_id]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        <p className="mt-2 text-muted-foreground">Loading available workouts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>Failed to load workouts</p>
        <Button onClick={onComplete} className="mt-4">Close</Button>
      </div>
    );
  }

  if (availableWorkouts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No strength/mobility workouts available.</p>
        <p className="text-muted-foreground mb-4">Would you like to create a custom workout instead?</p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={onComplete}>
            Cancel
          </Button>
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <Link to="/client-dashboard/workouts/create" onClick={onComplete}>
              Create Workout
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <p className="text-sm text-center mb-4">Select a strength/mobility workout to complete:</p>
      
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {availableWorkouts.map((workout) => (
          <Card key={workout.workout_id} className="hover:border-purple-200">
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{workout.workout?.title || 'Untitled Workout'}</h4>
                  {workout.workout?.week?.week_number && (
                    <p className="text-xs text-muted-foreground">
                      Week {workout.workout.week.week_number}
                      {workout.workout.week.program?.title && ` - ${workout.workout.week.program.title}`}
                    </p>
                  )}
                </div>
                <Button 
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={loading[workout.workout_id]}
                  onClick={() => startWorkout(workout)}
                >
                  {loading[workout.workout_id] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Start <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onComplete}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default SelectStrengthWorkoutForm;
