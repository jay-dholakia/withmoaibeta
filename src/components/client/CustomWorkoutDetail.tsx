
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Trash2, ArrowUp, ArrowDown, Save, Edit, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  fetchCustomWorkouts,
  fetchCustomWorkoutExercises,
  deleteCustomWorkout,
  updateCustomWorkout,
  moveCustomWorkoutExerciseUp,
  moveCustomWorkoutExerciseDown,
  CustomWorkout,
  CustomWorkoutExercise
} from '@/services/client-custom-workout-service';
import { WorkoutTypeIcon, WORKOUT_TYPES } from './WorkoutTypeIcon';
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
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CustomWorkoutDetail = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<CustomWorkout | null>(null);
  const [exercises, setExercises] = useState<CustomWorkoutExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  
  // Add edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editWorkoutType, setEditWorkoutType] = useState('');
  const [editDurationMinutes, setEditDurationMinutes] = useState<number | null>(null);

  useEffect(() => {
    const loadWorkoutDetails = async () => {
      if (!workoutId) return;
      
      try {
        setIsLoading(true);
        
        // Fetch workout details
        const workouts = await fetchCustomWorkouts();
        const currentWorkout = workouts.find(w => w.id === workoutId);
        
        if (!currentWorkout) {
          toast.error('Workout not found');
          navigate('/client-dashboard/workouts');
          return;
        }
        
        setWorkout(currentWorkout);
        setEditTitle(currentWorkout.title);
        setEditDescription(currentWorkout.description || '');
        setEditWorkoutType(currentWorkout.workout_type || 'custom');
        setEditDurationMinutes(currentWorkout.duration_minutes);
        
        // Fetch workout exercises
        const exercisesData = await fetchCustomWorkoutExercises(workoutId);
        setExercises(exercisesData);
      } catch (error) {
        console.error('Error loading workout details:', error);
        toast.error('Failed to load workout details');
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkoutDetails();
  }, [workoutId, navigate]);

  const handleDeleteWorkout = async () => {
    if (!workoutId) return;
    
    try {
      setIsDeleting(true);
      await deleteCustomWorkout(workoutId);
      toast.success('Workout deleted successfully');
      navigate('/client-dashboard/workouts');
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast.error('Failed to delete workout');
      setIsDeleting(false);
    }
  };

  const handleMoveExerciseUp = async (exerciseId: string) => {
    if (!workoutId) return;
    
    try {
      setIsReordering(true);
      const updatedExercises = await moveCustomWorkoutExerciseUp(exerciseId, workoutId);
      setExercises(updatedExercises);
    } catch (error) {
      console.error('Error moving exercise up:', error);
      toast.error('Failed to reorder exercise');
    } finally {
      setIsReordering(false);
    }
  };

  const handleMoveExerciseDown = async (exerciseId: string) => {
    if (!workoutId) return;
    
    try {
      setIsReordering(true);
      const updatedExercises = await moveCustomWorkoutExerciseDown(exerciseId, workoutId);
      setExercises(updatedExercises);
    } catch (error) {
      console.error('Error moving exercise down:', error);
      toast.error('Failed to reorder exercise');
    } finally {
      setIsReordering(false);
    }
  };

  // Add save workout details function
  const handleSaveWorkout = async () => {
    if (!workoutId || !editTitle.trim()) return;
    
    try {
      setIsSaving(true);
      
      const updateData = {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        workout_type: editWorkoutType,
        duration_minutes: editDurationMinutes
      };
      
      const updatedWorkout = await updateCustomWorkout(workoutId, updateData);
      setWorkout(updatedWorkout);
      setIsEditMode(false);
      toast.success('Workout updated successfully');
    } catch (error) {
      console.error('Error updating workout:', error);
      toast.error('Failed to update workout');
    } finally {
      setIsSaving(false);
    }
  };

  // Add cancel edit function
  const handleCancelEdit = () => {
    if (workout) {
      setEditTitle(workout.title);
      setEditDescription(workout.description || '');
      setEditWorkoutType(workout.workout_type || 'custom');
      setEditDurationMinutes(workout.duration_minutes);
    }
    setIsEditMode(false);
  };

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <p className="text-muted-foreground">Loading workout details...</p>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="py-12 flex justify-center">
        <p className="text-muted-foreground">Workout not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/client-dashboard/workouts')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workouts
        </Button>
        
        <div className="flex gap-2">
          {!isEditMode ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditMode(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Workout
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancelEdit}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleSaveWorkout}
                disabled={isSaving || !editTitle.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the custom workout and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteWorkout}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div>
        {isEditMode ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="text-sm font-medium">Workout Title</label>
              <Input
                id="title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mt-1"
                placeholder="Enter workout title"
              />
            </div>
            
            <div>
              <label htmlFor="workout-type" className="text-sm font-medium">Workout Type</label>
              <Select 
                value={editWorkoutType} 
                onValueChange={setEditWorkoutType}
              >
                <SelectTrigger id="workout-type" className="mt-1">
                  <SelectValue placeholder="Select workout type" />
                </SelectTrigger>
                <SelectContent>
                  {WORKOUT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <span>✨</span>
                      <span>Custom</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="duration" className="text-sm font-medium">Duration (minutes)</label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={editDurationMinutes || ''}
                onChange={(e) => setEditDurationMinutes(e.target.value ? Number(e.target.value) : null)}
                className="mt-1"
                placeholder="Enter duration in minutes"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <Textarea
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="mt-1"
                placeholder="Enter workout description"
                rows={3}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold">{workout.title}</h1>
              {workout.workout_type && (
                <div className="bg-gray-100 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                  <WorkoutTypeIcon type={workout.workout_type as any} />
                  <span className="capitalize">{workout.workout_type}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center text-muted-foreground mb-4">
              {workout.duration_minutes && (
                <div className="flex items-center mr-4">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{workout.duration_minutes} minutes</span>
                </div>
              )}
              <div>Created: {new Date(workout.created_at).toLocaleDateString()}</div>
            </div>
            
            {workout.description && (
              <p className="text-muted-foreground mb-6">{workout.description}</p>
            )}
          </>
        )}
      </div>

      <Separator />
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Exercises</h2>
        
        {exercises.length === 0 ? (
          <p className="text-muted-foreground">No exercises found in this workout.</p>
        ) : (
          <div className="space-y-4">
            {exercises.map((exercise, index) => (
              <Card key={exercise.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">
                        {exercise.exercise?.name || exercise.custom_exercise_name || 'Unnamed Exercise'}
                      </h3>
                      
                      <div className="flex flex-wrap gap-x-4 mt-2 text-sm">
                        {exercise.sets && (
                          <div className="text-muted-foreground">
                            <span className="font-medium">Sets:</span> {exercise.sets}
                          </div>
                        )}
                        
                        {exercise.reps && (
                          <div className="text-muted-foreground">
                            <span className="font-medium">Reps:</span> {exercise.reps}
                          </div>
                        )}
                        
                        {exercise.rest_seconds && (
                          <div className="text-muted-foreground">
                            <span className="font-medium">Rest:</span> {exercise.rest_seconds}s
                          </div>
                        )}
                      </div>
                      
                      {exercise.notes && (
                        <div className="mt-2 text-sm">
                          <div className="font-medium">Notes:</div>
                          <p className="text-muted-foreground">{exercise.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-0 h-8 w-8" 
                        onClick={() => handleMoveExerciseUp(exercise.id)}
                        disabled={index === 0 || isReordering}
                      >
                        <ArrowUp className="h-4 w-4" />
                        <span className="sr-only">Move up</span>
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-0 h-8 w-8" 
                        onClick={() => handleMoveExerciseDown(exercise.id)}
                        disabled={index === exercises.length - 1 || isReordering}
                      >
                        <ArrowDown className="h-4 w-4" />
                        <span className="sr-only">Move down</span>
                      </Button>
                      
                      <div className="bg-muted h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground font-medium">
                        {index + 1}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomWorkoutDetail;
