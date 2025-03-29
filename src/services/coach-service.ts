
import { supabase } from "@/integrations/supabase/client";
import { ClientData } from "./client-service";

/**
 * Fetches all clients associated with a coach
 */
export const fetchCoachClients = async (coachId: string): Promise<ClientData[]> => {
  try {
    // Custom query using RPC function to get client data
    const { data, error } = await supabase.rpc('get_coach_clients', {
      coach_id: coachId
    });
    
    if (error) {
      console.error("Error fetching coach clients:", error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in fetchCoachClients:", error);
    throw error;
  }
};

/**
 * Counts the total completed workouts for a specific client
 */
export const countClientCompletedWorkouts = async (clientId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('workout_completions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', clientId)
      .not('completed_at', 'is', null); // Only count workouts that have a completed_at date
    
    if (error) {
      console.error("Error counting completed workouts:", error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error("Error in countClientCompletedWorkouts:", error);
    return 0;
  }
};
