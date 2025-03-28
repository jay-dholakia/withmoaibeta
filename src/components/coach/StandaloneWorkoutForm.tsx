
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dumbell, Running, Waves, ActivitySquare, ChevronDown, Trash2, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { ExerciseSelector } from '@/components/coach/ExerciseSelector';
import { Exercise, WorkoutExercise } from '@/types/workout';
import { createStandaloneWorkout, updateStandaloneWorkout, getStandaloneWorkout } from '@/services/workout-service';
import { fetchExercises } from '@/services/exercise-service';
import { useAuth } from '@/contexts/AuthContext';

// Define workout type options
const WORKOUT_TYPES = [
  { value: 'strength', label: 'Strength', icon: <Dumbell className="h-4 w-4 mr-2" /> },
  { value: 'cardio', label: 'Cardio', icon: <Running className="h-4 w-4 mr-2" /> },
  { value: 'mobility', label: 'Mobility', icon: <Waves className="h-4 w-4 mr-2" /> },
  { value: 'flexibility', label: 'Flexibility', icon: <ActivitySquare className="h-4 w-4 mr-2" /> },
];

// Form validation schema
const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  category: z.string().optional(),
  workout_type: z.string().min(1, { message: "Workout type is required" }),
});

type FormValues = z.infer<typeof formSchema>;

const StandaloneWorkoutForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(id ? true : false);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      workout_type: 'strength', // Default to strength
    },
  });

  // Load exercises
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const data = await fetchExercises();
        setExercises(data);
      } catch (error) {
        console.error("Error loading exercises:", error);
        toast.error("Failed to load exercises");
      }
    };
    
    loadExercises();
  }, []);

  // Load workout data if editing
  useEffect(() => {
    const loadWorkout = async () => {
      if (id) {
        try {
          const workout = await getStandaloneWorkout(id);
          
          // Populate form
          form.reset({
            title: workout.title,
            description: workout.description || "",
            category: workout.category || "",
            workout_type: workout.workout_type || "strength",
          });
          
          // Load workout exercises
          if (workout.workout_exercises) {
            setWorkoutExercises(workout.workout_exercises.map(exercise => ({
              ...exercise,
              reps: exercise.reps || "",
              sets: exercise.sets || 0,
              rest_seconds: exercise.rest_seconds || 0,
            })));
          }
          
          setInitialLoading(false);
        } catch (error) {
          console.error("Error loading workout:", error);
          toast.error("Failed to load workout");
          setInitialLoading(false);
        }
      }
    };
    
    loadWorkout();
  }, [id, form]);

  const handleExerciseAdd = (exercise: Exercise) => {
    setWorkoutExercises(prev => [
      ...prev,
      {
        id: `temp-${Date.now()}`, // Temporary ID until saved
        workout_id: id || "",
        exercise_id: exercise.id,
        sets: 3,
        reps: "8-10",
        rest_seconds: 60,
        notes: "",
        order_index: prev.length,
        created_at: new Date().toISOString(),
        exercise: exercise,
      }
    ]);
    setIsSelectorOpen(false);
  };

  const handleExerciseUpdate = (index: number, field: string, value: any) => {
    setWorkoutExercises(prev => 
      prev.map((ex, i) => i === index ? { ...ex, [field]: value } : ex)
    );
  };

  const handleExerciseRemove = (index: number) => {
    setWorkoutExercises(prev => prev.filter((_, i) => i !== index));
  };

  const handleExerciseReorder = (sourceIndex: number, targetIndex: number) => {
    if (sourceIndex === targetIndex) return;
    
    setWorkoutExercises(prev => {
      const newExercises = [...prev];
      const [movedItem] = newExercises.splice(sourceIndex, 1);
      newExercises.splice(targetIndex, 0, movedItem);
      
      // Update order_index values
      return newExercises.map((ex, index) => ({
        ...ex,
        order_index: index
      }));
    });
  };

  const onSubmit = async (values: FormValues) => {
    if (workoutExercises.length === 0) {
      toast.error("Please add at least one exercise to the workout");
      return;
    }
    
    setLoading(true);
    
    try {
      // Format workout exercises for submission
      const formattedExercises = workoutExercises.map((ex, index) => ({
        id: ex.id.startsWith('temp-') ? undefined : ex.id,
        exercise_id: ex.exercise_id,
        sets: ex.sets,
        reps: ex.reps || "",
        rest_seconds: ex.rest_seconds,
        notes: ex.notes,
        order_index: index
      }));
      
      if (id) {
        // Update existing workout
        await updateStandaloneWorkout(id, {
          title: values.title,
          description: values.description,
          category: values.category,
          workout_type: values.workout_type,
          workout_exercises: formattedExercises
        });
        toast.success("Workout updated successfully");
      } else {
        // Create new workout
        if (!user) {
          toast.error("You must be logged in to create a workout");
          return;
        }
        
        await createStandaloneWorkout({
          title: values.title,
          description: values.description,
          category: values.category,
          workout_type: values.workout_type,
          coach_id: user.id,
          workout_exercises: formattedExercises
        });
        toast.success("Workout created successfully");
      }
      
      // Navigate back to workouts page
      navigate('/coach/standalone-workouts');
    } catch (error) {
      console.error("Error saving workout:", error);
      toast.error("Failed to save workout");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="flex justify-center p-6">Loading workout data...</div>;
  }

  return (
    <div className="space-y-6 p-4 max-w-screen-lg mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{id ? 'Edit Workout' : 'Create Workout'}</h1>
        <Button variant="outline" onClick={() => navigate('/coach/standalone-workouts')}>
          Cancel
        </Button>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workout Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Upper Body Strength" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="workout_type"
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
                        <SelectValue placeholder="Select workout type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {WORKOUT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            {type.icon}
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
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Beginner, Advanced" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Enter workout description" 
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Separator className="my-6" />
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Exercises</h2>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsSelectorOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Exercise
              </Button>
            </div>
            
            {workoutExercises.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No exercises added yet. Click "Add Exercise" to begin building your workout.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {workoutExercises.map((exercise, index) => (
                  <Card key={`${exercise.exercise_id}-${index}`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-md">
                          {exercise.exercise?.name || "Exercise"}
                        </CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={() => handleExerciseRemove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <FormLabel htmlFor={`sets-${index}`}>Sets</FormLabel>
                          <Input
                            id={`sets-${index}`}
                            type="number"
                            value={exercise.sets}
                            min={1}
                            onChange={(e) => handleExerciseUpdate(index, 'sets', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div>
                          <FormLabel htmlFor={`reps-${index}`}>Reps/Duration</FormLabel>
                          <Input
                            id={`reps-${index}`}
                            value={exercise.reps}
                            placeholder="e.g., 8-10, 30s"
                            onChange={(e) => handleExerciseUpdate(index, 'reps', e.target.value)}
                          />
                        </div>
                        <div>
                          <FormLabel htmlFor={`rest-${index}`}>Rest (seconds)</FormLabel>
                          <Input
                            id={`rest-${index}`}
                            type="number"
                            value={exercise.rest_seconds || 0}
                            min={0}
                            onChange={(e) => handleExerciseUpdate(index, 'rest_seconds', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <FormLabel htmlFor={`notes-${index}`}>Notes (Optional)</FormLabel>
                        <Textarea
                          id={`notes-${index}`}
                          value={exercise.notes || ""}
                          placeholder="Additional instructions or cues"
                          onChange={(e) => handleExerciseUpdate(index, 'notes', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </CardContent>
                    {index < workoutExercises.length - 1 && (
                      <CardFooter className="flex justify-center pb-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExerciseReorder(index, index + 1)}
                        >
                          <ChevronDown className="h-4 w-4" />
                          <span className="sr-only">Move down</span>
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/coach/standalone-workouts')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : (id ? "Update Workout" : "Create Workout")}
            </Button>
          </div>
        </form>
      </Form>
      
      <ExerciseSelector
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        exercises={exercises}
        onExerciseSelect={handleExerciseAdd}
      />
    </div>
  );
};

export default StandaloneWorkoutForm;
