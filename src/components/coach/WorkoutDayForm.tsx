import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Exercise, WorkoutExercise } from '@/types/workout';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExerciseSelector } from './ExerciseSelector';
import { WorkoutExerciseForm } from './WorkoutExerciseForm';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  createWorkout, 
  createWorkoutExercise, 
  fetchWorkoutExercises,
  updateWorkout,
  updateWorkoutExercise,
  deleteWorkoutExercise 
} from '@/services/workout-service';
import { createMultipleWorkoutExercises } from '@/services/workout-history-service';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkoutTypeIcon, WORKOUT_TYPES, WorkoutType } from '@/components/client/WorkoutTypeIcon';

const isCardioExercise = (exerciseName: string): boolean => {
  const name = exerciseName.toLowerCase();
  return name.includes('run') || name.includes('walk');
};

const formSchema = z.object({
  title: z.string().min(2, 'Workout title must be at least 2 characters'),
  description: z.string().optional(),
  workoutType: z.enum(['strength', 'cardio', 'flexibility', 'bodyweight', 'rest_day', 'custom', 'one_off']).default('strength')
});

type FormValues = z.infer<typeof formSchema>;

interface WorkoutDayFormProps {
  dayName?: string;
  dayNumber?: number;
  weekId: string;
  workoutId?: string;
  onSave: (workoutId: string) => void;
  mode?: 'create' | 'edit';
}

