
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  fetchCustomWorkouts, 
  fetchCustomWorkout,
  fetchCustomWorkoutExercises,
  deleteCustomWorkout,
  moveCustomWorkoutExerciseUp,
  moveCustomWorkoutExerciseDown,
  updateCustomWorkout,
  CustomWorkout,
  CustomWorkoutExercise
} from '@/services/clients/custom-workout';
import { WorkoutType } from './types';

export const useWorkoutDetail = (workoutId: string | undefined) => {
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
  const [editDuration, setEditDuration] = useState<number | undefined>();
  const [editWorkoutType, setEditWorkoutType] = useState<WorkoutType>('custom');
  
  const navigate = useNavigate();

  // Load workout details
  useEffect(() => {
    if (!workoutId) {
      setIsLoading(false);
      return;
    }
    
    const fetchWorkoutDetails = async () => {
      try {
        setIsLoading(true);
        
        const workout = await fetchCustomWorkout(workoutId);
        if (!workout) {
          throw new Error('Workout not found');
        }
        
        setWorkout(workout);
        setEditTitle(workout.title);
        setEditDescription(workout.description || '');
        setEditDuration(workout.duration_minutes);
        setEditWorkoutType(workout.workout_type as WorkoutType || 'custom');
        
        const exercises = await fetchCustomWorkoutExercises(workoutId);
        setExercises(exercises);
      } catch (error) {
        console.error('Error fetching workout details:', error);
        toast.error('Failed to load workout details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWorkoutDetails();
  }, [workoutId]);

  // Handle delete workout
  const handleDeleteWorkout = async () => {
    if (!workoutId || !workout) return;
    
    try {
      setIsDeleting(true);
      await deleteCustomWorkout(workoutId);
      toast.success('Workout deleted successfully');
      navigate('/client-dashboard/workouts');
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast.error('Failed to delete workout');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle move exercise up
  const handleMoveExerciseUp = async (exerciseId: string) => {
    if (!workoutId) return;
    
    try {
      const updatedExercises = await moveCustomWorkoutExerciseUp(exerciseId, workoutId);
      setExercises(updatedExercises);
    } catch (error) {
      console.error('Error moving exercise up:', error);
      toast.error('Failed to update exercise order');
    }
  };

  // Handle move exercise down
  const handleMoveExerciseDown = async (exerciseId: string) => {
    if (!workoutId) return;
    
    try {
      const updatedExercises = await moveCustomWorkoutExerciseDown(exerciseId, workoutId);
      setExercises(updatedExercises);
    } catch (error) {
      console.error('Error moving exercise down:', error);
      toast.error('Failed to update exercise order');
    }
  };

  // Handle save workout
  const handleSaveWorkout = async () => {
    if (!workoutId) return;
    
    try {
      setIsSaving(true);
      
      await updateCustomWorkout(workoutId, {
        title: editTitle,
        description: editDescription || null,
        duration_minutes: editDuration,
        workout_type: editWorkoutType
      });
      
      // Fetch updated workout
      const updatedWorkout = await fetchCustomWorkout(workoutId);
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

  // Handle cancel edit
  const handleCancelEdit = () => {
    // Reset edit form state
    if (workout) {
      setEditTitle(workout.title);
      setEditDescription(workout.description || '');
      setEditDuration(workout.duration_minutes);
      setEditWorkoutType(workout.workout_type as WorkoutType || 'custom');
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
    setExercises, // Exposing setExercises for direct updates
    navigate
  };
};
