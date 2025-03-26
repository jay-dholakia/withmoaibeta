
import { fetchClientWorkoutHistory } from './client-workout-history-service';
import { fetchAssignedWorkouts } from './assigned-workouts-service';
import { supabase } from "@/integrations/supabase/client";
import { WorkoutExercise } from "@/types/workout";

// Re-export workout history related functions
export {
  fetchClientWorkoutHistory,
  fetchAssignedWorkouts
};

/**
 * Creates multiple workout exercises in a single batch operation
 */
export const createMultipleWorkoutExercises = async (exercises: Array<Omit<WorkoutExercise, 'id' | 'created_at'>>): Promise<WorkoutExercise[]> => {
  const { data, error } = await supabase
    .from('workout_exercises')
    .insert(exercises)
    .select();

  if (error) {
    console.error('Error creating multiple workout exercises:', error);
    throw error;
  }

  return data as WorkoutExercise[];
};

/**
 * Creates multiple standalone workout exercises in a single batch operation
 */
export const createMultipleStandaloneWorkoutExercises = async (exercises: Array<Omit<WorkoutExercise, 'id' | 'created_at'>>): Promise<WorkoutExercise[]> => {
  const { data, error } = await supabase
    .from('standalone_workout_exercises')
    .insert(exercises)
    .select();

  if (error) {
    console.error('Error creating multiple standalone workout exercises:', error);
    throw error;
  }

  return data as WorkoutExercise[];
};
