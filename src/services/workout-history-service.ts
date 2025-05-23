import { supabase } from "@/integrations/supabase/client";
import { fetchCurrentProgram } from "./program-service";
import { startOfWeek, endOfWeek, format, addDays } from "date-fns";
import { WorkoutHistoryItem, WorkoutBasic, WorkoutSetCompletion, StandardWorkoutType } from "@/types/workout";

/**
 * Gets the weekly assigned workouts count for a user
 */
export const getWeeklyAssignedWorkoutsCount = async (userId: string, weekNumber?: number): Promise<number> => {
  try {
    if (!userId) {
      return 6; // Default value
    }
    
    // If week number is provided, use the Supabase function
    if (weekNumber) {
      const { data, error } = await supabase.rpc('count_workouts_for_user_and_week', {
        user_id_param: userId,
        week_number_param: weekNumber
      });
      
      if (error) {
        console.error("Error counting workouts for week:", error);
        return 6; // Default value
      }
      
      // Return the count, with fallback to default
      return data || 6;
    }
    
    // If no week number, use our standard logic to count all workouts
    const { data: programAssignments, error: assignmentError } = await supabase
      .from('program_assignments')
      .select('program_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (assignmentError || !programAssignments || programAssignments.length === 0) {
      console.log("No program assignments found, returning default count");
      return 6; // Default value
    }
    
    const programId = programAssignments[0].program_id;
    
    // Count workouts in the program's weeks
    const { data: weeks, error: weeksError } = await supabase
      .from('workout_weeks')
      .select('id')
      .eq('program_id', programId);
    
    if (weeksError || !weeks || weeks.length === 0) {
      console.log("No weeks found in program, returning default count");
      return 6; // Default value
    }
    
    const weekIds = weeks.map(week => week.id);
    
    const { count, error: workoutError } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .in('week_id', weekIds);
    
    if (workoutError) {
      console.error("Error counting workouts in program:", workoutError);
      return 6; // Default value
    }
    
    return count || 6; // Ensure we have a number, default to 6 if null
  } catch (error) {
    console.error("Error in getWeeklyAssignedWorkoutsCount:", error);
    return 6; // Default to 6 workouts as fallback
  }
};

/**
 * Counts the completed workouts for a user within a given week
 */
export const countCompletedWorkoutsForWeek = async (
  userId: string = '', 
  weekStartDate: Date = new Date(), 
  includeRestDays: boolean = true
): Promise<number> => {
  try {
    console.log(`Counting completed workouts for user ${userId} for week starting ${weekStartDate.toISOString()}`);
    
    // First, count regular workout completions
    const { count: completedWorkoutsCount, error: countError } = await supabase
      .from('workout_completions')
      .select('*', { count: 'exact', head: false }) // Added head:false to prevent deep recursion
      .eq('user_id', userId)
      .eq('rest_day', false) // Only regular workouts, not rest days
      .gte('completed_at', weekStartDate.toISOString())
      .lt('completed_at', addDays(weekStartDate, 7).toISOString());
      
    if (countError) {
      console.error("Error counting completed workouts:", countError);
      return 0;
    }
    
    if (!includeRestDays) {
      return completedWorkoutsCount || 0;
    }
    
    // Count rest days separately (but they're also in workout_completions table)
    const { count: restDaysCount, error: restDaysError } = await supabase
      .from('workout_completions')
      .select('*', { count: 'exact', head: false }) // Added head:false to prevent deep recursion
      .eq('user_id', userId)
      .eq('rest_day', true) // Only rest days
      .gte('completed_at', weekStartDate.toISOString())
      .lt('completed_at', addDays(weekStartDate, 7).toISOString());
      
    if (restDaysError) {
      console.error("Error counting rest days:", restDaysError);
      return completedWorkoutsCount || 0;
    }
    
    return (completedWorkoutsCount || 0) + (restDaysCount || 0);
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
 * @param date The date of the rest day (defaults to current date if not provided)
 */
export const logRestDay = async (date: Date = new Date()): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const { error } = await supabase
      .from('workout_completions')
      .insert({
        user_id: user.id,
        completed_at: date.toISOString(),
        rest_day: true,
        title: "Rest Day" // Add title for rest days
      });
    
    if (error) {
      console.error("Error logging rest day:", error);
      throw error;
    }
    
    console.log("Rest day logged successfully for date:", date.toISOString());
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
    
    // Explicitly type the completion data with the expected structure
    const completionData = {
      user_id: user.id,
      completed_at: workoutData.completed_at || new Date().toISOString(),
      title: workoutData.title,
      description: workoutData.description,
      notes: workoutData.notes,
      rating: workoutData.rating,
      workout_type: workoutData.workout_type,
      distance: workoutData.distance,
      duration: workoutData.duration,
      location: workoutData.location
    };
    
    // Add custom_workout_id if provided
    if (workoutData.custom_workout_id) {
      // Create a new object with the additional property rather than modifying the typed object
      const dataWithCustomWorkoutId = {
        ...completionData,
        custom_workout_id: workoutData.custom_workout_id
      };
      
      // Create a workout completion entry with custom_workout_id
      const { error } = await supabase
        .from('workout_completions')
        .insert(dataWithCustomWorkoutId);
      
      if (error) {
        console.error("Error creating one-off workout completion with custom_workout_id:", error);
        throw error;
      }
    } else {
      // Create a workout completion entry without custom_workout_id
      const { error } = await supabase
        .from('workout_completions')
        .insert(completionData);
      
      if (error) {
        console.error("Error creating one-off workout completion:", error);
        throw error;
      }
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
    
    if (!userId) {
      console.error("Invalid userId provided to fetchAssignedWorkouts");
      return [];
    }
    
    // Get the user's current program
    const currentProgram = await fetchCurrentProgram(userId);
    
    if (!currentProgram || !currentProgram.program) {
      console.log("No program found for user");
      return [];
    }
    
    // Get all workout completions for this user
    const { data: completions, error: completionsError } = await supabase
      .from('workout_completions')
      .select('*')
      .eq('user_id', userId);
    
    if (completionsError) {
      console.error("Error fetching workout completions:", completionsError);
      return [];
    }
    
    // Create a map of completed workout IDs
    const completedWorkoutMap = new Map();
    if (completions) {
      completions.forEach(completion => {
        if (completion.workout_id) {
          completedWorkoutMap.set(completion.workout_id, completion);
        }
      });
    }
    
    // Extract all workouts from the program
    const programWorkouts: WorkoutHistoryItem[] = [];
    const weeks = currentProgram.program.weekData || [];
    
    if (!Array.isArray(weeks)) {
      console.error("Program weekData is not an array:", weeks);
      return [];
    }
    
    for (const week of weeks) {
      if (!week.workouts || !Array.isArray(week.workouts)) continue;
      
      for (const workout of week.workouts) {
        // Find if this workout has a completion record
        const workoutCompletion = completedWorkoutMap.get(workout.id) || null;
        
        const workoutHistoryItem: WorkoutHistoryItem = {
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
              program: currentProgram.program ? {
                id: currentProgram.program.id,
                title: currentProgram.program.title
              } : null
            }
          }
        };
        
        programWorkouts.push(workoutHistoryItem);
      }
    }
    
    return programWorkouts;
  } catch (error) {
    console.error("Error in fetchAssignedWorkouts:", error);
    return [];
  }
};
