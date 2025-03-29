
import { supabase } from "@/integrations/supabase/client";
import { ClientData } from "./client-service";

/**
 * Fetches all clients associated with a coach
 */
export const fetchCoachClients = async (coachId: string): Promise<ClientData[]> => {
  try {
    console.log("Fetching coach clients for coach ID:", coachId);
    
    // Custom query using RPC function to get client data
    const { data, error } = await supabase.rpc('get_coach_clients', {
      coach_id: coachId
    });
    
    if (error) {
      console.error("Error fetching coach clients:", error);
      throw new Error(`Failed to fetch clients: ${error.message}`);
    }
    
    console.log("Successfully fetched coach clients:", data?.length || 0);
    return data || [];
  } catch (error: any) {
    console.error("Error in fetchCoachClients:", error);
    throw new Error(error.message || "Failed to fetch clients. Please try again later.");
  }
};

/**
 * Counts the total completed workouts for a specific client
 */
export const countClientCompletedWorkouts = async (clientId: string): Promise<number> => {
  try {
    console.log("Counting workouts for client ID:", clientId);
    
    // First try to use the RPC function
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_client_completed_workouts_count', {
      user_id_param: clientId
    });
    
    if (!rpcError && rpcData !== null) {
      console.log("Successfully counted workouts via RPC:", rpcData);
      return rpcData;
    }
    
    // Fallback to direct query if RPC fails or isn't available
    console.log("Falling back to direct query for workout count");
    const { count, error } = await supabase
      .from('workout_completions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', clientId)
      .not('completed_at', 'is', null); // Only count workouts that have a completed_at date
    
    if (error) {
      console.error("Error counting completed workouts:", error);
      return 0;
    }
    
    console.log("Successfully counted workouts via direct query:", count);
    return count || 0;
  } catch (error) {
    console.error("Error in countClientCompletedWorkouts:", error);
    return 0;
  }
};

/**
 * Syncs coach email with groups - ensures all coaches have appropriate group assignments
 */
export const syncCoachEmailWithGroups = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { success: false, message: 'No active session found' };
    }

    const userEmail = session.user.email;
    const userId = session.user.id;
    
    console.log(`Syncing groups for coach: ${userEmail} (${userId})`);
    
    // For specific coach emails, ensure they have access to matching groups
    if (userEmail === 'jdholakia12@gmail.com') {
      // Look for existing Moai groups
      const { data: moaiGroups, error: moaiError } = await supabase
        .from('groups')
        .select('*')
        .ilike('name', 'Moai%');
      
      if (moaiError) {
        console.error('Error finding Moai groups:', moaiError);
        return { success: false, message: 'Error finding appropriate groups' };
      }
      
      if (moaiGroups && moaiGroups.length > 0) {
        let successCount = 0;
        
        // Ensure coach is assigned to all Moai groups
        for (const group of moaiGroups) {
          // Check for existing assignment
          const { data: existing, error: checkError } = await supabase
            .from('group_coaches')
            .select('*')
            .eq('coach_id', userId)
            .eq('group_id', group.id);
            
          if (checkError) {
            console.error(`Error checking assignment for group ${group.id}:`, checkError);
            continue;
          }
          
          // If no assignment exists, create one
          if (!existing || existing.length === 0) {
            const { error: assignError } = await supabase
              .from('group_coaches')
              .insert({ coach_id: userId, group_id: group.id });
              
            if (assignError) {
              console.error(`Error assigning coach to group ${group.id}:`, assignError);
            } else {
              successCount++;
            }
          } else {
            successCount++;
          }
        }
        
        return { 
          success: true, 
          message: `Successfully synchronized ${successCount} of ${moaiGroups.length} groups` 
        };
      } else {
        return { success: false, message: 'No matching groups found for your email' };
      }
    }
    
    // For regular coaches without special handling
    return { success: true, message: 'No special syncing needed for your account' };
  } catch (error) {
    console.error('Error syncing coach groups:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
};
