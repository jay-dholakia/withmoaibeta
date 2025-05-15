
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Plus, Loader2, GripVertical } from 'lucide-react';
import { Exercise, StandaloneWorkout, WorkoutExercise } from '@/types/workout';
import { supabase } from '@/integrations/supabase/client';
import { syncTemplateExercisesToProgramWorkouts } from '@/services/program-service';
import ExerciseSelector from '@/components/exercise/ExerciseSelector';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { reorderStandaloneWorkoutExercises } from '@/services/workout/standalone-workouts';

const StandaloneWorkoutDetailsPage = () => {
  const navigate = useNavigate();
  const { workoutId } = useParams();
  const [workout, setWorkout] = useState<StandaloneWorkout | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
      }
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (workoutId) {
      fetchWorkoutDetails(workoutId);
    }
  }, [workoutId]);

  const fetchWorkoutDetails = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('standalone_workouts')
        .select(`
          *,
          workout_exercises:standalone_workout_exercises (
            *,
            exercise:exercise_id (*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setWorkout(data as StandaloneWorkout);
        setTitle(data.title);
        setDescription(data.description || '');
        
        const exercises = Array.isArray(data.workout_exercises) 
          ? data.workout_exercises 
          : [];
        
        // Sort exercises by order_index
        const sortedExercises = [...exercises].sort((a, b) => 
          (a.order_index || 0) - (b.order_index || 0)
        );
        
        setWorkoutExercises(sortedExercises as WorkoutExercise[]);
      }
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
    
      if (!userId) {
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
          coach_id: userId
        })
        .eq('id', workoutId);
      
      if (error) {
        throw error;
      }
      
      setWorkout(prev => prev ? { ...prev, title: title, description: description } : null);
      toast.success('Workout updated successfully');
    
      if (workoutId) {
        await syncTemplateExercisesToProgramWorkouts(workoutId);
        toast.success('Workout template updated and synced to program workouts');
      }
    
      navigate('/coach/standalone-workouts');
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
        .from('standalone_workout_exercises')
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

      if (data && data.length > 0) {
        setWorkoutExercises(prev => [...prev, data[0] as WorkoutExercise]);
        toast.success('Exercise added to workout');
      }
    } catch (error) {
      console.error('Error adding exercise to workout:', error);
      toast.error('Failed to add exercise to workout');
    }
  }, [workoutExercises, workoutId]);

  const handleUpdateExercise = async (updatedExercise: WorkoutExercise) => {
    try {
      const { error } = await supabase
        .from('standalone_workout_exercises')
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
        .from('standalone_workout_exercises')
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

  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    
    // If dropped outside the list or no movement
    if (!destination || 
        (source.index === destination.index && 
        source.droppableId === destination.droppableId)) {
      return;
    }
    
    // Create a copy of workout exercises
    const newExercises = Array.from(workoutExercises);
    
    // Remove the item from original position
    const [removed] = newExercises.splice(source.index, 1);
    
    // Insert at new position
    newExercises.splice(destination.index, 0, removed);
    
    // Update UI immediately (optimistic update)
    setWorkoutExercises(newExercises);
    
    if (!workoutId) return;
    
    // Prepare data for API
    const reorderData = newExercises.map((exercise, index) => ({
      id: exercise.id,
      order_index: index
    }));
    
    try {
      // Send the update to the server
      await reorderStandaloneWorkoutExercises(workoutId, reorderData);
      toast.success('Exercise order updated');
    } catch (error) {
      console.error('Error reordering exercises:', error);
      toast.error('Failed to update exercise order');
      // Revert the optimistic update on error
      fetchWorkoutDetails(workoutId);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>;
  }

  if (!workout) {
    return <div className="text-center py-8">Workout not found</div>;
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
            Manage the exercises in your workout. Drag and drop exercises to reorder them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleOpenExerciseDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Exercise
          </Button>

          <div className="mt-4">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="workout-exercises">
                {(provided) => (
                  <div 
                    className="space-y-4" 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {workoutExercises.map((exercise, index) => (
                      <Draggable 
                        key={exercise.id} 
                        draggableId={exercise.id} 
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`border rounded-md p-4 ${snapshot.isDragging ? 'bg-muted shadow-lg' : 'hover:bg-muted/50'}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex flex-1 space-x-2">
                                <div 
                                  {...provided.dragHandleProps} 
                                  className="cursor-grab"
                                >
                                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium">{exercise.exercise?.name}</div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {exercise.sets} sets × {exercise.reps} reps
                                    {exercise.rest_seconds && ` • ${exercise.rest_seconds}s rest`}
                                  </div>
                                  {exercise.notes && (
                                    <div className="mt-1 text-sm">{exercise.notes}</div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleUpdateExercise(exercise)}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeleteExercise(exercise)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </CardContent>
      </Card>

      {isEditDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto p-6">
            <h2 className="text-xl font-semibold mb-4">Select Exercise</h2>
            <ExerciseSelector onSelectExercise={handleExerciseSelect} />
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={handleCloseExerciseDialog}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StandaloneWorkoutDetailsPage;
