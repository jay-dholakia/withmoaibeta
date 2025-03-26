
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

/**
 * Creates a one-off workout completion
 */
export const createOneOffWorkoutCompletion = async (params: {
  title: string;
  description?: string;
  notes?: string;
  rating?: number;
}) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      throw new Error('User not authenticated');
    }
    
    // Create the workout completion
    const { data, error } = await supabase
      .from('workout_completions')
      .insert({
        user_id: user.user.id,
        workout_id: null, // No associated workout
        notes: params.notes || null,
        rating: params.rating || null
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error creating one-off workout completion:', error);
    throw error;
  }
};

/**
 * Log a rest day
 */
export const logRestDay = async (notes?: string) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      throw new Error('User not authenticated');
    }
    
    // Create the workout completion with rest_day flag
    const { data, error } = await supabase
      .from('workout_completions')
      .insert({
        user_id: user.user.id,
        workout_id: null, // No associated workout
        notes: notes || "Taking a scheduled rest day",
        rest_day: true
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error logging rest day:', error);
    throw error;
  }
};
