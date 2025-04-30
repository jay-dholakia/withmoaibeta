import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, Plus, Loader2, RefreshCw, AlertTriangle, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { 
  fetchWorkout, 
  updateWorkout, 
  fetchWorkoutExercises, 
  createWorkoutExercise,
  deleteWorkoutExercise,
  moveWorkoutExerciseUp,
  moveWorkoutExerciseDown,
  fetchStandaloneWorkout
} from '@/services/workout-service';
import { toast } from 'sonner';
import { Workout } from '@/types/workout';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { ExerciseSelector } from '@/components/coach/ExerciseSelector';
import { Exercise } from '@/types/workout';
import { supabase } from "@/integrations/supabase/client";
import { syncTemplateExercisesToProgramWorkouts } from "@/services/program-service";

const EditWorkoutPage = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [templateDetails, setTemplateDetails] = useState<any>(null);
  const [isTemplateRefreshDialogOpen, setIsTemplateRefreshDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [workoutType, setWorkoutType] = useState<"cardio" | "strength" | "mobility" | "flexibility">('strength');
  const [priority, setPriority] = useState(0);

  useEffect(() => {
    const loadWorkoutDetails = async () => {
      if (!workoutId) return;

      try {
        setIsLoading(true);
        console.log("Fetching workout data for ID:", workoutId);
        
        const workoutData = await fetchWorkout(workoutId);
        
        if (workoutData) {
          console.log("Workout data received:", workoutData);
          setWorkout(workoutData);
          setTitle(workoutData.title || '');
          setDescription(workoutData.description || '');
          setDayOfWeek(workoutData.day_of_week || 1);
          setWorkoutType(workoutData.workout_type as any || 'strength');
          setPriority(workoutData.priority || 0);
          
          if (workoutData.template_id) {
            try {
              const templateData = await fetchStandaloneWorkout(workoutData.template_id);
              setTemplateDetails(templateData);
              console.log("Template data:", templateData);
            } catch (err) {
              console.error("Error loading template details:", err);
            }
          }
          
          const exercisesData = await fetchWorkoutExercises(workoutId);
          console.log("Exercises data received:", exercisesData);
          setExercises(exercisesData || []);
        } else {
          toast.error('Workout not found');
          navigate(-1);
        }
      } catch (error) {
        console.error('Error loading workout details:', error);
        toast.error('Failed to load workout details');
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkoutDetails();
  }, [workoutId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workoutId) return;

    try {
      setIsSaving(true);

      await updateWorkout(workoutId, {
        title,
        description: description || null,
        day_of_week: dayOfWeek,
        workout_type: workoutType,
        priority
      });

      toast.success('Workout updated successfully');
      
      if (workout?.week_id) {
        navigate(`/workout-weeks/${workout.week_id}`);
      } else {
        navigate(-1);
      }
    } catch (error) {
      console.error('Error updating workout:', error);
      toast.error('Failed to update workout');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackClick = () => {
    if (workout?.week_id) {
      navigate(`/workout-weeks/${workout.week_id}`);
    } else {
      navigate(-1);
    }
  };

  const handleSelectExercise = (exercise: Exercise) => {
    console.log("Exercise selected:", exercise);
    // This is no longer used as we're using the legacy flow
  };

  const handleSaveExercise = async (exerciseId: string, data: any) => {
    if (!workoutId) return;
    
    try {
      setIsSubmitting(true);
      
      await createWorkoutExercise({
        workout_id: workoutId,
        exercise_id: exerciseId,
        sets: data.sets || 3,
        reps: data.reps || "8-12",
        rest_seconds: data.rest_seconds || 60,
        notes: data.notes || "",
        order_index: exercises.length
      });
      
      const updatedExercises = await fetchWorkoutExercises(workoutId);
      setExercises(updatedExercises);
      
      setIsAddingExercise(false);
      toast.success('Exercise added successfully');
    } catch (error) {
      console.error('Error adding exercise:', error);
      toast.error('Failed to add exercise');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!workoutId) return;
    
    try {
      setIsSubmitting(true);
      
      await deleteWorkoutExercise(exerciseId);
      
      const updatedExercises = await fetchWorkoutExercises(workoutId);
      setExercises(updatedExercises);
      
      toast.success('Exercise removed from workout');
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast.error('Failed to remove exercise');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveExerciseUp = async (exerciseId: string) => {
    if (!workoutId) return;
    
    try {
      setIsSubmitting(true);
      console.log("Moving exercise up:", exerciseId);
      
      const result = await moveWorkoutExerciseUp(exerciseId, workoutId);
      console.log("Move up result:", result);
      
      const updatedExercises = await fetchWorkoutExercises(workoutId);
      setExercises(updatedExercises);
      
      toast.success('Exercise moved up');
    } catch (error) {
      console.error('Error moving exercise up:', error);
      toast.error('Failed to reorder exercise');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveExerciseDown = async (exerciseId: string) => {
    if (!workoutId) return;
    
    try {
      setIsSubmitting(true);
      console.log("Moving exercise down:", exerciseId);
      
      const result = await moveWorkoutExerciseDown(exerciseId, workoutId);
      console.log("Move down result:", result);
      
      const updatedExercises = await fetchWorkoutExercises(workoutId);
      setExercises(updatedExercises);
      
      toast.success('Exercise moved down');
    } catch (error) {
      console.error('Error moving exercise down:', error);
      toast.error('Failed to reorder exercise');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefreshFromTemplate = async () => {
    if (!workout?.template_id) return;
    
    try {
      await syncTemplateExercisesToProgramWorkouts(workout.template_id);
      toast.success('Workout exercises refreshed from template');
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing from template:', error);
      toast.error('Failed to refresh from template');
    }
  };

  if (isLoading) {
    return (
      <CoachLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout>
      <div className="container mx-auto px-4 py-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="mb-6 gap-1" 
          onClick={handleBackClick}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        <h1 className="text-2xl font-bold mb-6">Edit Workout</h1>
        
        {workout?.template_id && templateDetails && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <AlertTriangle className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-800">Template-Based Workout</h3>
                <p className="text-sm mt-1 text-blue-700">
                  This workout is based on template "{templateDetails.title}". 
                  Changes made to the template will be automatically available for new program assignments.
                </p>
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-blue-700 border-blue-300 hover:bg-blue-100"
                    onClick={() => setIsTemplateRefreshDialogOpen(true)}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh From Template
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form id="workout-form" onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description || ''}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="day-of-week">Day of Week</Label>
                <Select 
                  value={String(dayOfWeek)} 
                  onValueChange={(value) => setDayOfWeek(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 7 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        Day {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="workout-type">Workout Type</Label>
                <Select 
                  value={workoutType} 
                  onValueChange={(value) => setWorkoutType(value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strength">Strength</SelectItem>
                    <SelectItem value="cardio">Cardio</SelectItem>
                    <SelectItem value="mobility">Mobility</SelectItem>
                    <SelectItem value="flexibility">Flexibility</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority (1 = highest)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="0"
                  value={priority || 0}
                  onChange={(e) => setPriority(Number(e.target.value))}
                />
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleBackClick}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="workout-form"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Exercises</CardTitle>
            <Button 
              onClick={() => setIsAddingExercise(true)}
              size="sm"
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Exercise
            </Button>
          </CardHeader>
          <CardContent>
            {exercises.length > 0 ? (
              <div className="space-y-4">
                {exercises.map((exercise: any, index: number) => (
                  <div key={exercise.id} className="border p-4 rounded-md shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{index + 1}. {exercise.exercise?.name || 'Exercise'}</h3>
                        <div className="text-sm text-muted-foreground mt-1">
                          {exercise.sets} sets × {exercise.reps} reps
                          {exercise.rest_seconds ? ` (${exercise.rest_seconds}s rest)` : ''}
                        </div>
                        {exercise.notes && (
                          <div className="text-sm mt-2 border-l-2 pl-2 border-muted">{exercise.notes}</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleMoveExerciseUp(exercise.id)}
                          disabled={index === 0 || isSubmitting}
                        >
                          Move Up
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleMoveExerciseDown(exercise.id)}
                          disabled={index === exercises.length - 1 || isSubmitting}
                        >
                          Move Down
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteExercise(exercise.id)}
                          disabled={isSubmitting}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No exercises added yet</p>
                <p className="mt-2">Add exercises to build out this workout</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={isAddingExercise} onOpenChange={(open) => !open && setIsAddingExercise(false)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Exercise to Workout</DialogTitle>
          </DialogHeader>
          <ExerciseSelector
            onSelectExercise={() => {}} // We're using the legacy onSelect flow
            onSelect={handleSaveExercise}
            onCancel={() => setIsAddingExercise(false)}
            isSubmitting={isSubmitting}
            buttonText="Add Exercise"
          />
        </DialogContent>
      </Dialog>
      
      <Dialog 
        open={isTemplateRefreshDialogOpen} 
        onOpenChange={setIsTemplateRefreshDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Refresh From Template</DialogTitle>
            <DialogDescription>
              This will replace all exercises in this workout with the current exercises from the template.
              Any custom modifications made to this specific workout will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsTemplateRefreshDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRefreshFromTemplate}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Exercises
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CoachLayout>
  );
};

export default EditWorkoutPage;
