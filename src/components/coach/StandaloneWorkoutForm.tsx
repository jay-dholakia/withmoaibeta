
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchExercises } from '@/services/exercise-service';
import { createStandaloneWorkout } from '@/services/workout-service';
import { createMultipleStandaloneWorkoutExercises } from '@/services/workout-history-service';
import { Exercise } from '@/types/workout';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ExerciseFormValues {
  exercise_id: string;
  sets: number;
  reps: string;
  rest_seconds?: number;
  notes?: string;
}

const StandaloneWorkoutForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exercisesList, setExercisesList] = useState<Exercise[]>([]);
  const [isSubmitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<{
    title: string;
    description: string;
    exercises: ExerciseFormValues[];
  }>({
    defaultValues: {
      title: '',
      description: '',
      exercises: [{ exercise_id: '', sets: 3, reps: '10' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'exercises',
  });

  useEffect(() => {
    const loadExercises = async () => {
      try {
        const exercises = await fetchExercises();
        setExercisesList(exercises);
      } catch (error) {
        console.error('Error loading exercises:', error);
        toast.error('Failed to load exercises');
      }
    };

    loadExercises();
  }, []);

  const onSubmit = async (data: { title: string; description: string; exercises: ExerciseFormValues[] }) => {
    if (!user?.id) {
      toast.error('User ID not found. Please log in again.');
      return;
    }

    setSubmitting(true);
    let workoutId: string | null = null;

    try {
      // Create the standalone workout
      const workoutResult = await createStandaloneWorkout({
        title: data.title,
        description: data.description,
        coach_id: user.id,
      });

      if (!workoutResult.success) {
        toast.error(workoutResult.error || 'Failed to create workout');
        return;
      }

      workoutId = workoutResult.id;

      if (!workoutId) {
        toast.error('Failed to retrieve workout ID');
        return;
      }

      const createExercises = async (workoutId: string) => {
        const exercisesData = data.exercises.map((exercise, index) => ({
          exercise_id: exercise.exercise_id,
          sets: parseInt(exercise.sets.toString(), 10),
          reps: exercise.reps.toString(),
          rest_seconds: exercise.rest_seconds 
            ? parseInt(exercise.rest_seconds.toString(), 10) 
            : undefined,
          notes: exercise.notes,
          order_index: index
        }));

        const success = await createMultipleStandaloneWorkoutExercises(
          workoutId, 
          exercisesData
        );
        
        return success;
      };

      // Create workout exercises
      const exercisesCreated = await createExercises(workoutId);

      if (!exercisesCreated) {
        toast.error('Failed to create workout exercises');
        return;
      }

      toast.success('Workout created successfully!');
      navigate('/coach-dashboard/workouts/standalone');
    } catch (error) {
      console.error("Error submitting workout:", error);
      
      // Clean up if we created a workout but exercises failed
      if (workoutId) {
        await supabase
          .from('standalone_workouts')
          .delete()
          .eq('id', workoutId);
      }
      
      setSubmitting(false);
      toast.error("Failed to create workout");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create Standalone Workout</h1>
        <Button variant="outline" onClick={() => navigate('/coach-dashboard/workouts/standalone')}>
          Back to Standalone Workouts
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workout Details</CardTitle>
          <CardDescription>Enter the workout details below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" type="text" {...register('title', { required: 'Title is required' })} />
              {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} />
            </div>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Exercises</CardTitle>
                <CardDescription>Add exercises to the workout.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {fields.map((item, index) => (
                    <li key={item.id} className="grid grid-cols-6 gap-4 items-center">
                      <div className="col-span-2">
                        <Label htmlFor={`exercises[${index}].exercise_id`}>Exercise</Label>
                        <Select
                          onValueChange={(value) => setValue(`exercises.${index}.exercise_id`, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select an exercise" />
                          </SelectTrigger>
                          <SelectContent>
                            {exercisesList.map((exercise) => (
                              <SelectItem key={exercise.id} value={exercise.id}>
                                {exercise.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`exercises[${index}].sets`}>Sets</Label>
                        <Input
                          type="number"
                          {...register(`exercises.${index}.sets`, {
                            required: 'Sets are required',
                            valueAsNumber: true,
                          })}
                        />
                        {errors.exercises?.[index]?.sets && (
                          <p className="text-red-500 text-sm">{(errors.exercises[index]?.sets as any)?.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor={`exercises[${index}].reps`}>Reps</Label>
                        <Input
                          type="text"
                          {...register(`exercises.${index}.reps`, { required: 'Reps are required' })}
                        />
                        {errors.exercises?.[index]?.reps && (
                          <p className="text-red-500 text-sm">{(errors.exercises[index]?.reps as any)?.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor={`exercises[${index}].rest_seconds`}>Rest (seconds)</Label>
                        <Input
                          type="number"
                          {...register(`exercises.${index}.rest_seconds`, { valueAsNumber: true })}
                        />
                      </div>
                      <div>
                        <Button
                          variant="ghost"
                          onClick={() => remove(index)}
                          className="text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
                <Button type="button" variant="secondary" onClick={() => append({ exercise_id: '', sets: 3, reps: '10' })} className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Add Exercise
                </Button>
              </CardContent>
            </Card>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Submitting...' : 'Create Workout'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StandaloneWorkoutForm;
