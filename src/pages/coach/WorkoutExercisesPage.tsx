
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronLeft, Plus, ArrowUp, ArrowDown, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { ExerciseSelector } from '@/components/coach/ExerciseSelector';
import { WorkoutExerciseForm } from '@/components/coach/WorkoutExerciseForm';
import { fetchWorkout, fetchWorkoutExercises, createWorkoutExercise, updateWorkoutExercise, deleteWorkoutExercise, moveWorkoutExerciseUp, moveWorkoutExerciseDown } from '@/services/workout-service';
import { Exercise } from '@/types/workout';
import { toast } from 'sonner';

const WorkoutExercisesPage = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  
  const [workout, setWorkout] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exerciseListExpanded, setExerciseListExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadWorkoutDetails = async () => {
      if (!workoutId) return;

      try {
        setIsLoading(true);
        
        const workoutData = await fetchWorkout(workoutId);
        if (workoutData) {
          setWorkout(workoutData);
          
          // Fetch any exercises for this workout
          const exercisesData = await fetchWorkoutExercises(workoutId);
          setExercises(exercisesData || []);
          
          const expandedState: Record<string, boolean> = {};
          exercisesData.forEach((exercise: any) => {
            expandedState[exercise.id] = true;
          });
          setExerciseListExpanded(expandedState);
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

    loadWorkoutDetails();
  }, [workoutId, navigate]);

  const toggleExerciseExpanded = (exerciseId: string) => {
    setExerciseListExpanded(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };

  const handleAddExercise = async (exerciseId: string, data: any) => {
    if (!workoutId) return;
    
    try {
      setIsSubmitting(true);
      
      await createWorkoutExercise({
        workout_id: workoutId,
        exercise_id: exerciseId,
        sets: data.sets,
        reps: data.reps,
        rest_seconds: data.rest_seconds,
        notes: data.notes,
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

  const handleUpdateExercise = async (exerciseId: string, data: any) => {
    if (!workoutId) return;
    
    try {
      setIsSubmitting(true);
      
      await updateWorkoutExercise(exerciseId, {
        sets: data.sets,
        reps: data.reps,
        rest_seconds: data.rest_seconds,
        notes: data.notes
      });
      
      const updatedExercises = await fetchWorkoutExercises(workoutId);
      setExercises(updatedExercises);
      
      toast.success('Exercise updated successfully');
    } catch (error) {
      console.error('Error updating exercise:', error);
      toast.error('Failed to update exercise');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
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
      
      const updatedExercises = await moveWorkoutExerciseUp(exerciseId, workoutId);
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
      
      const updatedExercises = await moveWorkoutExerciseDown(exerciseId, workoutId);
      setExercises(updatedExercises);
      
    } catch (error) {
      console.error('Error moving exercise down:', error);
      toast.error('Failed to reorder exercise');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectExercise = (exercise: Exercise) => {
    console.log("Exercise selected:", exercise);
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
          onClick={() => navigate(`/coach-dashboard/workouts/week/${workout?.week_id}`)}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Week
        </Button>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">{workout?.title || 'Workout Exercises'}</h1>
            <p className="text-muted-foreground">
              {workout?.workout_type ? `${workout.workout_type.charAt(0).toUpperCase() + workout.workout_type.slice(1)} workout` : 'Workout'} 
              {workout?.day_of_week ? ` - Day ${workout.day_of_week}` : ''}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(`/coach-dashboard/workouts/workout/${workoutId}/edit`)}
          >
            Edit Workout Details
          </Button>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Exercises</h2>
          <Button 
            onClick={() => setIsAddingExercise(true)} 
            disabled={isAddingExercise}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Exercise
          </Button>
        </div>

        {isAddingExercise && (
          <Card className="mb-6 bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Add Exercise</CardTitle>
            </CardHeader>
            <CardContent>
              <ExerciseSelector
                onSelectExercise={handleSelectExercise}
                onSelect={handleAddExercise}
                onCancel={() => setIsAddingExercise(false)}
                isSubmitting={isSubmitting}
              />
            </CardContent>
          </Card>
        )}
        
        {exercises.length === 0 ? (
          <div className="border border-dashed rounded-lg p-8 text-center">
            <p className="text-muted-foreground">No exercises added yet. Click "Add Exercise" to start building your workout.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exercises.map((exercise: any, index: number) => (
              <Card key={exercise.id} className="bg-background">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleExerciseExpanded(exercise.id)}>
                      {exerciseListExpanded[exercise.id] ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <CardTitle className="text-base">
                        {exercise.exercise?.name || 'Exercise'}
                      </CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleMoveExerciseUp(exercise.id)}
                        disabled={index === 0 || isSubmitting}
                      >
                        <ArrowUp className="h-4 w-4" />
                        <span className="sr-only">Move up</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleMoveExerciseDown(exercise.id)}
                        disabled={index === exercises.length - 1 || isSubmitting}
                      >
                        <ArrowDown className="h-4 w-4" />
                        <span className="sr-only">Move down</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteExercise(exercise.id)}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {exerciseListExpanded[exercise.id] && (
                  <CardContent>
                    <WorkoutExerciseForm
                      initialData={exercise}
                      onSubmit={(data) => handleUpdateExercise(exercise.id, data)}
                      isSubmitting={isSubmitting}
                    />
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </CoachLayout>
  );
};

export default WorkoutExercisesPage;
