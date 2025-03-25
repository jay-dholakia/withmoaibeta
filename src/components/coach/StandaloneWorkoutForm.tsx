
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
import { Card, CardContent } from '@/components/ui/card';
import { ExerciseSelector } from './ExerciseSelector';
import { WorkoutExerciseForm } from './WorkoutExerciseForm';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  createStandaloneWorkout,
  createStandaloneWorkoutExercise,
  fetchStandaloneWorkoutExercises,
  updateStandaloneWorkout,
  updateStandaloneWorkoutExercise,
  deleteStandaloneWorkoutExercise
} from '@/services/workout-service';
import { toast } from 'sonner';
import { StandaloneWorkout } from '@/types/workout';

const isCardioExercise = (exerciseName: string): boolean => {
  const name = exerciseName.toLowerCase();
  return name.includes('run') || name.includes('walk');
};

const formSchema = z.object({
  title: z.string().min(2, 'Workout title must be at least 2 characters'),
  description: z.string().optional(),
  category: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface StandaloneWorkoutFormProps {
  workoutId?: string;
  initialData?: StandaloneWorkout;
  coachId: string;
  onSave: (workoutId: string) => void;
  mode?: 'create' | 'edit';
}

export const StandaloneWorkoutForm: React.FC<StandaloneWorkoutFormProps> = ({
  workoutId,
  initialData,
  coachId,
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
  const [savedExercisesCount, setSavedExercisesCount] = useState(0);
  const [removedExerciseIds, setRemovedExerciseIds] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || 'New Workout',
      description: initialData?.description || '',
      category: initialData?.category || ''
    }
  });

  useEffect(() => {
    if (workoutId) {
      const loadWorkoutDetails = async () => {
        try {
          const exercises = await fetchStandaloneWorkoutExercises(workoutId);
          setExistingExercises(exercises);
          
          if (exercises.length > 0 && mode === 'edit' && initialData) {
            form.reset({
              title: initialData.title,
              description: initialData.description || '',
              category: initialData.category || ''
            });
          }
          
          const loadedExercises = exercises.map(item => item.exercise!);
          setExercises(loadedExercises);
          
          const exerciseFormData: Record<string, any> = {};
          exercises.forEach(item => {
            exerciseFormData[item.exercise_id] = {
              id: item.id,
              sets: item.sets,
              reps: item.reps,
              rest_seconds: item.rest_seconds || undefined,
              notes: item.notes || undefined,
              orderIndex: item.order_index
            };
          });
          setExerciseData(exerciseFormData);
          setSavedExercisesCount(exercises.length);
          
          setIsLoading(false);
        } catch (error) {
          console.error('Error loading workout details:', error);
          toast.error('Failed to load workout details');
          setIsLoading(false);
        }
      };
      
      loadWorkoutDetails();
    }
  }, [workoutId, form, mode, initialData]);

  const handleAddExercise = (exercise: Exercise) => {
    const exerciseWithTempId = {...exercise, tempId: Date.now().toString()};
    setExercises([...exercises, exerciseWithTempId]);
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

  const handleSaveExercise = (exercise: Exercise, index: number, data: any) => {
    setExerciseData({
      ...exerciseData,
      [exercise.id]: {
        ...data,
        id: exerciseData[exercise.id]?.id,
        orderIndex: index
      }
    });
    
    setSavedExercisesCount(prev => {
      if (!exerciseData[exercise.id]) {
        return prev + 1;
      }
      return prev;
    });
    
    toast.success(`Added ${exercise.name} to workout`);
  };

  const onSubmit = async (values: FormValues) => {
    if (exercises.length === 0) {
      toast.error('Please add at least one exercise to the workout');
      return;
    }
    
    const missingExerciseData = exercises.some(exercise => !exerciseData[exercise.id]);
    if (missingExerciseData) {
      toast.error('Please save all exercises before continuing');
      return;
    }
    
    try {
      setIsSavingWorkout(true);
      
      if (!workoutId) {
        const workoutData = {
          coach_id: coachId,
          title: values.title,
          description: values.description || null,
          category: values.category || null
        };
        
        const newWorkout = await createStandaloneWorkout(workoutData);
        
        await Promise.all(exercises.map((exercise, index) => {
          const exerciseFormData = exerciseData[exercise.id];
          
          if (!exerciseFormData) {
            console.warn(`No form data for exercise ${exercise.name}`);
            return null;
          }
          
          const isCardio = isCardioExercise(exercise.name);
          
          return createStandaloneWorkoutExercise({
            workout_id: newWorkout.id,
            exercise_id: exercise.id,
            sets: isCardio ? null : exerciseFormData.sets,
            reps: isCardio ? null : exerciseFormData.reps,
            rest_seconds: isCardio ? null : (exerciseFormData.rest_seconds || null),
            notes: exerciseFormData.notes || null,
            order_index: index
          });
        }));
        
        toast.success('Workout saved successfully');
        onSave(newWorkout.id);
      } else {
        await updateStandaloneWorkout(workoutId, {
          title: values.title,
          description: values.description || null,
          category: values.category || null
        });
        
        for (const exerciseId of removedExerciseIds) {
          await deleteStandaloneWorkoutExercise(exerciseId);
        }
        
        await Promise.all(exercises.map((exercise, index) => {
          const exerciseFormData = exerciseData[exercise.id];
          
          if (!exerciseFormData) {
            console.warn(`No form data for exercise ${exercise.name}`);
            return null;
          }
          
          const isCardio = isCardioExercise(exercise.name);
          
          if (exerciseFormData.id) {
            return updateStandaloneWorkoutExercise(exerciseFormData.id, {
              sets: isCardio ? null : exerciseFormData.sets,
              reps: isCardio ? null : exerciseFormData.reps,
              rest_seconds: isCardio ? null : (exerciseFormData.rest_seconds || null),
              notes: exerciseFormData.notes || null,
              order_index: index
            });
          } else {
            return createStandaloneWorkoutExercise({
              workout_id: workoutId,
              exercise_id: exercise.id,
              sets: isCardio ? null : exerciseFormData.sets,
              reps: isCardio ? null : exerciseFormData.reps,
              rest_seconds: isCardio ? null : (exerciseFormData.rest_seconds || null),
              notes: exerciseFormData.notes || null,
              order_index: index
            });
          }
        }));
        
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
        <CardContent className="pt-6">
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
      <CardContent className="pt-6">
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

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Strength, Endurance, Flexibility" 
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
                  <ExerciseSelector onSelectExercise={handleAddExercise} />
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
                          onSubmit={(data) => handleSaveExercise(exercise, index, data)}
                          onCancel={() => handleRemoveExercise(index)}
                          isSubmitting={isSubmitting}
                          existingData={exerciseData[exercise.id]}
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
                      {savedExercisesCount}/{exercises.length} exercises saved
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
          </Form>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
