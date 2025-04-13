
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
import { 
  fetchWorkoutWeek, 
  updateWorkoutWeek,
  fetchWorkoutsForWeek,
  createWorkout,
  updateWorkout
} from '@/services/workout-service';
import { deleteWorkout } from '@/services/workout-delete-service';
import { Workout } from '@/types/workout';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
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
import { EditWeekMetricsForm } from '@/components/coach/EditWeekMetricsForm';

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
      } catch (error) {
        console.error('Error loading week details:', error);
        toast.error('Failed to load week details');
      } finally {
        setIsLoading(false);
      }
    };

    loadWeekDetails();
  }, [weekId]);

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
          <CardHeader>
            <CardTitle>Week Details</CardTitle>
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
            <Button size="sm" onClick={() => setIsWorkoutModalOpen(true)}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Workout
            </Button>
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
                    <TableCell className="text-right">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
