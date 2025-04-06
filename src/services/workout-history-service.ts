
import { supabase } from "@/integrations/supabase/client";
import { WorkoutHistoryItem, WorkoutExercise } from "@/types/workout";
import { getWeekDateRange } from './workout-week-service';

/**
 * Fetches all workout completions for a user
 */
export const fetchAllWorkoutCompletions = async (userId: string): Promise<WorkoutHistoryItem[]> => {
  try {
    const { data, error } = await supabase
      .from('workout_completions')
      .select(`
        *,
        workout:workout_id (
          id,
          title,
          description,
          day_of_week,
          week_id,
          week:week_id (
            program:program_id (*),
            week_number
          ),
          workout_exercises (
            *,
            exercise:exercise_id (*)
          ),
          workout_type
        )
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error("Error fetching workout completions:", error);
      return [];
    }

    // Ensure the workout_exercises property is properly handled
    const typedData = data?.map(item => {
      // Cast to WorkoutHistoryItem with proper type handling
      return {
        ...item,
        workout: item.workout ? {
          ...item.workout,
          // Ensure workout_exercises is always an array
          workout_exercises: Array.isArray(item.workout.workout_exercises) 
            ? item.workout.workout_exercises 
            : []
        } : null
      } as WorkoutHistoryItem;
    }) || [];

    return typedData;
  } catch (error) {
    console.error("Error in fetchAllWorkoutCompletions:", error);
    return [];
  }
};

/**
 * Fetches workout assignments for a user
 * Note: This is a placeholder implementation since workout_assignments table may not exist
 * Replace with actual implementation when table is available
 */
export const fetchAssignedWorkouts = async (userId: string): Promise<WorkoutHistoryItem[]> => {
  try {
    // This is a placeholder - we'll just return an empty array
    console.log("Fetch assigned workouts called for user:", userId);
    
    // Mock data structure that matches WorkoutHistoryItem
    const mockData: WorkoutHistoryItem[] = [];
    
    return mockData;
  } catch (error) {
    console.error("Error in fetchAssignedWorkouts:", error);
    return [];
  }
};

/**
 * Gets the user ID from the email
 */
export const getUserIdByEmail = async (email: string): Promise<string | null> => {
  try {
    // Use profiles table instead of direct auth.users access
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (error) {
      console.error("Error fetching user ID by email:", error);
      return null;
    }

    return data ? data.id : null;
  } catch (error) {
    console.error("Error in getUserIdByEmail:", error);
    return null;
  }
};

/**
 * Gets the number of assigned workouts for a specific week
 */
export const getAssignedWorkoutsCountForWeek = async (userId: string, weekNumber: number): Promise<number> => {
  try {
    // Placeholder implementation since workout_assignments table may not exist
    console.log(`Getting assigned workouts for user ${userId} and week ${weekNumber}`);
    return 5; // Return a default value for now
  } catch (error) {
    console.error("Error in getAssignedWorkoutsCountForWeek:", error);
    return 0;
  }
};

/**
 * Logs a rest day for the user
 */
export const logRestDay = async (date: Date): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found when logging rest day");
      return false;
    }
    
    const formattedDate = date.toISOString();
    
    const { error } = await supabase
      .from('workout_completions')
      .insert({
        user_id: user.id,
        rest_day: true,
        completed_at: formattedDate,
        notes: "Rest Day"
      });
      
    if (error) {
      console.error("Error logging rest day:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in logRestDay:", error);
    return false;
  }
};

/**
 * Gets workouts for a specific week based on program start date
 */
export const getWorkoutsForWeek = async (
  userId: string, 
  programStartDate: string,
  weekNumber: number
): Promise<WorkoutHistoryItem[]> => {
  try {
    if (!userId || !programStartDate) {
      console.error("Missing required parameters:", { userId, programStartDate, weekNumber });
      return [];
    }
    
    const { start, end } = getWeekDateRange(programStartDate, weekNumber);
    
    const startDate = start.toISOString();
    const endDate = end.toISOString();
    
    console.log(`Fetching workouts for week ${weekNumber}: ${startDate} to ${endDate}`);
    
    const { data, error } = await supabase
      .from('workout_completions')
      .select(`
        *,
        workout:workout_id (
          id,
          title,
          description,
          day_of_week,
          week_id,
          week:week_id (
            program:program_id (*),
            week_number
          ),
          workout_exercises (
            *,
            exercise:exercise_id (*)
          ),
          workout_type
        )
      `)
      .eq('user_id', userId)
      .gte('completed_at', startDate)
      .lte('completed_at', endDate)
      .order('completed_at', { ascending: false });
      
    if (error) {
      console.error(`Error fetching workouts for week ${weekNumber}:`, error);
      return [];
    }
    
    // Ensure the workout_exercises property is properly handled
    const typedData = data?.map(item => {
      // Cast to WorkoutHistoryItem with proper type handling
      return {
        ...item,
        workout: item.workout ? {
          ...item.workout,
          // Ensure workout_exercises is always an array
          workout_exercises: Array.isArray(item.workout.workout_exercises) 
            ? item.workout.workout_exercises 
            : []
        } : null
      } as WorkoutHistoryItem;
    }) || [];
    
    return typedData;
  } catch (error) {
    console.error(`Error in getWorkoutsForWeek:`, error);
    return [];
  }
};

/**
 * Creates a one-off workout completion for a user
 */
export const createOneOffWorkoutCompletion = async (workoutData: {
  title: string;
  description?: string;
  notes?: string;
  workout_type: string;
  completed_at: string;
  distance?: string;
  duration?: string;
  location?: string;
}): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found when creating one-off workout");
      return null;
    }
    
    const { data, error } = await supabase
      .from('workout_completions')
      .insert({
        user_id: user.id,
        title: workoutData.title,
        description: workoutData.description,
        notes: workoutData.notes,
        workout_type: workoutData.workout_type,
        completed_at: workoutData.completed_at,
        distance: workoutData.distance,
        duration: workoutData.duration,
        location: workoutData.location
      })
      .select('id')
      .single();
    
    if (error) {
      console.error("Error creating one-off workout:", error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error("Error in createOneOffWorkoutCompletion:", error);
    return null;
  }
};

/**
 * Counts completed workouts for a specific week
 */
export const countCompletedWorkoutsForWeek = async (
  userId: string,
  programStartDate?: string,
  weekNumber?: number
): Promise<number> => {
  try {
    // If no program start date or week number, count recent workouts
    if (!programStartDate || !weekNumber) {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { count, error } = await supabase
        .from('workout_completions')
        .select('*', { count: 'exact', head: false })
        .eq('user_id', userId)
        .gte('completed_at', oneWeekAgo.toISOString())
        .not('rest_day', 'eq', true);
        
      if (error) {
        console.error(`Error counting recent workouts:`, error);
        return 0;
      }
      
      return count || 0;
    }
    
    // If we have program start date and week number
    const { start, end } = getWeekDateRange(programStartDate, weekNumber);
    
    const startDate = start.toISOString();
    const endDate = end.toISOString();
    
    const { count, error } = await supabase
      .from('workout_completions')
      .select('*', { count: 'exact', head: false })
      .eq('user_id', userId)
      .gte('completed_at', startDate)
      .lte('completed_at', endDate)
      .not('rest_day', 'eq', true);
      
    if (error) {
      console.error(`Error counting completed workouts for week ${weekNumber}:`, error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error(`Error in countCompletedWorkoutsForWeek:`, error);
    return 0;
  }
};

/**
 * Gets the number of assigned workouts for a specific week
 */
export const getWeeklyAssignedWorkoutsCount = async (
  userId: string,
  programStartDate?: string,
  weekNumber?: number
): Promise<number> => {
  try {
    // Return a default value for now since workout_assignments table may not exist
    // This is a placeholder implementation
    console.log(`Getting assigned workouts count for user ${userId}`);
    return 6;
  } catch (error) {
    console.error("Error in getWeeklyAssignedWorkoutsCount:", error);
    return 0;
  }
};
