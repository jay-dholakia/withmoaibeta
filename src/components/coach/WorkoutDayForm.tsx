
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Dumbbell, ActivitySquare, Trash2, Plus } from 'lucide-react';

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
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { ExerciseSelector } from '@/components/coach/ExerciseSelector';
import { Exercise, WorkoutExercise } from '@/types/workout';
import { 
  createWorkout, 
  updateWorkout, 
  fetchWorkout,
  fetchExercises,
  createWorkoutExercise,
  updateWorkoutExercise,
  deleteWorkoutExercise,
  fetchWorkouts,
  fetchWorkoutExercises
} from '@/services/workout-service';

const WORKOUT_TYPES = [
  { value: 'strength', label: 'Strength', icon: <Dumbbell className="h-4 w-4 mr-2" /> },
  { value: 'cardio', label: 'Cardio', icon: <ActivitySquare className="h-4 w-4 mr-2" /> },
  { value: 'mobility', label: 'Mobility', icon: <ActivitySquare className="h-4 w-4 mr-2" /> },
  { value: 'flexibility', label: 'Flexibility', icon: <ActivitySquare className="h-4 w-4 mr-2" /> },
];

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  workout_type: z.string().min(1, { message: "Workout type is required" }),
  priority: z.coerce.number().min(0)
});

type FormValues = z.infer<typeof formSchema>;

type WorkoutDayFormProps = {
  weekId: string;
  workoutId?: string;
  onSave: (workoutId: string) => void;
  mode?: 'create' | 'edit';
};

