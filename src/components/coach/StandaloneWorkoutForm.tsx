import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { DAYS_OF_WEEK } from "@/types/workout";
import { ExerciseSelector } from './ExerciseSelector';
import { WorkoutExerciseForm } from './WorkoutExerciseForm';
import { toast } from "sonner";
import { 
  createStandaloneWorkout, 
  updateStandaloneWorkout,
  fetchStandaloneWorkout,
  createStandaloneWorkoutExercise,
  fetchStandaloneWorkoutExercises,
  updateStandaloneWorkoutExercise,
  deleteStandaloneWorkoutExercise,
  moveStandaloneWorkoutExerciseUp,
  moveStandaloneWorkoutExerciseDown
} from '@/services/workout-service';
import { useAuth } from '@/contexts/AuthContext';

interface StandaloneWorkoutFormProps {
  workoutId?: string;
  onSave: (workoutId: string) => void;
  onCancel: () => void;
  mode?: 'create' | 'edit';
}

const StandaloneWorkoutForm: React.FC<StandaloneWorkoutFormProps> = ({
  workoutId,
  onSave,
  onCancel,
  mode = 'create'
}) => {
  const { user } = useAuth();
  const isEdit = mode === 'edit';
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [workoutType, setWorkoutType] = useState('strength');
  
  const [exercises, setExercises] = useState<any[]>([]);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEdit);
  
  useEffect(() => {
    if (workoutId && isEdit) {
      loadWorkoutDetails();
    }
  }, [workoutId, isEdit]);
  
  const loadWorkoutDetails = async () => {
    if (!workoutId) return;
    
    try {
      setIsLoading(true);
      
      const workout = await fetchStandaloneWorkout(workoutId);
      setTitle(workout.title);
      setDescription(workout.description || '');
      setCategory(workout.category || '');
      setWorkoutType(workout.workout_type || 'strength');
      
      if (workout.workout_exercises && workout.workout_exercises.length > 0) {
        setExercises(workout.workout_exercises);
      } else {
        const workoutExercises = await fetchStandaloneWorkoutExercises(workoutId);
        setExercises(workoutExercises);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading workout details:', error);
      toast.error('Failed to load workout details');
      setIsLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      toast.error('Please enter a workout title');
      return;
    }
    
    if (!user) {
      toast.error('You need to be logged in to create a workout');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      let savedWorkoutId = workoutId;
      
      if (isEdit && workoutId) {
        await updateStandaloneWorkout(workoutId, {
          title,
          description: description || null,
          category: category || null,
          workout_type: workoutType
        });
      } else {
        const workout = await createStandaloneWorkout({
          title,
          description: description || null,
          coach_id: user.id,
          category: category || undefined,
          workout_type: workoutType
        });
        
        savedWorkoutId = workout.id;
      }
      
      if (savedWorkoutId) {
        onSave(savedWorkoutId);
      }
      
      toast.success(isEdit ? 'Workout template updated successfully' : 'Workout template created successfully');
    } catch (error) {
      console.error('Error saving workout template:', error);
      toast.error('Failed to save workout template');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddExercise = async (exerciseId: string, data: any) => {
    if (!workoutId) return;
    
    try {
      setIsSubmitting(true);
      
      await createStandaloneWorkoutExercise({
        workout_id: workoutId,
        exercise_id: exerciseId,
        sets: data.sets,
        reps: data.reps,
        rest_seconds: data.rest_seconds,
        notes: data.notes,
        order_index: exercises.length
      });
      
      const updatedExercises = await fetchStandaloneWorkoutExercises(workoutId);
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
      
      await updateStandaloneWorkoutExercise(exerciseId, {
        sets: data.sets,
        reps: data.reps,
        rest_seconds: data.rest_seconds,
        notes: data.notes
      });
      
      const updatedExercises = await fetchStandaloneWorkoutExercises(workoutId);
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
      
      await deleteStandaloneWorkoutExercise(exerciseId);
      
      const updatedExercises = await fetchStandaloneWorkoutExercises(workoutId);
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
      
      const updatedExercises = await moveStandaloneWorkoutExerciseUp(exerciseId, workoutId);
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
      
      const updatedExercises = await moveStandaloneWorkoutExerciseDown(exerciseId, workoutId);
      setExercises(updatedExercises);
      
    } catch (error) {
      console.error('Error moving exercise down:', error);
      toast.error('Failed to reorder exercise');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return <div className="py-6">Loading workout details...</div>;
  }
  
  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Workout Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Full Body Strength"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="category">Category (Optional)</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Beginner, Upper Body, etc."
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes or instructions for this workout"
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="type">Workout Type</Label>
            <Select 
              value={workoutType} 
              onValueChange={setWorkoutType}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strength">Strength</SelectItem>
                <SelectItem value="cardio">Cardio</SelectItem>
                <SelectItem value="hiit">HIIT</SelectItem>
                <SelectItem value="yoga">Yoga</SelectItem>
                <SelectItem value="recovery">Recovery</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </div>
      </form>
      
      {isEdit && workoutId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Exercises</h3>
            <Button 
              onClick={() => setIsAddingExercise(true)} 
              disabled={isAddingExercise}
              size="sm"
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Exercise
            </Button>
          </div>
          
          {isAddingExercise && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Add Exercise</CardTitle>
              </CardHeader>
              <CardContent>
                <ExerciseSelector
                  onSelect={handleAddExercise}
                  onCancel={() => setIsAddingExercise(false)}
                  isSubmitting={isSubmitting}
                />
              </CardContent>
            </Card>
          )}
          
          {exercises.length === 0 ? (
            <div className="border border-dashed rounded-lg p-6 text-center">
              <p className="text-muted-foreground">No exercises added yet. Click "Add Exercise" to start building your workout template.</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-450px)]">
              <div className="space-y-3">
                {exercises.map((exercise, index) => (
                  <Card key={exercise.id} className="bg-background">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">
                          {exercise.exercise?.name || 'Exercise'}
                        </CardTitle>
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
                    <CardContent>
                      <WorkoutExerciseForm
                        initialData={exercise}
                        onSubmit={(data) => handleUpdateExercise(exercise.id, data)}
                        isSubmitting={isSubmitting}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
};

export default StandaloneWorkoutForm;
