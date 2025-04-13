
import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from "date-fns-tz";

export interface WeeklyProgressMetric {
  target: number;
  actual: number;
}

export interface WeeklyProgressResponse {
  program_id: string;
  program_title: string;
  current_week: number;
  total_weeks: number;
  program_type: string; 
  metrics: {
    strength_workouts: WeeklyProgressMetric;
    strength_mobility: WeeklyProgressMetric;
    miles_run: WeeklyProgressMetric;
    cardio_minutes: WeeklyProgressMetric;
  };
  error?: string;
}

/**
 * Fetches the client's weekly progress for their current program
 * Uses the actual assigned workouts in workout_programs > workout_weeks > workouts tables
 */
export const fetchWeeklyProgress = async (clientId?: string): Promise<WeeklyProgressResponse> => {
  try {
    console.log("Calling get_weekly_progress Edge Function...");
    
    // Try to get auth status first to help with debugging
    try {
      const { data: authData } = await supabase.auth.getUser();
      console.log("Auth status:", authData?.user ? "Authenticated as " + authData.user.id : "Not authenticated");
    } catch (authError) {
      console.warn("Could not verify auth status:", authError);
    }
    
    const { data, error } = await supabase.functions.invoke('get_weekly_progress', {
      method: 'POST',
      body: { client_id: clientId },
    });

    if (error) {
      console.error("Error fetching weekly progress:", error);
      
      // Check for relationship errors specifically
      if (error.message && error.message.includes("relationship")) {
        console.warn("Database relationship error detected. This may indicate missing foreign keys.");
      }
      
      throw error;
    }

    // Check if the function returned an error in the response
    if (data?.error) {
      console.warn("Edge function returned an error:", data.error);
    }

    // Ensure miles_run metrics are included regardless of program type
    if (data && !data.metrics.miles_run) {
      data.metrics.miles_run = { target: 0, actual: 0 };
    }

    // Count completed strength workouts if needed
    if (data && clientId) {
      await updateStrengthWorkoutsCount(data, clientId);
    }

    return data as WeeklyProgressResponse;
  } catch (error) {
    console.error("Failed to fetch weekly progress:", error);
    // Return empty data structure when there's an error
    return {
      program_id: '',
      program_title: 'Error Loading Progress',
      current_week: 1,
      total_weeks: 4,
      program_type: 'moai_strength',
      metrics: {
        strength_workouts: { target: 0, actual: 0 },
        strength_mobility: { target: 0, actual: 0 },
        miles_run: { target: 0, actual: 0 },
        cardio_minutes: { target: 0, actual: 0 }
      },
      error: error.message || "Failed to load progress data"
    };
  }
};

/**
 * Updates the weekly strength workouts count based on completed workouts
 */
async function updateStrengthWorkoutsCount(
  data: WeeklyProgressResponse, 
  clientId: string
): Promise<void> {
  try {
    // Get the current week's start and end dates in Pacific Time
    const now = new Date();
    
    // Convert to Pacific Time
    const todayPT = formatInTimeZone(now, 'America/Los_Angeles', 'yyyy-MM-dd');
    const today = new Date(todayPT);
    
    // Calculate start of week (Monday) in Pacific Time
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Adjust to Monday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    console.log(`Calculating workout counts for week of ${startOfWeek.toISOString()} to ${endOfWeek.toISOString()} (Pacific Time)`);

    // Query for completed strength workouts in this week
    const { data: completions, error } = await supabase
      .from('workout_completions')
      .select(`
        id,
        completed_at,
        workout_id,
        workout:workout_id (
          workout_type
        ),
        workout_type
      `)
      .eq('user_id', clientId)
      .gte('completed_at', startOfWeek.toISOString())
      .lt('completed_at', endOfWeek.toISOString())
      .not('completed_at', 'is', null);

    if (error) {
      console.error("Error counting completed strength workouts:", error);
      return;
    }

    // Count strength workouts
    let strengthCount = 0;
    
    if (completions && completions.length > 0) {
      strengthCount = completions.filter(completion => {
        // Check workout type from either the completion itself or the associated workout
        const workoutType = (completion.workout_type || 
                             (completion.workout && completion.workout.workout_type) || 
                             '').toLowerCase();
        
        return workoutType === 'strength';
      }).length;
      
      console.log(`Found ${strengthCount} completed strength workouts this week (Pacific Time)`);
      
      // Update the data object with the actual count
      if (data && data.metrics && data.metrics.strength_workouts) {
        data.metrics.strength_workouts.actual = strengthCount;
      }
    }
  } catch (err) {
    console.error("Error updating strength workout count:", err);
  }
}

