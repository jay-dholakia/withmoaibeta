import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchWorkoutProgram,
  updateWorkoutProgram,
  deleteWorkoutProgram,
  fetchWorkoutWeeks
} from '@/services/program-service';
import {
  fetchWorkoutsByWeekId,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  createWorkouts,
  Workout as WorkoutType
} from '@/services/workout-service';
import { WorkoutDay } from '@/components/coach/WorkoutDay';
import { WorkoutWeekForm } from '@/components/coach/WorkoutWeekForm';
import { WorkoutForm } from '@/components/coach/WorkoutForm';

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  program_type: z.enum(['strength', 'run']).default('strength'),
  weeks: z.number().min(1, {
    message: "Weeks must be at least 1.",
  }),
})

const WorkoutProgramDetailPage: React.FC = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [program, setProgram] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [weeks, setWeeks] = useState<any[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutType[]>([]);
  const [isCreatingWeek, setIsCreatingWeek] = useState(false);
  const [isCreatingWorkout, setIsCreatingWorkout] = useState(false);
  const [nextPriority, setNextPriority] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      program_type: 'strength',
      weeks: 4
    },
  })

  useEffect(() => {
    const loadProgramDetails = async () => {
      if (!programId) return;

      setIsLoading(true);
      try {
        const programData = await fetchWorkoutProgram(programId);
        setProgram(programData);

        form.setValue('title', programData.title);
        form.setValue('description', programData.description || '');
        form.setValue('program_type', programData.program_type || 'strength');
        form.setValue('weeks', programData.weeks);
      } catch (error) {
        console.error('Error loading program details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgramDetails();
  }, [programId, form]);

  useEffect(() => {
    const loadWeeks = async () => {
      if (!programId) return;

      try {
        const weeksData = await fetchWorkoutWeeks(programId);
        setWeeks(weeksData);
      } catch (error) {
        console.error('Error loading weeks:', error);
      }
    };

    loadWeeks();
  }, [programId]);

  useEffect(() => {
    const loadWorkouts = async () => {
      if (!selectedWeekId) return;

      try {
        const workoutsData = await fetchWorkoutsByWeekId(selectedWeekId);
        setWorkouts(workoutsData || []);
      } catch (error) {
        console.error('Error loading workouts:', error);
      }
    };

    loadWorkouts();
  }, [selectedWeekId]);

  useEffect(() => {
    // Calculate the next available priority when workouts change
    if (workouts && workouts.length > 0) {
      const maxPriority = workouts.reduce((max, workout) => {
        return workout.priority && workout.priority > max ? workout.priority : max;
      }, 0);
      setNextPriority(maxPriority + 1);
    } else {
      setNextPriority(0);
    }
  }, [workouts]);

  const handleWeekSelect = (weekId: string) => {
    setSelectedWeekId(weekId);
  };

  const handleUpdateProgram = async (values: any) => {
    if (!programId) return;

    try {
      setIsLoading(true);
      await updateWorkoutProgram(programId, {
        title: values.title,
        description: values.description,
        program_type: values.program_type,
        weeks: values.weeks
      });

      setProgram({
        ...program,
        title: values.title,
        description: values.description,
        program_type: values.program_type,
        weeks: values.weeks
      });
      toast.success('Program updated successfully');
    } catch (error) {
      console.error('Error updating program:', error);
      toast.error('Failed to update program');
    } finally {
      setIsLoading(false);
      setIsEditing(false);
    }
  };

  const handleDeleteProgram = async () => {
    if (!programId) return;

    try {
      setIsDeleting(true);
      await deleteWorkoutProgram(programId);
      toast.success('Program deleted successfully');
      navigate('/coach-dashboard/workouts');
    } catch (error) {
      console.error('Error deleting program:', error);
      toast.error('Failed to delete program');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateWeek = async (values: any) => {
    if (!programId) return;

    setIsCreatingWeek(true);
    try {
      // Create week
      // toast.success('Workout week created successfully');
      await loadWeeksData();
    } catch (error) {
      console.error('Error creating workout week:', error);
      toast.error('Failed to create workout week');
    } finally {
      setIsCreatingWeek(false);
    }
  };

  const loadWeeksData = async () => {
    if (!programId) return;

    try {
      const weeksData = await fetchWorkoutWeeks(programId);
      setWeeks(weeksData);
    } catch (error) {
      console.error('Error loading weeks:', error);
    }
  };

  const handleUpdateWorkout = async (workoutId: string, values: any) => {
    try {
      await updateWorkout(workoutId, values);
      toast.success('Workout updated successfully');
      await loadWorkoutsData();
    } catch (error) {
      console.error('Error updating workout:', error);
      toast.error('Failed to update workout');
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      await deleteWorkout(workoutId);
      toast.success('Workout deleted successfully');
      await loadWorkoutsData();
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast.error('Failed to delete workout');
    }
  };

  const loadWorkoutsData = async () => {
    if (!selectedWeekId) return;

    try {
      const workoutsData = await fetchWorkoutsByWeekId(selectedWeekId);
      setWorkouts(workoutsData || []);
    } catch (error) {
      console.error('Error loading workouts:', error);
    }
  };

  const createWorkoutsFormSchema = z.object({
    workouts: z.array(
      z.object({
        week_id: z.string(),
        title: z.string(),
        description: z.string().optional(),
        workout_type: z.enum(['strength', 'cardio', 'flexibility', 'mobility']),
        priority: z.number(),
        day_of_week: z.number()
      })
    )
  });

  const createWorkouts = async () => {
    if (!selectedWeekId) return;

    setIsCreatingWorkout(true);
    try {
      // Get template days
      const templateDays = [
        { title: 'Monday', description: 'Strength Training', workout_type: 'strength' },
        { title: 'Tuesday', description: 'Cardio', workout_type: 'cardio' },
        { title: 'Wednesday', description: 'Rest or Active Recovery', workout_type: 'flexibility' },
        { title: 'Thursday', description: 'Strength Training', workout_type: 'strength' },
        { title: 'Friday', description: 'Cardio', workout_type: 'cardio' },
        { title: 'Saturday', description: 'Active Recovery', workout_type: 'mobility' },
        { title: 'Sunday', description: 'Rest', workout_type: 'flexibility' },
      ];

      // Create batch of default workouts for the week
      const defaultWorkouts = templateDays.map((day, index) => ({
        week_id: selectedWeekId,
        title: day.title,
        description: day.description,
        workout_type: day.workout_type,
        priority: index,
        day_of_week: index + 1 // Add the day_of_week property
      }));

      // Validate the workouts array against the schema
      const validatedWorkouts = createWorkoutsFormSchema.safeParse({ workouts: defaultWorkouts });

      if (!validatedWorkouts.success) {
        console.error("Validation Error", validatedWorkouts.error);
        toast.error("Validation failed. Check console for details.");
        return;
      }

      // If validation passes, proceed to create the workouts
      await createWorkouts(validatedWorkouts.data.workouts);

      toast.success('Default workouts created successfully');
      await loadWorkoutsData();
    } catch (error) {
      console.error('Error creating default workouts:', error);
      toast.error('Failed to create default workouts');
    } finally {
      setIsCreatingWorkout(false);
    }
  };

  const workoutFormSchema = z.object({
    week_id: z.string(),
    title: z.string().min(2, {
      message: "Title must be at least 2 characters.",
    }),
    description: z.string().optional(),
    workout_type: z.enum(['strength', 'cardio', 'flexibility', 'mobility']).default('strength'),
    priority: z.number(),
    day_of_week: z.number()
  });

  const createWorkout = async () => {
    if (!selectedWeekId) return;

    setIsCreatingWorkout(true);
    try {
      const workoutForm = useForm<z.infer<typeof workoutFormSchema>>({
        resolver: zodResolver(workoutFormSchema),
        defaultValues: {
          week_id: selectedWeekId,
          title: 'New Workout',
          description: '',
          workout_type: 'strength',
          priority: nextPriority,
          day_of_week: nextPriority + 1 // Add the day_of_week property
        },
      });

      const formData = workoutForm.getValues();

      const newWorkout = {
        week_id: selectedWeekId,
        title: formData.title,
        description: formData.description,
        workout_type: formData.workout_type,
        priority: nextPriority,
        day_of_week: nextPriority + 1 // Add the day_of_week property
      };

      await createWorkout(newWorkout);

      toast.success('Workout created successfully');
      await loadWorkoutsData();
    } catch (error) {
      console.error('Error creating workout:', error);
      toast.error('Failed to create workout');
    } finally {
      setIsCreatingWorkout(false);
    }
  };

  if (isLoading) {
    return (
      <CoachLayout>
        <div className="container mx-auto p-4">
          Loading program details...
        </div>
      </CoachLayout>
    );
  }

  if (!program) {
    return (
      <CoachLayout>
        <div className="container mx-auto p-4">
          Program not found
        </div>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout>
      <div className="container mx-auto p-4">
        <Button variant="ghost" onClick={() => navigate('/coach-dashboard/workouts')}>
          Back to Programs
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{program.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details" className="w-full space-y-4">
              <TabsList>
                <TabsTrigger value="details">Program Details</TabsTrigger>
                <TabsTrigger value="weeks">Workout Weeks</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                {isEditing ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleUpdateProgram)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Workout Program Title" {...field} />
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
                              <Input placeholder="Workout Program Description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="program_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Program Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a program type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="strength">Strength</SelectItem>
                                <SelectItem value="run">Run</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              This is the program type.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="weeks"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weeks</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Number of Weeks" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end">
                        <Button variant="ghost" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              Updating <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                            </>
                          ) : 'Update Program'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <>
                    <p>Description: {program.description || 'No description'}</p>
                    <p>Weeks: {program.weeks}</p>
                    <p>Type: {program.program_type}</p>
                    <div className="flex gap-2">
                      <Button onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Program
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Program
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete this program and remove all of its data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction disabled={isDeleting} onClick={handleDeleteProgram}>
                              {isDeleting ? (
                                <>
                                  Deleting <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                </>
                              ) : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="weeks">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Workout Weeks</h2>
                    <Button onClick={() => setIsCreatingWeek(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Week
                    </Button>
                  </div>

                  {isCreatingWeek && (
                    <Card>
                      <CardContent>
                        <WorkoutWeekForm
                          programId={programId}
                          onCreate={handleCreateWeek}
                          onCancel={() => setIsCreatingWeek(false)}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {weeks.length === 0 ? (
                    <Card>
                      <CardContent className="text-center">
                        No workout weeks created yet.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {weeks.map((week) => (
                        <Card
                          key={week.id}
                          className={`cursor-pointer ${selectedWeekId === week.id ? 'border-2 border-primary' : ''}`}
                          onClick={() => handleWeekSelect(week.id)}
                        >
                          <CardHeader>
                            <CardTitle>Week {week.week_number}</CardTitle>
                            <CardDescription>{week.title}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p>Start Date: {week.start_date}</p>
                            <p>End Date: {week.end_date}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {selectedWeekId && (
                  <div className="mt-8 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-semibold">Workouts for Week</h3>
                      <div className="flex gap-2">
                        <Button onClick={createWorkouts} disabled={isCreatingWorkout}>
                          {isCreatingWorkout ? (
                            <>
                              Creating <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Create Default Workouts
                            </>
                          )}
                        </Button>
                        <Button onClick={createWorkout} disabled={isCreatingWorkout}>
                          {isCreatingWorkout ? (
                            <>
                              Creating <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Create Workout
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {workouts.length === 0 ? (
                      <Card>
                        <CardContent className="text-center">
                          No workouts created for this week yet.
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {workouts.map((workout) => (
                          <WorkoutDay
                            key={workout.id}
                            workout={workout}
                            onUpdate={handleUpdateWorkout}
                            onDelete={handleDeleteWorkout}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </CoachLayout>
  );
};

export default WorkoutProgramDetailPage;
