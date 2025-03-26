import { fetchClientWorkoutHistory } from './client-workout-history-service';
import { fetchAssignedWorkouts } from './assigned-workouts-service';
import { supabase } from "@/integrations/supabase/client";
import { WorkoutExercise } from "@/types/workout";
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

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
        workout_id: null, // Now this can be null since we modified the table
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

/**
 * Gets the total number of workouts assigned to a user in the current week
 */
export const getWeeklyAssignedWorkoutsCount = async (userId: string): Promise<number> => {
  try {
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // Get the start and end of the current week
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
    
    // Fetch all assigned workouts
    const assignedWorkouts = await fetchAssignedWorkouts(userId);
    
    // Get workouts for this week based on day_of_week
    const currentWeekNumber = Math.ceil((now.getDate() - weekStart.getDate() + 1) / 7);
    
    // Filter workouts that belong to the current week
    const currentWeekWorkouts = assignedWorkouts.filter(workout => {
      // Check if the workout has a week and program
      if (workout.workout?.week?.week_number) {
        return workout.workout.week.week_number === currentWeekNumber;
      }
      return false;
    });
    
    return currentWeekWorkouts.length || 0;
  } catch (error) {
    console.error('Error getting weekly assigned workouts count:', error);
    return 0;
  }
};
