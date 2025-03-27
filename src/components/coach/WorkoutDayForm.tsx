
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { fetchExercises } from '@/services/exercise-service';
import { Exercise } from '@/types/workout';
import { createMultipleWorkoutExercises } from '@/services/workout-history-service';
import { toast } from 'sonner';

const formSchema = z.object({
  title: z.string().min(2, {
    message: 'Workout title must be at least 2 characters.',
  }),
  description: z.string().optional(),
  day_of_week: z.string().min(1, {
    message: 'Please select a day of the week.',
  }),
  exercises: z.array(
    z.object({
      exercise_id: z.string().min(1, {
        message: 'Please select an exercise.',
      }),
      sets: z.number().min(1, {
        message: 'Sets must be at least 1.',
      }),
      reps: z.string().min(1, {
        message: 'Reps must be at least 1.',
      }),
      rest_seconds: z.number().optional(),
      notes: z.string().optional(),
    })
  ).min(1, {
    message: 'You must add at least one exercise.',
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface WorkoutDayFormProps {
  weekId: string;
  workoutId?: string;
  onSave: (workoutId: string) => Promise<void>;
  mode?: 'create' | 'edit';
}

const WorkoutDayForm = ({ weekId, workoutId, onSave, mode = 'create' }: WorkoutDayFormProps) => {
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  const [exercisesList, setExercisesList] = useState<Exercise[]>([]);
  const [isSubmitting, setSubmitting] = useState(false);
  const { programId } = useParams<{ programId: string }>();

  useEffect(() => {
    const loadExercises = async () => {
      try {
        const exercises = await fetchExercises();
        setExercisesList(exercises);
      } catch (error) {
        console.error('Error loading exercises:', error);
        uiToast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load exercises. Please try again.',
        });
      }
    };

    loadExercises();
  }, [uiToast]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      day_of_week: '',
      exercises: [{ exercise_id: '', sets: 3, reps: '10', rest_seconds: 60, notes: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'exercises',
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    
    try {
      // Convert day of week from string to number
      const dayOfWeekNumber = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(values.day_of_week);
      
      if (dayOfWeekNumber === -1) {
        throw new Error("Invalid day of week");
      }
      
      // 1. Create the workout
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          title: values.title,
          description: values.description,
          day_of_week: dayOfWeekNumber,
          week_id: weekId,
        })
        .select()
        .single();
      
      if (workoutError) {
        console.error("Error creating workout:", workoutError);
        setSubmitting(false);
        uiToast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to create workout. Please try again.',
        });
        return;
      }
      
      const workoutId = workout.id;

      // 2. Create the exercises
      const createExercises = async (workoutId: string) => {
        const exercisesData = values.exercises.map((exercise, index) => ({
          exercise_id: exercise.exercise_id,
          sets: parseInt(exercise.sets.toString(), 10),
          reps: exercise.reps.toString(),
          rest_seconds: exercise.rest_seconds 
            ? parseInt(exercise.rest_seconds.toString(), 10) 
            : undefined,
          notes: exercise.notes,
          order_index: index
        }));

        const success = await createMultipleWorkoutExercises(
          workoutId, 
          exercisesData
        );
        
        return success;
      };
      
      const exercisesCreationSuccess = await createExercises(workoutId);
      
      if (!exercisesCreationSuccess) {
        throw new Error("Failed to create exercises");
      }

      uiToast({
        title: 'Success',
        description: 'Workout created successfully!',
      });
      
      await onSave(workoutId);
    } catch (error) {
      console.error("Error creating workout:", error);
      setSubmitting(false);
      toast.error("Failed to create workout");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Workout</CardTitle>
        <CardDescription>Define the workout details for this day.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workout Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter workout title" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a description for the workout"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe the workout for your clients.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="day_of_week"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day of the Week</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a day" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Monday">Monday</SelectItem>
                      <SelectItem value="Tuesday">Tuesday</SelectItem>
                      <SelectItem value="Wednesday">Wednesday</SelectItem>
                      <SelectItem value="Thursday">Thursday</SelectItem>
                      <SelectItem value="Friday">Friday</SelectItem>
                      <SelectItem value="Saturday">Saturday</SelectItem>
                      <SelectItem value="Sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>Exercises</Label>
              <FormDescription>Add exercises to the workout.</FormDescription>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name={`exercises.${index}.exercise_id` as const}
                    render={({ field }) => (
                      <FormItem className="w-1/3">
                        <FormLabel>Exercise</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select exercise" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {exercisesList.map((exercise) => (
                              <SelectItem key={exercise.id} value={exercise.id}>
                                {exercise.name}
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
                    name={`exercises.${index}.sets` as const}
                    render={({ field }) => (
                      <FormItem className="w-1/6">
                        <FormLabel>Sets</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Sets"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`exercises.${index}.reps` as const}
                    render={({ field }) => (
                      <FormItem className="w-1/6">
                        <FormLabel>Reps</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="Reps" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`exercises.${index}.rest_seconds` as const}
                    render={({ field }) => (
                      <FormItem className="w-1/6">
                        <FormLabel>Rest (seconds)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Rest"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`exercises.${index}.notes` as const}
                    render={({ field }) => (
                      <FormItem className="w-1/3">
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="Notes" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                onClick={() => append({ exercise_id: '', sets: 3, reps: '10', rest_seconds: 60, notes: '' })}
                variant="outline"
                className="w-full justify-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Add Exercise
              </Button>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Creating...' : 'Create Workout'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default WorkoutDayForm;