export const WorkoutDayForm: React.FC<WorkoutDayFormProps> = ({
  dayName,
  dayNumber,
  weekId,
  workoutId,
  onSave,
  mode = 'create'
}) => {
  const [exercises, setExercises] = useState<(Exercise & { tempId?: string })[]>([]);
  const [exerciseData, setExerciseData] = useState<Record<string, {
    id?: string;
    sets: number;
    reps: string;
    rest_seconds?: number;
    notes?: string;
    orderIndex?: number;
  }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingWorkout, setIsSavingWorkout] = useState(false);
  const [existingExercises, setExistingExercises] = useState<WorkoutExercise[]>([]);
  const [isLoading, setIsLoading] = useState(!!workoutId);
  const [removedExerciseIds, setRemovedExerciseIds] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: dayName ? `${dayName} Workout` : 'New Workout',
      description: '',
      workoutType: 'strength'
    }
  });

  useEffect(() => {
    if (workoutId) {
      const loadWorkoutDetails = async () => {
        try {
          const exercises = await fetchWorkoutExercises(workoutId);
          setExistingExercises(exercises);
          
          if (exercises.length > 0 && mode === 'edit') {
            const workoutWithData = exercises.find(ex => ex.workout)?.workout;
            
            if (workoutWithData) {
              form.reset({
                title: workoutWithData.title,
                description: workoutWithData.description || '',
                workoutType: (workoutWithData.workout_type as WorkoutType) || 'strength'
              });
            }
          }
          
          const loadedExercises = exercises.map(item => ({
            ...item.exercise!,
            tempId: item.exercise?.id
          }));
          
          setExercises(loadedExercises);
          
          const exerciseFormData: Record<string, any> = {};
          exercises.forEach(item => {
            exerciseFormData[item.exercise_id] = {
              id: item.id,
              sets: item.sets || 1,
              reps: item.reps || '',
              rest_seconds: item.rest_seconds || undefined,
              notes: item.notes || undefined,
              orderIndex: item.order_index
            };
          });
          setExerciseData(exerciseFormData);
          
          setIsLoading(false);
        } catch (error) {
          console.error('Error loading workout details:', error);
          toast.error('Failed to load workout details');
          setIsLoading(false);
        }
      };
      
      loadWorkoutDetails();
    }
  }, [workoutId, form, mode]);

  const handleAddExercise = (exercise: Exercise) => {
    const exerciseWithTempId = {...exercise, tempId: Date.now().toString()};
    setExercises(prev => [...prev, exerciseWithTempId]);
    
    const isCardio = isCardioExercise(exercise.name);
    if (!isCardio) {
      setExerciseData(prev => ({
        ...prev,
        [exercise.id]: {
          sets: 3,
          reps: '10',
          rest_seconds: 60,
          notes: '',
          orderIndex: exercises.length
        }
      }));
    } else {
      setExerciseData(prev => ({
        ...prev,
        [exercise.id]: {
          sets: 1,
          reps: '1',
          notes: '',
          orderIndex: exercises.length
        }
      }));
    }
  };

  const handleAddMultipleExercises = (selectedExercises: Exercise[]) => {
    const newExercises = selectedExercises.map(exercise => ({
      ...exercise,
      tempId: Date.now() + Math.random().toString()
    }));
    
    setExercises(prev => [...prev, ...newExercises]);
    
    const updatedExerciseData = {...exerciseData};
    newExercises.forEach((exercise, index) => {
      const isCardio = isCardioExercise(exercise.name);
      updatedExerciseData[exercise.id] = isCardio 
        ? {
            sets: 1,
            reps: '1',
            notes: '',
            orderIndex: exercises.length + index
          }
        : {
            sets: 3,
            reps: '10',
            rest_seconds: 60,
            notes: '',
            orderIndex: exercises.length + index
          };
    });
    
    setExerciseData(updatedExerciseData);
  };

  const handleRemoveExercise = (index: number) => {
    const newExercises = [...exercises];
    const removed = newExercises.splice(index, 1)[0];
    
    if (removed.id in exerciseData) {
      if (mode === 'edit' && exerciseData[removed.id]?.id) {
        setRemovedExerciseIds(prev => [...prev, exerciseData[removed.id].id!]);
      }
      
      const newExerciseData = {...exerciseData};
      delete newExerciseData[removed.id];
      setExerciseData(newExerciseData);
    }
    
    setExercises(newExercises);
  };

  const handleRemoveAllExercises = () => {
    if (mode === 'edit') {
      const idsToRemove = exercises
        .filter(ex => ex.id in exerciseData && exerciseData[ex.id]?.id)
        .map(ex => exerciseData[ex.id].id!);
      
      setRemovedExerciseIds(prev => [...prev, ...idsToRemove.filter(Boolean)]);
    }
    
    setExercises([]);
    setExerciseData({});
  };

  const handleUpdateExercise = (exercise: Exercise, index: number, data: any) => {
    setExerciseData({
      ...exerciseData,
      [exercise.id]: {
        ...data,
        id: exerciseData[exercise.id]?.id,
        orderIndex: index
      }
    });
  };

  const onSubmit = async (values: FormValues) => {
    if (exercises.length === 0) {
      toast.error('Please add at least one exercise to the workout');
      return;
    }
    
    try {
      setIsSavingWorkout(true);
      
      if (!workoutId) {
        const workoutData = {
          week_id: weekId,
          day_of_week: dayNumber || 0,
          title: values.title,
          description: values.description || null,
          workout_type: values.workoutType
        };
        
        const newWorkout = await createWorkout(workoutData);
        
        const exercisesToCreate = exercises.map((exercise, index) => {
          const exerciseFormData = exerciseData[exercise.id] || {
            sets: isCardioExercise(exercise.name) ? 1 : 3,
            reps: isCardioExercise(exercise.name) ? '1' : '10',
            rest_seconds: isCardioExercise(exercise.name) ? 0 : 60
          };
          
          const isCardio = isCardioExercise(exercise.name);
          
          return {
            workout_id: newWorkout.id,
            exercise_id: exercise.id,
            sets: exerciseFormData.sets || 1,
            reps: exerciseFormData.reps || (isCardio ? '1' : '10'),
            rest_seconds: exerciseFormData.rest_seconds || 0,
            notes: exerciseFormData.notes || null,
            order_index: index
          };
        });
        
        await createMultipleWorkoutExercises(exercisesToCreate);
        
        toast.success('Workout saved successfully');
        onSave(newWorkout.id);
      } else {
        await updateWorkout(workoutId, {
          title: values.title,
          description: values.description || null,
          workout_type: values.workoutType
        });
        
        for (const exerciseId of removedExerciseIds) {
          await deleteWorkoutExercise(exerciseId);
        }
        
        const exercisesToUpdate: any[] = [];
        const exercisesToCreate: any[] = [];
        
        exercises.forEach((exercise, index) => {
          const exerciseFormData = exerciseData[exercise.id] || {
            sets: isCardioExercise(exercise.name) ? 1 : 3,
            reps: isCardioExercise(exercise.name) ? '1' : '10',
            rest_seconds: isCardioExercise(exercise.name) ? 0 : 60
          };
          
          const isCardio = isCardioExercise(exercise.name);
          
          if (exerciseFormData.id) {
            exercisesToUpdate.push({
              id: exerciseFormData.id,
              data: {
                sets: exerciseFormData.sets || 1,
                reps: exerciseFormData.reps || (isCardio ? '1' : '10'),
                rest_seconds: exerciseFormData.rest_seconds || 0,
                notes: exerciseFormData.notes || null,
                order_index: index
              }
            });
          } else {
            exercisesToCreate.push({
              workout_id: workoutId,
              exercise_id: exercise.id,
              sets: exerciseFormData.sets || 1,
              reps: exerciseFormData.reps || (isCardio ? '1' : '10'),
              rest_seconds: exerciseFormData.rest_seconds || 0,
              notes: exerciseFormData.notes || null,
              order_index: index
            });
          }
        });
        
        for (const item of exercisesToUpdate) {
          await updateWorkoutExercise(item.id, item.data);
        }
        
        if (exercisesToCreate.length > 0) {
          await createMultipleWorkoutExercises(exercisesToCreate);
        }
        
        toast.success('Workout updated successfully');
        onSave(workoutId);
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      toast.error('Failed to save workout');
    } finally {
      setIsSavingWorkout(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{mode === 'edit' ? 'Edit Workout' : `${dayName} Workout`}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
            <div className="space-y-2">
              <div className="h-40 bg-muted rounded"></div>
              <div className="h-40 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{mode === 'edit' ? 'Edit Workout' : dayName ? `${dayName} Workout` : 'New Workout'}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(80vh-8rem)] pr-4">
          <Form {...form}>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workout Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Upper Body, Push, Leg Day" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="workoutType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workout Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a workout type" />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workout Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Instructions or notes about this workout" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-medium">Exercises</h3>
                  <div className="flex space-x-2">
                    {exercises.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRemoveAllExercises}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clear All
                      </Button>
                    )}
                    <ExerciseSelector 
                      onSelectExercise={handleAddExercise}
                      onSelectMultipleExercises={handleAddMultipleExercises}
                    />
                  </div>
                </div>

                {exercises.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-lg">
                    <p className="text-muted-foreground">No exercises added yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click "Add Exercise" to select exercises for this workout
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {exercises.map((exercise, index) => (
                      <div key={exercise.tempId || exercise.id}>
                        <WorkoutExerciseForm
                          exercise={exercise}
                          onSubmit={(data) => handleUpdateExercise(exercise, index, data)}
                          onCancel={() => handleRemoveExercise(index)}
                          isSubmitting={isSubmitting}
                          existingData={exerciseData[exercise.id]}
                          autoSave={true}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <div>
                  {exercises.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} added
                    </p>
                  )}
                </div>
                <Button 
                  type="button" 
                  disabled={isSavingWorkout}
                  onClick={form.handleSubmit(onSubmit)}
                >
                  {isSavingWorkout ? 'Saving...' : mode === 'edit' ? 'Update Workout' : 'Save Workout'}
                </Button>
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSavingWorkout}
                className="w-full"
              >
                {isSavingWorkout ? 'Saving...' : mode === 'edit' ? 'Update Workout' : 'Create Workout'}
              </Button>
            </div>
          </Form>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
