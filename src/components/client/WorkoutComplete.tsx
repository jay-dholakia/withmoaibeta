
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkoutTypeIcon } from './WorkoutTypeIcon';
import { Check, RefreshCw, Edit, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWorkoutCompletionDetails } from '@/services/workout-history-service';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import EditWorkoutSetCompletions from './EditWorkoutSetCompletions';
import { getExerciseInfoByWorkoutExerciseId } from '@/services/workout-edit-service';

const WorkoutComplete = () => {
  const { workoutCompletionId } = useParams<{ workoutCompletionId: string }>();
  const [workout, setWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exerciseGroups, setExerciseGroups] = useState<Record<string, any>>({});
  const [editingExercises, setEditingExercises] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkoutDetails = async () => {
      if (!workoutCompletionId || !user) return;
      
      try {
        const workoutData = await fetchWorkoutCompletionDetails(workoutCompletionId);
        setWorkout(workoutData);
        
        // Organize exercises into groups
        if (workoutData.workout_set_completions && workoutData.workout_set_completions.length > 0) {
          await organizeExercises(workoutData.workout_set_completions);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching workout details:", error);
        toast.error("Failed to load workout details");
        setLoading(false);
      }
    };

    fetchWorkoutDetails();
  }, [workoutCompletionId, user]);

  const organizeExercises = async (setCompletions: any[]) => {
    try {
      const groups: Record<string, any> = {};
      
      for (const setCompletion of setCompletions) {
        const exerciseId = setCompletion.workout_exercise_id;
        
        if (!groups[exerciseId]) {
          // Get exercise information
          const exerciseInfo = await getExerciseInfoByWorkoutExerciseId(exerciseId);
          
          if (exerciseInfo) {
            groups[exerciseId] = {
              name: exerciseInfo.name,
              type: exerciseInfo.type,
              sets: []
            };
          } else {
            groups[exerciseId] = {
              name: 'Unknown Exercise',
              type: 'strength',
              sets: []
            };
          }
        }
        
        groups[exerciseId].sets.push(setCompletion);
      }
      
      setExerciseGroups(groups);
    } catch (error) {
      console.error("Error organizing exercises:", error);
    }
  };

  const handleEditExercises = () => {
    setEditingExercises(true);
  };

  const handleExercisesSaved = () => {
    toast.success("Workout has been updated");
    setEditingExercises(false);
    
    // Refresh workout data
    if (workoutCompletionId && user) {
      fetchWorkoutCompletionDetails(workoutCompletionId)
        .then(workoutData => {
          setWorkout(workoutData);
          if (workoutData.workout_set_completions && workoutData.workout_set_completions.length > 0) {
            organizeExercises(workoutData.workout_set_completions);
          }
        })
        .catch(error => {
          console.error("Error refreshing workout details:", error);
        });
    }
  };

  const handleFinishClick = () => {
    navigate('/client-dashboard/workouts');
  };

  const formatCompletedTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return "recently";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">Workout not found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="text-3xl">
                  {workout.workout_type && (
                    <WorkoutTypeIcon 
                      type={workout.workout_type as any} 
                      className="inline-block mr-2"
                    />
                  )}
                </div>
                {workout.title || workout.workout?.title || "Workout Complete"}
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Completed {formatCompletedTime(workout.completed_at)}
              </p>
            </div>

            <Button 
              variant="outline" 
              size="sm"
              onClick={handleEditExercises}
              className="flex items-center gap-1"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="inline-flex h-24 w-24 items-center justify-center rounded-full border-4 border-green-500 bg-green-50">
                <Check className="h-12 w-12 text-green-500" />
              </div>
            </div>
            
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl font-bold">Great job!</h2>
              <p className="text-muted-foreground">
                You've completed your workout
              </p>
            </div>
            
            {workout.notes && (
              <div className="mt-4">
                <h3 className="font-medium mb-1">Notes:</h3>
                <p className="text-sm">{workout.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Button 
        size="lg" 
        onClick={handleFinishClick}
        className="w-full h-14 text-lg"
      >
        Back to Workouts
        <ChevronRight className="ml-1 h-5 w-5" />
      </Button>

      {editingExercises && workout && (
        <EditWorkoutSetCompletions
          open={editingExercises}
          onOpenChange={setEditingExercises}
          workout={workout}
          exerciseGroups={exerciseGroups}
          onSave={handleExercisesSaved}
        />
      )}
    </div>
  );
};

export default WorkoutComplete;
