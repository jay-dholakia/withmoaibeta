
import { supabase } from "@/integrations/supabase/client";

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
