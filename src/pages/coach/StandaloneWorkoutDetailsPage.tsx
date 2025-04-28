import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Plus, Loader2 } from 'lucide-react';
import { Exercise, StandaloneWorkout, WorkoutExercise } from '@/types/workout';
import { supabase } from '@/integrations/supabase/client';
import ExerciseSearchDialog from '@/components/exercise/ExerciseSearchDialog';
import WorkoutExerciseCard from '@/components/workout/WorkoutExerciseCard';
import { reorderWorkoutExercises } from '@/services/workout-service';
import { useUser } from '@/providers/UserProvider';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { syncTemplateExercisesToProgramWorkouts } from '@/services/program-service';

const StandaloneWorkoutDetailsPage = () => {
  const router = useRouter();
  const { workoutId } = router.query;
  const [workout, setWorkout] = useState<StandaloneWorkout | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    if (workoutId) {
      fetchWorkoutDetails(workoutId as string);
    }
  }, [workoutId]);

  const fetchWorkoutDetails = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('standalone_workouts')
        .select(`
          *,
          workout_exercises (
            *,
            exercise:exercise_id (*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      setWorkout(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setWorkoutExercises(data.workout_exercises || []);
    } catch (error) {
      console.error('Error fetching workout details:', error);
      toast.error('Failed to load workout details');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleSaveWorkout = async () => {
    try {
      setIsSaving(true);
    
      if (!user?.id) {
        toast.error('You must be logged in to save a workout.');
        return;
      }
      
      if (!title) {
        toast.error('Title is required');
        return;
      }
      
      if (!workoutId) {
        toast.error('Workout ID is missing');
        return;
      }
      
      const { error } = await supabase
        .from('standalone_workouts')
        .update({
          title: title,
          description: description,
          coach_id: user.id
        })
        .eq('id', workoutId);
      
      if (error) {
        throw error;
      }
      
      setWorkout({ ...workout, title: title, description: description });
      toast.success('Workout updated successfully');
    
      // After successful save, sync exercises to program workouts
      if (workoutId) {
        await syncTemplateExercisesToProgramWorkouts(workoutId as string);
        toast.success('Workout template updated and synced to program workouts');
      }
    
      router.push('/coach/standalone-workouts');
    } catch (error) {
      console.error('Error saving workout:', error);
      toast.error('Failed to save workout');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenExerciseDialog = () => {
    setIsEditDialogOpen(true);
  };

  const handleCloseExerciseDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedExercise(null);
  };

  const handleExerciseSelect = useCallback(async (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsEditDialogOpen(false);

    if (!workoutId) {
      toast.error('Workout ID is missing');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('workout_exercises')
        .insert([
          {
            workout_id: workoutId,
            exercise_id: exercise.id,
            sets: 3,
            reps: '8-12',
            rest_seconds: 60,
            order_index: workoutExercises.length,
          },
        ])
        .select(`
          *,
          exercise:exercise_id (*)
        `);

      if (error) {
        throw error;
      }

      setWorkoutExercises([...workoutExercises, data[0]]);
      toast.success('Exercise added to workout');
    } catch (error) {
      console.error('Error adding exercise to workout:', error);
      toast.error('Failed to add exercise to workout');
    }
  }, [workoutExercises, workoutId]);

  const handleUpdateExercise = async (updatedExercise: WorkoutExercise) => {
    try {
      const { error } = await supabase
        .from('workout_exercises')
        .update(updatedExercise)
        .eq('id', updatedExercise.id);

      if (error) {
        throw error;
      }

      setWorkoutExercises(
        workoutExercises.map((exercise) =>
          exercise.id === updatedExercise.id ? updatedExercise : exercise
        )
      );
      toast.success('Exercise updated successfully');
    } catch (error) {
      console.error('Error updating exercise:', error);
      toast.error('Failed to update exercise');
    }
  };

  const handleDeleteExercise = async (exerciseToDelete: WorkoutExercise) => {
    try {
      const { error } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('id', exerciseToDelete.id);

      if (error) {
        throw error;
      }

      setWorkoutExercises(
        workoutExercises.filter((exercise) => exercise.id !== exerciseToDelete.id)
      );
      toast.success('Exercise deleted successfully');
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast.error('Failed to delete exercise');
    }
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(workoutExercises);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Optimistically update the state
    setWorkoutExercises(items);

    try {
      // Call the reorderExercises function to update the order_index in the database
      await reorderWorkoutExercises(items, workoutId as string);
      toast.success('Workout exercises reordered successfully');
    } catch (error) {
      console.error('Error reordering exercises:', error);
      toast.error('Failed to reorder exercises');
      // If there's an error, revert the state to the original order
      fetchWorkoutDetails(workoutId as string);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!workout) {
    return <div>Workout not found</div>;
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Edit Standalone Workout</CardTitle>
          <CardDescription>
            Update the details of your standalone workout.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Workout Title"
              value={title}
              onChange={handleTitleChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Workout Description"
              value={description}
              onChange={handleDescriptionChange}
            />
          </div>
          <Button disabled={isSaving} onClick={handleSaveWorkout}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Workout'
            )}
          </Button>
        </CardContent>
      </Card>

      <Separator className="my-4" />

      <Card>
        <CardHeader>
          <CardTitle>Exercises</CardTitle>
          <CardDescription>
            Manage the exercises in your workout.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleOpenExerciseDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Exercise
          </Button>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="exercises">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {workoutExercises.map((exercise, index) => (
                    <Draggable key={exercise.id} draggableId={exercise.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <WorkoutExerciseCard
                            exercise={exercise}
                            onUpdate={handleUpdateExercise}
                            onDelete={handleDeleteExercise}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </CardContent>
      </Card>

      <ExerciseSearchDialog
        open={isEditDialogOpen}
        onClose={handleCloseExerciseDialog}
        onExerciseSelect={handleExerciseSelect}
      />
    </div>
  );
};

export default StandaloneWorkoutDetailsPage;
