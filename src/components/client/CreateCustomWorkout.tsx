import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExerciseSelector } from '@/components/coach/ExerciseSelector';
import { Exercise } from '@/types/workout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  createCustomWorkout,
  createCustomWorkoutExercise,
  CreateCustomWorkoutExerciseParams
} from '@/services/client-custom-workout-service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WORKOUT_TYPES, WorkoutType } from './WorkoutTypeIcon';

interface CustomExerciseItem {
  id: string; // Temporary id for UI purposes
  exercise?: Exercise;
  customName?: string;
  sets?: number;
  reps?: string;
  rest?: number;
  notes?: string;
}

const isCardioExercise = (exerciseName: string): boolean => {
  const name = exerciseName.toLowerCase();
  return name.includes('run') || name.includes('walk');
};

const CreateCustomWorkout = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState<number | undefined>();
  const [workoutType, setWorkoutType] = useState<WorkoutType>('custom');
  const [exercises, setExercises] = useState<CustomExerciseItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddExercise = (exercise: Exercise) => {
    if (isCardioExercise(exercise.name)) {
      setExercises(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          exercise,
        }
      ]);
    } else {
      setExercises(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          exercise,
          sets: 3,
          reps: '10',
          rest: 60
        }
      ]);
    }
  };

  const handleAddCustomExercise = () => {
    setExercises(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        customName: '',
        sets: 3,
        reps: '10',
        rest: 60
      }
    ]);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(prev => prev.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, updates: Partial<CustomExerciseItem>) => {
    setExercises(prev => 
      prev.map((ex, i) => i === index ? { ...ex, ...updates } : ex)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      toast.error('Please enter a workout title');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const workout = await createCustomWorkout({
        title,
        description: description || undefined,
        duration_minutes: duration,
        workout_type: workoutType
      });
      
      if (exercises.length > 0) {
        const exercisePromises = exercises.map((ex, index) => {
          const isCardio = ex.exercise 
            ? isCardioExercise(ex.exercise.name) 
            : ex.customName 
              ? isCardioExercise(ex.customName) 
              : false;
          
          const params: CreateCustomWorkoutExerciseParams = {
            workout_id: workout.id,
            exercise_id: ex.exercise?.id,
            custom_exercise_name: ex.customName || null,
            sets: isCardio ? null : ex.sets || null,
            reps: isCardio ? null : ex.reps || null,
            rest_seconds: isCardio ? null : ex.rest || null,
            notes: ex.notes || null,
            order_index: index
          };
          
          return createCustomWorkoutExercise(params);
        });
        
        await Promise.all(exercisePromises);
      }
      
      toast.success('Custom workout created successfully!');
      navigate('/client-dashboard/workouts');
    } catch (error) {
      console.error('Error creating custom workout:', error);
      toast.error('Failed to create custom workout');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/client-dashboard/workouts')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workouts
        </Button>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Create Your Own Workout</h1>
        <p className="text-muted-foreground">
          Build a custom workout with exercises from our database or add your own.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Workout Title *</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="My Custom Workout"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes) *</Label>
            <Input 
              id="duration" 
              type="number" 
              min="1"
              value={duration || ''} 
              onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : undefined)} 
              placeholder="60"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="workout-type">Workout Type *</Label>
          <Select 
            value={workoutType} 
            onValueChange={(value) => setWorkoutType(value as WorkoutType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select workout type" />
            </SelectTrigger>
            <SelectContent>
              {WORKOUT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea 
            id="description" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="Describe your workout..."
            rows={3}
          />
        </div>

        <Separator />
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Exercises (Optional)</h2>
            <div className="flex space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddCustomExercise}
              >
                <Plus className="h-4 w-4 mr-2" />
                Custom Exercise
              </Button>
              <ExerciseSelector 
                onSelectExercise={handleAddExercise} 
                buttonText="Add Exercise"
              />
            </div>
          </div>
          
          {exercises.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <p>No exercises added yet. You can create a workout without exercises, or use the buttons above to add them.</p>
            </div>
          )}
          
          <div className="space-y-4">
            {exercises.map((exercise, index) => {
              const exerciseName = exercise.exercise?.name || exercise.customName || '';
              const isCardio = isCardioExercise(exerciseName);
              
              return (
                <Card key={exercise.id} className="p-4">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {exercise.exercise ? (
                          <h3 className="font-medium">{exercise.exercise.name}</h3>
                        ) : (
                          <div className="space-y-1">
                            <Label htmlFor={`custom-${index}`}>Exercise Name *</Label>
                            <Input 
                              id={`custom-${index}`}
                              value={exercise.customName || ''} 
                              onChange={(e) => {
                                const newName = e.target.value;
                                const updates: Partial<CustomExerciseItem> = { 
                                  customName: newName
                                };
                                
                                const wasCardio = exercise.customName ? isCardioExercise(exercise.customName) : false;
                                const isNowCardio = isCardioExercise(newName);
                                
                                if (wasCardio !== isNowCardio) {
                                  if (isNowCardio) {
                                    updates.sets = undefined;
                                    updates.reps = undefined;
                                    updates.rest = undefined;
                                  } else {
                                    updates.sets = 3;
                                    updates.reps = '10';
                                    updates.rest = 60;
                                  }
                                }
                                
                                updateExercise(index, updates);
                              }}
                              placeholder="Custom exercise name" 
                              required={!exercise.exercise}
                            />
                          </div>
                        )}
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveExercise(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      {!isCardio && (
                        <>
                          <div className="space-y-1">
                            <Label htmlFor={`sets-${index}`}>Sets</Label>
                            <Input 
                              id={`sets-${index}`}
                              type="number" 
                              min="1"
                              value={exercise.sets || ''} 
                              onChange={(e) => updateExercise(index, { 
                                sets: e.target.value ? parseInt(e.target.value) : undefined 
                              })}
                              placeholder="3" 
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <Label htmlFor={`reps-${index}`}>Reps</Label>
                            <Input 
                              id={`reps-${index}`}
                              value={exercise.reps || ''} 
                              onChange={(e) => updateExercise(index, { reps: e.target.value })}
                              placeholder="10" 
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <Label htmlFor={`rest-${index}`}>Rest (seconds)</Label>
                            <Input 
                              id={`rest-${index}`}
                              type="number" 
                              min="0"
                              value={exercise.rest || ''} 
                              onChange={(e) => updateExercise(index, { 
                                rest: e.target.value ? parseInt(e.target.value) : undefined 
                              })}
                              placeholder="60" 
                            />
                          </div>
                        </>
                      )}
                      
                      {isCardio && (
                        <div className="col-span-3">
                          <p className="text-sm text-muted-foreground">No sets, reps or rest needed for cardio exercises.</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor={`notes-${index}`}>Notes</Label>
                      <Textarea 
                        id={`notes-${index}`}
                        value={exercise.notes || ''} 
                        onChange={(e) => updateExercise(index, { notes: e.target.value })}
                        placeholder={isCardio 
                          ? "Enter distance, duration, or other details..." 
                          : "Any specific instructions or notes..."} 
                        rows={2}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            className="w-full md:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Workout'}
            <Save className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateCustomWorkout;
