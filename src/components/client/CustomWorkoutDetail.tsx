
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  fetchCustomWorkouts,
  fetchCustomWorkoutExercises,
  deleteCustomWorkout,
  moveCustomWorkoutExerciseUp,
  moveCustomWorkoutExerciseDown,
  CustomWorkout,
  CustomWorkoutExercise
} from '@/services/client-custom-workout-service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { completeCustomWorkout } from '@/services/workout-history-service';

const CustomWorkoutDetail = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<CustomWorkout | null>(null);
  const [exercises, setExercises] = useState<CustomWorkoutExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    const loadWorkoutDetails = async () => {
      if (!workoutId) return;
      
      try {
        setIsLoading(true);
        
        // Fetch workout details
        const workouts = await fetchCustomWorkouts();
        const currentWorkout = workouts.find(w => w.id === workoutId);
        
        if (!currentWorkout) {
          toast.error('Workout not found');
          navigate('/client-dashboard/workouts');
          return;
        }
        
        setWorkout(currentWorkout);
        
        // Fetch workout exercises
        const exercisesData = await fetchCustomWorkoutExercises(workoutId);
        setExercises(exercisesData);
      } catch (error) {
        console.error('Error loading workout details:', error);
        toast.error('Failed to load workout details');
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkoutDetails();
  }, [workoutId, navigate]);

  const handleDeleteWorkout = async () => {
    if (!workoutId) return;
    
    try {
      setIsDeleting(true);
      await deleteCustomWorkout(workoutId);
      toast.success('Workout deleted successfully');
      navigate('/client-dashboard/workouts');
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast.error('Failed to delete workout');
      setIsDeleting(false);
    }
  };

  const handleMoveExerciseUp = async (exerciseId: string) => {
    if (!workoutId) return;
    
    try {
      setIsReordering(true);
      const updatedExercises = await moveCustomWorkoutExerciseUp(exerciseId, workoutId);
      setExercises(updatedExercises);
    } catch (error) {
      console.error('Error moving exercise up:', error);
      toast.error('Failed to reorder exercise');
    } finally {
      setIsReordering(false);
    }
  };

  const handleMoveExerciseDown = async (exerciseId: string) => {
    if (!workoutId) return;
    
    try {
      setIsReordering(true);
      const updatedExercises = await moveCustomWorkoutExerciseDown(exerciseId, workoutId);
      setExercises(updatedExercises);
    } catch (error) {
      console.error('Error moving exercise down:', error);
      toast.error('Failed to reorder exercise');
    } finally {
      setIsReordering(false);
    }
  };

  const handleCompleteWorkout = async () => {
    if (!workoutId) return;
    
    try {
      setIsCompleting(true);
      await completeCustomWorkout(workoutId);
      toast.success('Workout marked as completed');
      navigate('/client-dashboard/workouts');
    } catch (error) {
      console.error('Error completing workout:', error);
      toast.error('Failed to complete workout');
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading workout details...</p>
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="text-center py-12">
        <p>Workout not found</p>
        <Button 
          variant="link" 
          onClick={() => navigate('/client-dashboard/workouts')}
          className="mt-4"
        >
          Return to Workouts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/client-dashboard/workouts')}
          className="border border-gray-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workouts
        </Button>
        
        <div className="flex space-x-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive border-destructive/30">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this workout template.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteWorkout}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button 
            variant="default" 
            onClick={handleCompleteWorkout}
            disabled={isCompleting}
          >
            {isCompleting ? 'Completing...' : 'Complete Workout'}
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{workout.title}</h1>
        
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-muted-foreground">
          {workout.workout_type && (
            <div className="flex items-center">
              <span className="capitalize">{workout.workout_type.replace('_', ' ')}</span>
            </div>
          )}
          
          {workout.duration_minutes && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{workout.duration_minutes} min</span>
            </div>
          )}
          
          {workout.workout_date && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{format(new Date(workout.workout_date), 'PPP')}</span>
            </div>
          )}
        </div>
        
        {workout.description && (
          <p className="mt-4 text-muted-foreground">{workout.description}</p>
        )}
      </div>

      <Separator />
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Exercises</h2>
        
        {exercises.length === 0 ? (
          <div className="text-center py-6 bg-muted/30 rounded-md">
            <p className="text-muted-foreground">No exercises added to this workout.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {exercises.map((exercise, index) => {
              const exerciseName = exercise.exercise?.name || exercise.custom_exercise_name || 'Unknown Exercise';
              
              return (
                <Card key={exercise.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{exerciseName}</h3>
                      
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={index === 0 || isReordering}
                          onClick={() => handleMoveExerciseUp(exercise.id)}
                        >
                          <ArrowUp className="h-4 w-4" />
                          <span className="sr-only">Move up</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={index === exercises.length - 1 || isReordering}
                          onClick={() => handleMoveExerciseDown(exercise.id)}
                        >
                          <ArrowDown className="h-4 w-4" />
                          <span className="sr-only">Move down</span>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {exercise.sets && exercise.reps && (
                        <p>
                          {exercise.sets} {exercise.sets === 1 ? 'set' : 'sets'} of {exercise.reps} {exercise.reps === '1' ? 'rep' : 'reps'}
                          {exercise.rest_seconds && ` with ${exercise.rest_seconds}s rest`}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomWorkoutDetail;
