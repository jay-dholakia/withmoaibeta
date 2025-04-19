
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { 
  fetchWorkoutCompletion, 
  updateWorkoutCompletion, 
  completeWorkoutCompletion 
} from '@/services/workout-completion-service';
import { fetchWorkoutExercises } from '@/services/workout-service';
import { Exercise } from '@/types/workout';
import { toast } from 'sonner';
import { CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExerciseSwapDialog } from './ExerciseSwapDialog';

interface WorkoutExerciseWithExercise {
  id: string;
  exercise: Exercise;
  sets: number;
  reps: string;
  notes?: string;
}

const ActiveWorkout = () => {
  const { workoutCompletionId } = useParams<{ workoutCompletionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [exercises, setExercises] = useState<WorkoutExerciseWithExercise[]>([]);
  const [workoutCompletion, setWorkoutCompletion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showSwapDialog, setShowSwapDialog] = useState(false);
  const [selectedExerciseForSwap, setSelectedExerciseForSwap] = useState<Exercise | null>(null);

  useEffect(() => {
    const loadWorkoutDetails = async () => {
      if (!workoutCompletionId || !user) return;

      try {
        setIsLoading(true);
        
        console.log(`Loading workout completion: ${workoutCompletionId}`);
        const completionData = await fetchWorkoutCompletion(workoutCompletionId);
        console.log('Completion data:', completionData);
        setWorkoutCompletion(completionData);
        
        if (!completionData.workout_id) {
          console.error('No workout_id found in completion data');
          toast.error('Invalid workout data');
          navigate('/client-dashboard/workouts');
          return;
        }
        
        console.log(`Loading workout exercises for: ${completionData.workout_id}`);
        const exercisesData = await fetchWorkoutExercises(completionData.workout_id);
        console.log('Exercises data:', exercisesData);
        setExercises(exercisesData || []);
        
        // Initialize progress to 0 by default
        // We can't store progress in the database directly, so we'll track it in component state
        // Try to parse progress from notes if available
        if (completionData.notes && completionData.notes.includes('Progress:')) {
          const progressMatch = completionData.notes.match(/Progress: (\d+)%/);
          if (progressMatch && progressMatch[1]) {
            setProgress(parseInt(progressMatch[1], 10));
          }
        } else {
          setProgress(0);
        }
      } catch (error) {
        console.error('Error loading workout details:', error);
        toast.error('Failed to load workout details');
        navigate('/client-dashboard/workouts');
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkoutDetails();
  }, [workoutCompletionId, navigate, user]);

  const handleSetCompletion = async (exerciseId: string) => {
    if (!workoutCompletionId) return;
    
    try {
      const updatedProgress = progress + (1 / exercises.length) * 100;
      setProgress(updatedProgress);
      
      await updateWorkoutCompletion(workoutCompletionId, {
        progress: updatedProgress
      });
      
      toast.success('Exercise marked as complete');
    } catch (error) {
      console.error('Error updating workout completion:', error);
      toast.error('Failed to update workout completion');
    }
  };

  const handleCompleteWorkout = async () => {
    if (!workoutCompletionId) return;
    
    try {
      setIsCompleting(true);
      
      await completeWorkoutCompletion(workoutCompletionId);
      
      toast.success('Workout completed successfully!');
      navigate(`/client-dashboard/workouts/complete/${workoutCompletionId}`);
    } catch (error) {
      console.error('Error completing workout:', error);
      toast.error('Failed to complete workout');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSwapClick = (exercise: Exercise) => {
    setSelectedExerciseForSwap(exercise);
    setShowSwapDialog(true);
  };

  const handleSwapSelect = async (newExercise: Exercise) => {
    if (!selectedExerciseForSwap) return;
    
    try {
      // Update the exercise in the workout
      const updatedExercises = exercises.map(ex =>
        ex.exercise.id === selectedExerciseForSwap.id ? { ...ex, exercise: newExercise } : ex
      );
      setExercises(updatedExercises);
      
      setShowSwapDialog(false);
      setSelectedExerciseForSwap(null);
      
      toast.success('Exercise swapped successfully');
    } catch (error) {
      console.error('Error swapping exercise:', error);
      toast.error('Failed to swap exercise');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">
          {workoutCompletion?.workout?.title || 'Active Workout'}
        </h1>
        
        <Progress value={progress} className="mb-4" />
        
        <div className="space-y-4">
          {exercises.map((exercise) => (
            <Card key={exercise.id}>
              <CardHeader>
                <CardTitle>{exercise.exercise?.name || 'Exercise'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Sets: {exercise.sets}</p>
                <p>Reps: {exercise.reps}</p>
                {exercise.notes && <p>Notes: {exercise.notes}</p>}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button onClick={() => handleSetCompletion(exercise.id)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSwapClick(exercise.exercise)}
                >
                  Swap
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <Button 
          className={cn("mt-8 w-full", isCompleting ? "cursor-not-allowed" : "")}
          onClick={handleCompleteWorkout}
          disabled={isCompleting}
        >
          {isCompleting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Completing...
            </>
          ) : (
            'Complete Workout'
          )}
        </Button>
      </div>
      
      {selectedExerciseForSwap && (
        <ExerciseSwapDialog
          open={showSwapDialog}
          onOpenChange={setShowSwapDialog}
          currentExercise={selectedExerciseForSwap}
          onSwapSelect={handleSwapSelect}
        />
      )}
    </>
  );
};

export default ActiveWorkout;