const WorkoutDayForm = ({ weekId, workoutId, onSave, mode = 'create' }: WorkoutDayFormProps) => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(workoutId ? true : false);
  const [workoutsInWeek, setWorkoutsInWeek] = useState<number>(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      workout_type: 'strength',
      priority: 0
    },
  });

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

  useEffect(() => {
    const loadWorkoutsInWeek = async () => {
      try {
        const workouts = await fetchWorkouts(weekId);
        setWorkoutsInWeek(workouts.length);
      } catch (error) {
        console.error("Error loading workouts in week:", error);
      }
    };

    loadWorkoutsInWeek();
  }, [weekId]);

  useEffect(() => {
    const loadWorkout = async () => {
      if (workoutId) {
        try {
          const workout = await fetchWorkout(workoutId);
          
          form.reset({
            title: workout.title,
            description: workout.description || "",
            workout_type: workout.workout_type,
            priority: workout.priority || 0
          });
          
          setInitialLoading(false);
        } catch (error) {
          console.error("Error loading workout:", error);
          toast.error("Failed to load workout");
          setInitialLoading(false);
        }
      }
    };
    
    loadWorkout();
  }, [workoutId, form]);

  useEffect(() => {
    const loadWorkoutExercises = async () => {
      if (workoutId) {
        try {
          console.log("Fetching workout exercises for workout ID:", workoutId);
          const exercises = await fetchWorkoutExercises(workoutId);
          console.log("Fetched workout exercises:", exercises);
          setWorkoutExercises(exercises);
        } catch (error) {
          console.error("Error loading workout exercises:", error);
          toast.error("Failed to load workout exercises");
        }
      }
    };
    
    if (workoutId) {
      loadWorkoutExercises();
    }
  }, [workoutId]);

  const handleExerciseAdd = (exercise: Exercise) => {
    setWorkoutExercises(prev => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        workout_id: workoutId || "",
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
      
      return newExercises.map((ex, index) => ({
        ...ex,
        order_index: index
      }));
    });
  };

  const renderExerciseForm = (exercise: WorkoutExercise, index: number) => {
    const isCardio = exercise.exercise?.exercise_type === 'cardio';
    
    let distance = '';
    let duration = '';
    let location = '';
    let notes = exercise.notes || '';
    
    if (isCardio && notes) {
      const distanceMatch = notes.match(/Distance: ([0-9]+(\.[0-9]+)?)\s*miles/i);
      if (distanceMatch) {
        distance = distanceMatch[1];
        notes = notes.replace(/Distance: [^,]+, ?/g, '');
      }
      
      const durationMatch = notes.match(/Duration: (([0-9]{1,2}:)?[0-5][0-9]:[0-5][0-9])/i);
      if (durationMatch) {
        duration = durationMatch[1];
        notes = notes.replace(/Duration: [^,]+, ?/g, '');
      }
      
      if (notes.includes('Location: indoor')) {
        location = 'indoor';
        notes = notes.replace(/Location: indoor, ?/g, '');
      } else if (notes.includes('Location: outdoor')) {
        location = 'outdoor';
        notes = notes.replace(/Location: outdoor, ?/g, '');
      }
    }
    
    return (
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
          {isCardio ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <FormLabel htmlFor={`distance-${index}`}>Distance (miles)</FormLabel>
                <Input
                  id={`distance-${index}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={distance}
                  placeholder="Enter distance in miles"
                  onChange={(e) => {
                    let updatedNotes = exercise.notes || '';
                    if (updatedNotes.includes('Distance:')) {
                      updatedNotes = updatedNotes.replace(/Distance: [^,]+/, `Distance: ${e.target.value} miles`);
                    } else {
                      updatedNotes = `Distance: ${e.target.value} miles${updatedNotes ? ', ' + updatedNotes : ''}`;
                    }
                    handleExerciseUpdate(index, 'notes', updatedNotes);
                  }}
                />
              </div>
              <div>
                <FormLabel htmlFor={`duration-${index}`}>Duration (HH:MM:SS)</FormLabel>
                <Input
                  id={`duration-${index}`}
                  value={duration}
                  placeholder="00:30:00"
                  pattern="^([0-9]{1,2}:)?[0-5][0-9]:[0-5][0-9]$"
                  onChange={(e) => {
                    let updatedNotes = exercise.notes || '';
                    if (updatedNotes.includes('Duration:')) {
                      updatedNotes = updatedNotes.replace(/Duration: [^,]+/, `Duration: ${e.target.value}`);
                    } else {
                      updatedNotes = `Duration: ${e.target.value}${updatedNotes ? ', ' + updatedNotes : ''}`;
                    }
                    handleExerciseUpdate(index, 'notes', updatedNotes);
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">Format: HH:MM:SS or MM:SS</p>
              </div>
              <div>
                <FormLabel htmlFor={`location-${index}`}>Location</FormLabel>
                <Select
                  value={location}
                  onValueChange={(value) => {
                    let updatedNotes = exercise.notes || '';
                    if (updatedNotes.includes('Location:')) {
                      updatedNotes = updatedNotes.replace(/Location: (indoor|outdoor)/, `Location: ${value}`);
                    } else {
                      updatedNotes = `Location: ${value}${updatedNotes ? ', ' + updatedNotes : ''}`;
                    }
                    handleExerciseUpdate(index, 'notes', updatedNotes);
                  }}
                >
                  <SelectTrigger id={`location-${index}`}>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indoor">Indoor</SelectItem>
                    <SelectItem value="outdoor">Outdoor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
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
          )}
          <div className="mt-3">
            <FormLabel htmlFor={`notes-${index}`}>Notes (Optional)</FormLabel>
            <Textarea
              id={`notes-${index}`}
              value={isCardio ? notes : (exercise.notes || "")}
              placeholder="Additional instructions or cues"
              onChange={(e) => handleExerciseUpdate(index, 'notes', e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    
    try {
      if (mode === 'create') {
        const newWorkout = await createWorkout({
          week_id: weekId,
          title: values.title,
          description: values.description || null,
          workout_type: values.workout_type,
          priority: values.priority
        });
        
        for (const [index, exercise] of workoutExercises.entries()) {
          await createWorkoutExercise({
            workout_id: newWorkout.id,
            exercise_id: exercise.exercise_id,
            sets: exercise.sets,
            reps: exercise.reps,
            rest_seconds: exercise.rest_seconds,
            notes: exercise.notes,
            order_index: index
          });
        }
        
        toast.success('Workout created successfully');
        onSave(newWorkout.id);
      } else if (workoutId) {
        await updateWorkout(workoutId, {
          title: values.title,
          description: values.description || null,
          workout_type: values.workout_type,
          priority: values.priority
        });
        
        toast.success('Workout updated successfully');
        onSave(workoutId);
      }
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

  const generatePriorityOptions = () => {
    const count = mode === 'create' ? workoutsInWeek + 1 : workoutsInWeek;
    return Array.from({ length: count }, (_, i) => i);
  };

  return (
    <div className="max-w-screen-lg mx-auto">
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
          
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value.toString()}
                  value={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {generatePriorityOptions().map((priority) => (
                      <SelectItem key={priority} value={priority.toString()}>
                        {priority === 0 ? "Default" : `Priority ${priority}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
                <p className="text-xs text-muted-foreground mt-1">
                  Determines the order workouts appear for clients. Lower numbers appear first.
                </p>
              </FormItem>
            )}
          />
          
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
                {workoutExercises.map((exercise, index) => renderExerciseForm(exercise, index))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onSave(workoutId || "")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : (mode === 'edit' ? "Update Workout" : "Create Workout")}
            </Button>
          </div>
        </form>
      </Form>
      
      <ExerciseSelector
        onSelectExercise={handleExerciseAdd}
        onClose={() => setIsSelectorOpen(false)}
        isOpen={isSelectorOpen}
      />
    </div>
  );
};

export default WorkoutDayForm;
