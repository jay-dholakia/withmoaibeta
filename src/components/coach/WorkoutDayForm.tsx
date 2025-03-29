import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, ArrowUp, ArrowDown, ChevronDown, ChevronRight } from "lucide-react";
import { ExerciseSelector } from './ExerciseSelector';
import { WorkoutExerciseForm } from './WorkoutExerciseForm';
import { DAYS_OF_WEEK } from "@/types/workout";
import { toast } from "sonner";
import { WORKOUT_TYPES, WorkoutType } from '@/components/client/WorkoutTypeIcon';
import {
  fetchWorkout,
  fetchWorkoutExercises,
  updateWorkout,
  createWorkout,
  createWorkoutExercise,
  updateWorkoutExercise,
  deleteWorkoutExercise,
  moveWorkoutExerciseUp,
  moveWorkoutExerciseDown
} from '@/services/workout-service';
import { Exercise } from '@/types/workout';

interface WorkoutDayFormProps {
  weekId: string;
  workoutId?: string;
  onSave: (workoutId: string) => void;
  mode?: 'create' | 'edit';
}

const WorkoutDayForm: React.FC<WorkoutDayFormProps> = ({
  weekId,
  workoutId,
  onSave,
  mode = 'create'
}) => {
  const isEdit = mode === 'edit';
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [workoutType, setWorkoutType] = useState<WorkoutType>('strength');
  
  const [exercises, setExercises] = useState<any[]>([]);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [exerciseListExpanded, setExerciseListExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (workoutId && isEdit) {
      loadWorkoutDetails();
    }
  }, [workoutId, isEdit]);

  const loadWorkoutDetails = async () => {
    if (!workoutId) return;
    
    try {
      setIsLoading(true);
      
      const workout = await fetchWorkout(workoutId);
      setTitle(workout.title);
      setDescription(workout.description || '');
      setDayOfWeek(workout.day_of_week);
      
      if (workout.workout_type) {
        const normalizedType = workout.workout_type.toLowerCase();
        
        if (normalizedType.includes('strength')) setWorkoutType('strength');
        else if (normalizedType.includes('body') || normalizedType.includes('weight')) setWorkoutType('bodyweight');
        else if (normalizedType.includes('cardio') || normalizedType.includes('hiit')) setWorkoutType('cardio');
        else if (normalizedType.includes('flex') || normalizedType.includes('yoga') || 
                normalizedType.includes('recovery')) setWorkoutType('flexibility');
        else if (normalizedType.includes('rest')) setWorkoutType('rest_day');
        else if (normalizedType.includes('custom')) setWorkoutType('custom');
        else if (normalizedType.includes('one')) setWorkoutType('one_off');
        else setWorkoutType('strength');
      }
      
      const workoutExercises = await fetchWorkoutExercises(workoutId);
      setExercises(workoutExercises);
      
      const expandedState: Record<string, boolean> = {};
      workoutExercises.forEach(exercise => {
        expandedState[exercise.id] = true;
      });
      setExerciseListExpanded(expandedState);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading workout details:', error);
      toast.error('Failed to load workout details');
      setIsLoading(false);
    }
  };

  const toggleExerciseExpanded = (exerciseId: string) => {
    setExerciseListExpanded(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      toast.error('Please enter a workout title');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      let savedWorkoutId = workoutId;
      
      if (isEdit && workoutId) {
        await updateWorkout(workoutId, {
          title,
          description: description || null,
          day_of_week: dayOfWeek,
          workout_type: workoutType
        });
      } else {
        const workout = await createWorkout({
          week_id: weekId,
          title,
          description: description || null,
          day_of_week: dayOfWeek,
          workout_type: workoutType,
          priority: 0
        });
        
        savedWorkoutId = workout.id;
      }
      
      if (savedWorkoutId) {
        onSave(savedWorkoutId);
      }
      
      toast.success(isEdit ? 'Workout updated successfully' : 'Workout created successfully');
    } catch (error) {
      console.error('Error saving workout:', error);
      toast.error('Failed to save workout');
    } finally {
      setIsSubmitting(false);
    }
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
    return <div className="py-6">Loading workout details...</div>;
  }
  
  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="title">Workout Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Lower Body Strength"
              required
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add notes or instructions for this workout"
            rows={2}
            className="min-h-[60px]"
          />
        </div>
        
        <div>
          <Label htmlFor="type">Workout Type</Label>
          <Select 
            value={workoutType} 
            onValueChange={(value: string) => {
              setWorkoutType(value as WorkoutType);
            }}
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {WORKOUT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    {typeof type.icon === 'string' ? 
                      <span>{type.icon}</span> : 
                      type.icon
                    }
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
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
                  onSelectExercise={handleSelectExercise}
                />
              </CardContent>
            </Card>
          )}
          
          {exercises.length === 0 ? (
            <div className="border border-dashed rounded-lg p-6 text-center">
              <p className="text-muted-foreground">No exercises added yet. Click "Add Exercise" to start building your workout.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exercises.map((exercise, index) => (
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
      )}
    </div>
  );
};

export default WorkoutDayForm;
