import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ChevronLeft, Plus } from 'lucide-react';
import { 
  fetchWorkout, 
  fetchWorkoutExercises,
  createWorkoutExercise,
  deleteWorkoutExercise,
  moveWorkoutExerciseUp,
  moveWorkoutExerciseDown
} from '@/services/workout-service';
import { toast } from 'sonner';
import { ExerciseSelector } from '@/components/coach/ExerciseSelector';
import { Exercise } from '@/types/workout';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from '@/contexts/AuthContext';

const WorkoutExercisesPage = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [workout, setWorkout] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    setPageLoaded(true);
  }, []);

  useEffect(() => {
    const loadWorkoutDetails = async () => {
      if (!workoutId || !user) return;

      try {
        setIsLoading(true);
        console.log("Fetching workout data for ID:", workoutId);
        
        const workoutData = await fetchWorkout(workoutId);
        
        if (workoutData) {
          console.log("Workout data received:", workoutData);
          setWorkout(workoutData);
          
          const exercisesData = await fetchWorkoutExercises(workoutId);
          console.log("Exercises data received:", exercisesData);
          setExercises(exercisesData || []);
        } else {
          toast.error('Workout not found');
          navigate(-1);
        }
      } catch (error) {
        console.error('Error loading workout details:', error);
        toast.error('Failed to load workout details');
      } finally {
        setIsLoading(false);
      }
    };

    if (pageLoaded && user) {
      loadWorkoutDetails();
    }
  }, [workoutId, navigate, user, pageLoaded]);

  const handleBackClick = () => {
    navigate(`/workouts/${workoutId}/edit`);
  };

  const handleSaveExercise = async (exerciseId: string, data: any) => {
    if (!workoutId) return;
    
    try {
      setIsSubmitting(true);
      
      await createWorkoutExercise({
        workout_id: workoutId,
        exercise_id: exerciseId,
        sets: data.sets || 3,
        reps: data.reps || "8-12",
        rest_seconds: data.rest_seconds || 60,
        notes: data.notes || "",
        order_index: exercises.length
      });
      
      const updatedExercises = await fetchWorkoutExercises(workoutId);
      setExercises(updatedExercises);
      
      setIsAddingExercise(false);
      toast.success('Exercise added successfully');
    } catch (error) {
      console.error('Error adding exercise:', error);
      toast.error('Failed to add exercise');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExercise = async (exerciseId: string, workoutId: string) => {
    if (!workoutId) return;
    
    try {
      setIsSubmitting(true);
      
      await deleteWorkoutExercise(exerciseId);
      
      const updatedExercises = await fetchWorkoutExercises(workoutId);
      setExercises(updatedExercises);
      
      toast.success('Exercise removed from workout');
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast.error('Failed to remove exercise');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveExerciseUp = async (exerciseId: string) => {
    if (!workoutId) return;
    
    try {
      setIsSubmitting(true);
      
      await moveWorkoutExerciseUp(exerciseId, workoutId);
      
      const updatedExercises = await fetchWorkoutExercises(workoutId);
      setExercises(updatedExercises);
      
    } catch (error) {
      console.error('Error moving exercise up:', error);
      toast.error('Failed to reorder exercise');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveExerciseDown = async (exerciseId: string) => {
    if (!workoutId) return;
    
    try {
      setIsSubmitting(true);
      
      await moveWorkoutExerciseDown(exerciseId, workoutId);
      
      const updatedExercises = await fetchWorkoutExercises(workoutId);
      setExercises(updatedExercises);
      
    } catch (error) {
      console.error('Error moving exercise down:', error);
      toast.error('Failed to reorder exercise');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <CoachLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout>
      <div className="container mx-auto px-4 py-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="mb-6 gap-1" 
          onClick={handleBackClick}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Workout
        </Button>

        <h1 className="text-2xl font-bold mb-6">
          Manage Exercises for {workout?.title || 'Workout'}
        </h1>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Exercises</CardTitle>
            <Button 
              onClick={() => setIsAddingExercise(true)}
              size="sm"
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Exercise
            </Button>
          </CardHeader>
          <CardContent>
            {exercises.length > 0 ? (
              <div className="space-y-4">
                {exercises.map((exercise: any, index: number) => (
                  <div key={exercise.id} className="border p-4 rounded-md shadow-sm">
                    <div className="flex flex-col gap-4">
                      <div>
                        <h3 className="font-medium">{index + 1}. {exercise.exercise?.name || 'Exercise'}</h3>
                        <div className="text-sm text-muted-foreground mt-1">
                          {exercise.sets} sets × {exercise.reps} reps
                          {exercise.rest_seconds ? ` (${exercise.rest_seconds}s rest)` : ''}
                        </div>
                        {exercise.notes && (
                          <div className="text-sm mt-2 border-l-2 pl-2 border-muted">{exercise.notes}</div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 w-full sm:w-40">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleMoveExerciseUp(exercise.id)}
                          disabled={index === 0 || isSubmitting}
                          className="w-full"
                        >
                          Move Up
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleMoveExerciseDown(exercise.id)}
                          disabled={index === exercises.length - 1 || isSubmitting}
                          className="w-full"
                        >
                          Move Down
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteExercise(exercise.id, workoutId as string)}
                          disabled={isSubmitting}
                          className="w-full"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No exercises added yet</p>
                <p className="mt-2">Click the "Add Exercise" button to start building your workout</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddingExercise} onOpenChange={(open) => !open && setIsAddingExercise(false)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Exercise to Workout</DialogTitle>
          </DialogHeader>
          <ExerciseSelector
            onSelectExercise={() => {}} // We're using the legacy onSelect flow
            onSelect={handleSaveExercise}
            onCancel={() => setIsAddingExercise(false)}
            isSubmitting={isSubmitting}
            buttonText="Add Exercise"
          />
        </DialogContent>
      </Dialog>
    </CoachLayout>
  );
};

export default WorkoutExercisesPage;
