
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  fetchCustomWorkouts, 
  fetchCustomWorkoutExercises,
  deleteCustomWorkout,
  moveCustomWorkoutExerciseUp,
  moveCustomWorkoutExerciseDown,
  updateCustomWorkout,
  CustomWorkout,
  CustomWorkoutExercise
} from '@/services/clients/custom-workout';

export const useWorkoutDetail = (workoutId: string | undefined) => {
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<CustomWorkout | null>(null);
  const [exercises, setExercises] = useState<CustomWorkoutExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDuration, setEditDuration] = useState<number | null>(null);
  const [editWorkoutType, setEditWorkoutType] = useState<string>('strength');

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
        
        // Initialize edit form state
        setEditTitle(currentWorkout.title);
        setEditDescription(currentWorkout.description || '');
        setEditDuration(currentWorkout.duration_minutes);
        setEditWorkoutType(currentWorkout.workout_type || 'strength');
        
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

  const handleSaveWorkout = async () => {
    if (!workoutId || !workout) return;
    
    try {
      setIsSaving(true);
      
      const updatedWorkout = await updateCustomWorkout(workoutId, {
        title: editTitle,
        description: editDescription || null,
        duration_minutes: editDuration,
        workout_type: editWorkoutType
      });
      
      setWorkout(updatedWorkout);
      setIsEditing(false);
      toast.success('Workout updated successfully');
    } catch (error) {
      console.error('Error updating workout:', error);
      toast.error('Failed to update workout');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form to current workout values
    if (workout) {
      setEditTitle(workout.title);
      setEditDescription(workout.description || '');
      setEditDuration(workout.duration_minutes);
      setEditWorkoutType(workout.workout_type || 'strength');
    }
    setIsEditing(false);
  };
  
  return {
    workout,
    exercises,
    isLoading,
    isDeleting,
    isReordering,
    isEditing,
    isSaving,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editDuration,
    setEditDuration,
    editWorkoutType,
    setEditWorkoutType,
    handleDeleteWorkout,
    handleMoveExerciseUp,
    handleMoveExerciseDown,
    handleSaveWorkout,
    handleCancelEdit,
    setIsEditing,
    navigate
  };
};
