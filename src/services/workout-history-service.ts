
import { supabase } from "@/integrations/supabase/client";
import { fetchCurrentProgram } from "./program-service";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { WorkoutHistoryItem } from "@/types/workout";

/**
 * Gets the weekly assigned workouts count for a user
 */
export const getWeeklyAssignedWorkoutsCount = async (userId: string): Promise<number> => {
  try {
    console.log("Getting weekly assigned workouts count for user:", userId);
    
    // Fetch the user's current program
    const currentProgram = await fetchCurrentProgram(userId);
    
    if (!currentProgram || !currentProgram.program) {
      console.error("No current program found for user");
      throw new Error("No program assigned");
    }
    
    // Calculate the current week within the program
    const startDate = new Date(currentProgram.start_date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const currentWeekNumber = Math.floor(diffDays / 7) + 1;
    
    console.log(`Current week in program: ${currentWeekNumber}`);
    
    // Find the corresponding week in the program
    const weeks = currentProgram.program.weekData || [];
    const currentWeek = weeks.find(week => week.week_number === currentWeekNumber);
    
    if (!currentWeek) {
      console.error(`Week ${currentWeekNumber} not found in program`);
      throw new Error("Current week not found in program");
    }
    
    // Count the number of workouts in this week
    const workoutsCount = currentWeek.workouts ? currentWeek.workouts.length : 0;
    
    console.log(`Found ${workoutsCount} workouts assigned for week ${currentWeekNumber}`);
    
    return workoutsCount;
  } catch (error) {
    console.error("Error getting weekly assigned workouts count:", error);
    throw error;
  }
};

/**
 * Counts the completed workouts for a user within a given week
 */
export const countCompletedWorkoutsForWeek = async (userId: string, weekStart: Date): Promise<number> => {
  try {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    
    const { data, error } = await supabase
      .from('workout_completions')
      .select('id')
      .eq('user_id', userId)
      .gte('completed_at', format(weekStart, 'yyyy-MM-dd'))
      .lte('completed_at', format(weekEnd, 'yyyy-MM-dd'));
    
    if (error) {
      console.error("Error fetching completed workouts:", error);
      return 0;
    }
    
    return data ? data.length : 0;
  } catch (error) {
    console.error("Error counting completed workouts:", error);
    return 0;
  }
};

/**
 * Get user ID by email - using auth directly instead of profiles
 */
export const getUserIdByEmail = async (email: string): Promise<string | null> => {
  try {
    console.log(`Looking up user ID for email: ${email}`);
    
    // We cannot directly query auth.users with the supabase client
    // We'll query for all users with a specific email pattern through an admin function
    // This is a stub function that returns null - in production, this would need
    // a server-side function or RPC call that has access to auth.users
    console.warn("Email lookup requires a server-side function with admin rights");
    
    // Just return null for now since we can't implement this properly
    // without additional backend setup
    return null;
  } catch (error) {
    console.error("Error in getUserIdByEmail:", error);
    return null;
  }
};

/**
 * Get assigned workouts count for a specific week
 */
export const getAssignedWorkoutsCountForWeek = async (userId: string, weekNumber: number): Promise<number> => {
  try {
    console.log(`Getting assigned workouts count for user ${userId} in week ${weekNumber}`);
    
    // Get the user's current program
    const currentProgram = await fetchCurrentProgram(userId);
    
    if (!currentProgram || !currentProgram.program) {
      console.error("No program found for user");
      return 0;
    }
    
    // Find the requested week in the program
    const weeks = currentProgram.program.weekData || [];
    const week = weeks.find(w => w.week_number === weekNumber);
    
    if (!week) {
      console.error(`Week ${weekNumber} not found in program`);
      return 0;
    }
    
    // Count the workouts in this week
    const workoutsCount = week.workouts ? week.workouts.length : 0;
    
    return workoutsCount;
  } catch (error) {
    console.error(`Error getting assigned workouts count for week ${weekNumber}:`, error);
    return 0;
  }
};

/**
 * Log a rest day for the current user
 */
export const logRestDay = async (): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const { error } = await supabase
      .from('workout_completions')
      .insert({
        user_id: user.id,
        completed_at: new Date().toISOString(),
        rest_day: true
      });
    
    if (error) {
      console.error("Error logging rest day:", error);
      throw error;
    }
    
    console.log("Rest day logged successfully");
  } catch (error) {
    console.error("Error in logRestDay:", error);
    throw error;
  }
};

/**
 * Create a one-off (custom) workout completion
 */
export const createOneOffWorkoutCompletion = async (workoutData: any): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    // Create a workout completion entry
    const { error } = await supabase
      .from('workout_completions')
      .insert({
        user_id: user.id,
        completed_at: new Date().toISOString(),
        title: workoutData.title,
        description: workoutData.description,
        notes: workoutData.notes,
        rating: workoutData.rating,
        workout_type: workoutData.workout_type,
        distance: workoutData.distance,
        duration: workoutData.duration,
        location: workoutData.location
      });
    
    if (error) {
      console.error("Error creating one-off workout completion:", error);
      throw error;
    }
    
    console.log("One-off workout logged successfully");
  } catch (error) {
    console.error("Error in createOneOffWorkoutCompletion:", error);
    throw error;
  }
};

/**
 * Fetch assigned workouts for a user
 */
export const fetchAssignedWorkouts = async (userId: string): Promise<WorkoutHistoryItem[]> => {
  try {
    console.log("Fetching assigned workouts for user:", userId);
    
    // Get the user's current program
    const currentProgram = await fetchCurrentProgram(userId);
    
    if (!currentProgram || !currentProgram.program) {
      console.error("No program found for user");
      return [];
    }
    
    // Get all workout completions for this user
    const { data: completions, error: completionsError } = await supabase
      .from('workout_completions')
      .select('*')
      .eq('user_id', userId);
    
    if (completionsError) {
      console.error("Error fetching workout completions:", completionsError);
      throw completionsError;
    }
    
    // Create a map of completed workout IDs
    const completedWorkoutIds = new Set();
    if (completions) {
      completions.forEach(completion => {
        if (completion.workout_id) {
          completedWorkoutIds.add(completion.workout_id);
        }
      });
    }
    
    // Extract all workouts from the program
    const programWorkouts: WorkoutHistoryItem[] = [];
    const weeks = currentProgram.program.weekData || [];
    
    for (const week of weeks) {
      if (!week.workouts) continue;
      
      for (const workout of week.workouts) {
        // Find if this workout has a completion record
        const workoutCompletion = completions?.find(c => c.workout_id === workout.id) || null;
        
        programWorkouts.push({
          id: workout.id,
          user_id: userId,
          workout_id: workout.id,
          completed_at: workoutCompletion?.completed_at || null,
          notes: workoutCompletion?.notes || null,
          rating: workoutCompletion?.rating || null,
          life_happens_pass: workoutCompletion?.life_happens_pass || false,
          rest_day: workoutCompletion?.rest_day || false,
          workout: {
            ...workout,
            week: {
              week_number: week.week_number,
              program: {
                id: currentProgram.program.id,
                title: currentProgram.program.title
              }
            }
          }
        });
      }
    }
    
    return programWorkouts;
  } catch (error) {
    console.error("Error in fetchAssignedWorkouts:", error);
    return [];
  }
};
