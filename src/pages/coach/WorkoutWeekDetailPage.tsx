import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormEvent } from 'react';
import { toast } from 'sonner';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  fetchWorkoutWeek, 
  updateWorkoutWeek,
  fetchWorkoutsForWeek,
  createWorkout,
  updateWorkout,
  fetchStandaloneWorkouts
} from '@/services/workout-service';
import { deleteWorkout } from '@/services/workout-delete-service';
import { Workout } from '@/types/workout';
import { PlusCircle, Edit, Trash2, ChevronRight, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { EditWeekMetricsForm } from '@/components/coach/EditWeekMetricsForm';
import { CopyWorkoutWeekDialog } from '@/components/coach/CopyWorkoutWeekDialog';

interface RouteParams {
  [key: string]: string;
  weekId: string;
}

const WorkoutWeekDetailPage = () => {
  const { weekId } = useParams<RouteParams>();
  const navigate = useNavigate();

  const [weekData, setWeekData] = useState<any>(null);
  const [programType, setProgramType] = useState<'strength' | 'run'>('strength');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [editWorkoutId, setEditWorkoutId] = useState<string | null>(null);
  const [deleteWorkoutId, setDeleteWorkoutId] = useState<string | null>(null);
  const [isEditingMetrics, setIsEditingMetrics] = useState(false);
  const [allWeeks, setAllWeeks] = useState<any[]>([]);
  const [copyWorkoutId, setCopyWorkoutId] = useState<string | null>(null);
  const [copyTargetWeekId, setCopyTargetWeekId] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [isAddingFromTemplate, setIsAddingFromTemplate] = useState(false);
  const [standaloneWorkouts, setStandaloneWorkouts] = useState<any[]>([]);
  const [isCopyWeekModalOpen, setIsCopyWeekModalOpen] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const loadWeekDetails = async () => {
      if (!weekId) return;

      setIsLoading(true);
      try {
        const { data: week } = await supabase
          .from('workout_weeks')
          .select(`
            *,
            program:program_id (
              id,
              title,
              program_type
            )
          `)
          .eq('id', weekId)
          .single();
            
        setWeekData(week);
        console.log("Week data loaded:", week);
        
        if (week && week.program) {
          setProgramType(week.program.program_type === 'run' ? 'run' : 'strength');
        }

        const workoutsData = await fetchWorkoutsForWeek(weekId);
        setWorkouts(workoutsData);

        if (week && week.program && week.program.id) {
          const { data: allWeeksData, error: allWeeksError } = await supabase
            .from("workout_weeks")
            .select("*")
            .eq("program_id", week.program.id)
            .order("week_number", { ascending: true });

          if (!allWeeksError && allWeeksData) {
            setAllWeeks(allWeeksData);
          }
        }
      } catch (error) {
        console.error('Error loading week details:', error);
        toast.error('Failed to load week details');
      } finally {
        setIsLoading(false);
      }
    };

    loadWeekDetails();
  }, [weekId]);

  useEffect(() => {
    const loadTemplates = async () => {
      if (!user?.id) return;
      try {
        const templates = await fetchStandaloneWorkouts(user.id);
        setStandaloneWorkouts(templates);
      } catch (error) {
        console.error('Error loading workout templates:', error);
      }
    };

    if (isAddingFromTemplate) {
      loadTemplates();
    }
  }, [isAddingFromTemplate, user?.id]);

  const handleWeekUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!weekId || !weekData) return;

    setIsSaving(true);
    try {
      const updateData = programType === 'run' 
        ? {
            title: weekData.title,
            description: weekData.description,
            target_miles_run: weekData.target_miles_run,
            target_cardio_minutes: weekData.target_cardio_minutes,
          }
        : {
            title: weekData.title,
            description: weekData.description,
            target_cardio_minutes: weekData.target_cardio_minutes
          };

      await updateWorkoutWeek(weekId, updateData);
      toast.success('Week details updated successfully');
    } catch (error) {
      console.error('Error updating week details:', error);
      toast.error('Failed to update week details');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setWeekData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateWorkout = async (data: any) => {
    try {
      const workoutType = data.workout_type === 'strength' || data.workout_type === 'cardio' || 
                          data.workout_type === 'mobility' || data.workout_type === 'flexibility' 
                          ? data.workout_type 
                          : 'strength';
                          
      const newWorkout = await createWorkout({
        week_id: weekId!,
        title: data.title,
        description: data.description || null,
        day_of_week: data.day_of_week,
        workout_type: workoutType,
        priority: data.priority || 0
      });
      
      setWorkouts(prev => [...prev, newWorkout]);
      setIsWorkoutModalOpen(false);
      toast.success('Workout created successfully');
    } catch (error) {
      console.error('Error creating workout:', error);
      toast.error('Failed to create workout');
    }
  };

  const handleUpdateWorkout = async (workoutId: string, data: any) => {
    try {
      const workoutType = data.workout_type === 'strength' || data.workout_type === 'cardio' || 
                          data.workout_type === 'mobility' || data.workout_type === 'flexibility' 
                          ? data.workout_type 
                          : 'strength';

      await updateWorkout(workoutId, {
        title: data.title,
        description: data.description || null,
        day_of_week: data.day_of_week,
        workout_type: workoutType,
        priority: data.priority || 0
      });

      setWorkouts(prev =>
        prev.map(workout =>
          workout.id === workoutId ? { ...workout, ...data } : workout
        )
      );
      setEditWorkoutId(null);
      toast.success('Workout updated successfully');
    } catch (error) {
      console.error('Error updating workout:', error);
      toast.error('Failed to update workout');
    }
  };

  const handleDeleteWorkout = async () => {
    if (!deleteWorkoutId) return;
    
    try {
      await deleteWorkout(deleteWorkoutId);
      setWorkouts(prev => prev.filter(workout => workout.id !== deleteWorkoutId));
      setDeleteWorkoutId(null);
      toast.success('Workout deleted successfully');
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast.error('Failed to delete workout');
    }
  };

  const handleMetricsUpdate = () => {
    if (weekId) {
      setIsEditingMetrics(false);
      const loadWeekDetails = async () => {
        try {
          const { data: week } = await supabase
            .from('workout_weeks')
            .select(`
              *,
              program:program_id (
                id,
                title,
                program_type
              )
            `)
            .eq('id', weekId)
            .single();
              
          setWeekData(week);
        } catch (error) {
          console.error('Error reloading week details:', error);
        }
      };
      
      loadWeekDetails();
    }
  };

  const navigateToWorkoutEdit = (workoutId: string) => {
    navigate(`/workouts/${workoutId}/edit`);
  };

  const handleCopyWorkout = async () => {
    if (!copyWorkoutId || !copyTargetWeekId) return;
    setIsCopying(true);
    try {
      const { data: origWorkout, error: origError } = await supabase
        .from("workouts")
        .select("*")
        .eq("id", copyWorkoutId)
        .maybeSingle();
      if (origError || !origWorkout) throw new Error("Original workout not found");

      const { data: origExercises, error: exError } = await supabase
        .from("workout_exercises")
        .select("*")
        .eq("workout_id", copyWorkoutId);
      if (exError) throw new Error("Could not fetch workout exercises");

      const { data: newWorkout, error: newError } = await supabase
        .from("workouts")
        .insert([
          {
            week_id: copyTargetWeekId,
            title: origWorkout.title + " (Copy)",
            description: origWorkout.description,
            day_of_week: origWorkout.day_of_week,
            workout_type: origWorkout.workout_type,
            priority: origWorkout.priority,
          },
        ])
        .select()
        .maybeSingle();
      if (newError || !newWorkout) throw new Error("Could not create workout copy");

      if (origExercises && origExercises.length > 0) {
        const exerciseCopies = origExercises.map((ex: any) => ({
          sets: ex.sets,
          reps: ex.reps,
          order_index: ex.order_index,
          rest_seconds: ex.rest_seconds,
          notes: ex.notes,
          exercise_id: ex.exercise_id,
          workout_id: newWorkout.id,
          superset_order: ex.superset_order || null,
          superset_group_id: ex.superset_group_id || null,
        }));
        const { error: exerciseInsertError } = await supabase
          .from("workout_exercises")
          .insert(exerciseCopies);
        if (exerciseInsertError) throw new Error("Failed to copy workout exercises");
      }

      setWorkouts((prev) => [...prev, newWorkout]);
      setCopyWorkoutId(null);
      setCopyTargetWeekId(null);
      toast.success("Workout copied successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to copy workout");
    } finally {
      setIsCopying(false);
    }
  };

  const handleCopyFromTemplate = async (templateId: string) => {
    if (!weekId) return;
    
    try {
      const { data: origWorkout, error: origError } = await supabase
        .from("standalone_workouts")
        .select("*")
        .eq("id", templateId)
        .maybeSingle();
        
      if (origError || !origWorkout) throw new Error("Template workout not found");

      const { data: origExercises, error: exError } = await supabase
        .from("standalone_workout_exercises")
        .select("*")
        .eq("workout_id", templateId);
        
      if (exError) throw new Error("Could not fetch template exercises");

      let workoutType: "strength" | "cardio" | "mobility" | "flexibility" = "strength";
      if (origWorkout.workout_type === "cardio") workoutType = "cardio";
      if (origWorkout.workout_type === "mobility") workoutType = "mobility";
      if (origWorkout.workout_type === "flexibility") workoutType = "flexibility";
      
      const { data: newWorkout, error: newError } = await supabase
        .from("workouts")
        .insert({
          week_id: weekId,
          title: origWorkout.title,
          description: origWorkout.description,
          day_of_week: 1,
          workout_type: workoutType,
          priority: 0
        })
        .select()
        .single();
        
      if (newError || !newWorkout) throw new Error("Could not create workout");

      if (origExercises && origExercises.length > 0) {
        const exerciseCopies = origExercises.map((ex: any) => ({
          sets: ex.sets,
          reps: ex.reps,
          order_index: ex.order_index,
          rest_seconds: ex.rest_seconds,
          notes: ex.notes,
          exercise_id: ex.exercise_id,
          workout_id: newWorkout.id,
          superset_order: ex.superset_order || null,
          superset_group_id: ex.superset_group_id || null,
        }));

        const { error: exerciseInsertError } = await supabase
          .from("workout_exercises")
          .insert(exerciseCopies);
          
        if (exerciseInsertError) throw new Error("Failed to copy exercises");
      }

      const updatedWorkouts = await fetchWorkoutsForWeek(weekId);
      setWorkouts(updatedWorkouts);
      
      setIsAddingFromTemplate(false);
      toast.success("Workout added from template successfully");
    } catch (error: any) {
      console.error('Error copying workout:', error);
      toast.error(error.message || "Failed to copy workout");
    }
  };

  const handleCopyWeekComplete = () => {
    // Refresh workouts after a successful copy
    if (weekId) {
      setIsLoading(true);
      fetchWorkoutsForWeek(weekId)
        .then(workoutsData => {
          setWorkouts(workoutsData);
          toast.success("Workouts refreshed successfully");
        })
        .catch(error => {
          console.error('Error refreshing workouts:', error);
          toast.error("Failed to refresh workouts");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
    setIsCopyWeekModalOpen(false);
  };

  if (isLoading) {
    return (
      <CoachLayout>
        <div className="container mx-auto p-4">
          Loading week details...
        </div>
      </CoachLayout>
    );
  }

  if (!weekData) {
    return (
      <CoachLayout>
        <div className="container mx-auto p-4">
          Week not found
        </div>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout>
      <div className="container mx-auto p-4">
        <Button 
          variant="ghost" 
          onClick={() => {
            if (weekData?.program?.id) {
              navigate(`/coach-dashboard/workouts/${weekData.program.id}`);
            } else {
              navigate('/coach-dashboard/workouts');
            }
          }}
        >
          Back to Program
        </Button>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Week Details</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCopyWeekModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Week
            </Button>
          </CardHeader>
          <CardContent>
            {isEditingMetrics ? (
              <EditWeekMetricsForm
                weekId={weekId!}
                initialData={{
                  target_miles_run: weekData.target_miles_run,
                  target_cardio_minutes: weekData.target_cardio_minutes,
                  target_strength_mobility_workouts: weekData.target_strength_mobility_workouts,
                }}
                programType={programType}
                onSuccess={handleMetricsUpdate}
              />
            ) : (
              <form onSubmit={handleWeekUpdate} className="grid gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    type="text"
                    id="title"
                    name="title"
                    value={weekData.title || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    value={weekData.description || ''}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Weekly Targets</h3>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingMetrics(true)}>
                      Edit Targets
                    </Button>
                  </div>
                  
                  {programType === 'run' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium">Target Miles Run:</span>
                          <div className="mt-1">{weekData.target_miles_run || 0}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Target Strength/Mobility Workouts:</span>
                          <div className="mt-1">{weekData.target_strength_mobility_workouts || 0}</div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div>
                    <span className="text-sm font-medium">Target Cardio Minutes:</span>
                    <div className="mt-1">{weekData.target_cardio_minutes || 0}</div>
                  </div>
                  
                  {programType === 'strength' && (
                    <div className="text-sm text-muted-foreground mt-1">
                      <p>Strength workouts will be automatically calculated based on assigned workouts.</p>
                    </div>
                  )}
                </div>
                
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Update Week'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Workouts</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setIsAddingFromTemplate(true)}>
                Add from Template
              </Button>
              <Button size="sm" onClick={() => setIsWorkoutModalOpen(true)}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Workout
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Day of Week</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workouts.map((workout) => (
                  <TableRow key={workout.id}>
                    <TableCell>{workout.title}</TableCell>
                    <TableCell>{workout.day_of_week}</TableCell>
                    <TableCell>{workout.workout_type}</TableCell>
                    <TableCell className="text-right flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateToWorkoutEdit(workout.id)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteWorkoutId(workout.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCopyWorkoutId(workout.id)}
                        title="Copy Workout"
                      >
                        <ChevronRight className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {isAddingFromTemplate && (
          <Dialog open={isAddingFromTemplate} onOpenChange={setIsAddingFromTemplate}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Add Workout from Template</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
                {standaloneWorkouts.map((template) => (
                  <Card key={template.id} className="relative">
                    <CardHeader>
                      <CardTitle className="text-lg">{template.title}</CardTitle>
                      {template.category && (
                        <p className="text-sm text-muted-foreground">
                          Category: {template.category}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                      <div className="flex justify-end">
                        <Button 
                          onClick={() => handleCopyFromTemplate(template.id)}
                          size="sm"
                        >
                          Add to Week
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {standaloneWorkouts.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    No workout templates found. Create some in the Templates section.
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {copyWorkoutId && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>Copy Workout to Another Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium">Select Week</label>
                  <select
                    className="w-full border rounded p-2 text-sm"
                    value={copyTargetWeekId || ""}
                    onChange={e => setCopyTargetWeekId(e.target.value)}
                  >
                    <option value="" disabled>Select a week</option>
                    {allWeeks
                      .filter(wk => wk.id !== weekId) // cannot copy to same week
                      .map(wk => (
                        <option key={wk.id} value={wk.id}>
                          {wk.title ? `${wk.title} (${wk.week_number})` : `Week ${wk.week_number}`}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setCopyWorkoutId(null);
                      setCopyTargetWeekId(null);
                    }}
                    disabled={isCopying}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCopyWorkout}
                    disabled={!copyTargetWeekId || isCopying}
                  >
                    {isCopying ? "Copying..." : "Copy Workout"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isWorkoutModalOpen || editWorkoutId ? (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>{editWorkoutId ? 'Edit Workout' : 'Create Workout'}</CardTitle>
              </CardHeader>
              <CardContent>
                <WorkoutForm
                  weekId={weekId!}
                  workoutId={editWorkoutId}
                  onCreate={handleCreateWorkout}
                  onUpdate={handleUpdateWorkout}
                  onCancel={() => {
                    setIsWorkoutModalOpen(false);
                    setEditWorkoutId(null);
                  }}
                />
              </CardContent>
            </Card>
          </div>
        ) : null}

        <AlertDialog open={deleteWorkoutId !== null} onOpenChange={(open) => !open && setDeleteWorkoutId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Workout</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this workout? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteWorkout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {weekData && (
          <CopyWorkoutWeekDialog
            isOpen={isCopyWeekModalOpen}
            onClose={() => setIsCopyWeekModalOpen(false)}
            sourceWeekId={weekId!}
            sourceWeekNumber={weekData.week_number}
            allWeeks={allWeeks}
            onCopyComplete={handleCopyWeekComplete}
          />
        )}
      </div>
    </CoachLayout>
  );
};

interface WorkoutFormProps {
  weekId: string;
  workoutId: string | null;
  onCreate: (data: any) => void;
  onUpdate: (workoutId: string, data: any) => void;
  onCancel: () => void;
}

const WorkoutForm: React.FC<WorkoutFormProps> = ({ weekId, workoutId, onCreate, onUpdate, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [workoutType, setWorkoutType] = useState<"cardio" | "strength" | "mobility" | "flexibility">('strength');
  const [priority, setPriority] = useState(0);

  useEffect(() => {
    const loadWorkoutDetails = async () => {
      if (workoutId) {
        // const workout = await fetchWorkout(workoutId);
        // if (workout) {
        //   setTitle(workout.title);
        //   setDescription(workout.description || '');
        //   setDayOfWeek(workout.day_of_week);
        //   setWorkoutType(workout.workout_type);
        //   setPriority(workout.priority || 0);
        // }
      } else {
        setTitle('');
        setDescription('');
        setDayOfWeek(1);
        setWorkoutType('strength');
        setPriority(0);
      }
    };

    loadWorkoutDetails();
  }, [workoutId]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const data = {
      title,
      description,
      day_of_week: dayOfWeek,
      workout_type: workoutType,
      priority,
    };

    if (workoutId) {
      onUpdate(workoutId, data);
    } else {
      onCreate(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="dayOfWeek">Day of Week</Label>
        <Select value={String(dayOfWeek)} onValueChange={(value) => setDayOfWeek(Number(value))}>
          <SelectTrigger>
            <SelectValue placeholder="Select a day" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => (
              <SelectItem key={day} value={String(day)}>
                Day {day}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="workoutType">Workout Type</Label>
        <Select value={workoutType} onValueChange={(value) => setWorkoutType(value as "cardio" | "strength" | "mobility" | "flexibility")}>
          <SelectTrigger>
            <SelectValue placeholder="Select workout type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="strength">Strength</SelectItem>
            <SelectItem value="cardio">Cardio</SelectItem>
            <SelectItem value="mobility">Mobility</SelectItem>
            <SelectItem value="flexibility">Flexibility</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="priority">Priority</Label>
        <Input
          type="number"
          id="priority"
          value={String(priority)}
          onChange={(e) => setPriority(Number(e.target.value))}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{workoutId ? 'Update Workout' : 'Create Workout'}</Button>
      </div>
    </form>
  );
};

export default WorkoutWeekDetailPage;
