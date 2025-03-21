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
import { createWorkout, createWorkoutExercise, fetchWorkoutExercises } from '@/services/workout-service';
import { toast } from 'sonner';

const formSchema = z.object({
  title: z.string().min(2, 'Workout title must be at least 2 characters'),
  description: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface WorkoutDayFormProps {
  dayName: string;
  dayNumber: number;
  weekId: string;
  workoutId?: string;
  onSave: (workoutId: string) => void;
}

export const WorkoutDayForm: React.FC<WorkoutDayFormProps> = ({
  dayName,
  dayNumber,
  weekId,
  workoutId,
  onSave
}) => {
  const [exercises, setExercises] = useState<(Exercise & { tempId?: string })[]>([]);
  const [exerciseData, setExerciseData] = useState<Record<string, {
    sets: number;
    reps: string;
    rest_seconds?: number;
    notes?: string;
  }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingWorkout, setIsSavingWorkout] = useState(false);
  const [existingExercises, setExistingExercises] = useState<WorkoutExercise[]>([]);
  const [isLoading, setIsLoading] = useState(!!workoutId);
  const [savedExercisesCount, setSavedExercisesCount] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: `${dayName} Workout`,
      description: ''
    }
  });

  useEffect(() => {
    if (workoutId) {
      const loadWorkoutDetails = async () => {
        try {
          const exercises = await fetchWorkoutExercises(workoutId);
          setExistingExercises(exercises);
          
          const loadedExercises = exercises.map(item => item.exercise!);
          setExercises(loadedExercises);
          
          const exerciseFormData: Record<string, any> = {};
          exercises.forEach(item => {
            exerciseFormData[item.exercise_id] = {
              sets: item.sets,
              reps: item.reps,
              rest_seconds: item.rest_seconds || undefined,
              notes: item.notes || undefined
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
  }, [workoutId]);

  const handleAddExercise = (exercise: Exercise) => {
    const exerciseWithTempId = {...exercise, tempId: Date.now().toString()};
    setExercises([...exercises, exerciseWithTempId]);
  };

  const handleRemoveExercise = (index: number) => {
    const newExercises = [...exercises];
    const removed = newExercises.splice(index, 1)[0];
    
    if (removed.id in exerciseData) {
      const newExerciseData = {...exerciseData};
      delete newExerciseData[removed.id];
      setExerciseData(newExerciseData);
    }
    
    setExercises(newExercises);
  };

  const handleSaveExercise = (exercise: Exercise, index: number, data: any) => {
    setExerciseData({
      ...exerciseData,
      [exercise.id]: data
    });
    
    setSavedExercisesCount(prev => prev + 1);
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
          week_id: weekId,
          day_of_week: dayNumber,
          title: values.title,
          description: values.description || null
        };
        
        const newWorkout = await createWorkout(workoutData);
        
        await Promise.all(exercises.map((exercise, index) => {
          const exerciseFormData = exerciseData[exercise.id];
          
          if (!exerciseFormData) {
            console.warn(`No form data for exercise ${exercise.name}`);
            return null;
          }
          
          return createWorkoutExercise({
            workout_id: newWorkout.id,
            exercise_id: exercise.id,
            sets: exerciseFormData.sets,
            reps: exerciseFormData.reps,
            rest_seconds: exerciseFormData.rest_seconds || null,
            notes: exerciseFormData.notes || null,
            order_index: index
          });
        }));
        
        toast.success('Workout saved successfully');
        onSave(newWorkout.id);
      } else {
        toast.success('Workout saved successfully');
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
          <CardTitle className="text-lg">{dayName} Workout</CardTitle>
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
        <CardTitle className="text-lg">{dayName} Workout</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workout Title</FormLabel>
                  <FormControl>
                    <Input placeholder={`${dayName} Workout`} {...field} />
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
                {isSavingWorkout ? 'Saving...' : 'Save Workout'}
              </Button>
            </div>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
};
