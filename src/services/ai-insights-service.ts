
import { supabase } from '@/integrations/supabase/client';

// Interface for client data for AI insights
export interface AIClientData {
  id: string;
  email: string;
  user_type: string;
  first_name: string | null;
  last_name: string | null;
  last_workout_at: string | null;
  total_workouts_completed: number;
  current_program_id: string | null;
  current_program_title: string | null;
  days_since_last_workout: number | null;
  group_ids: string[];
}

/**
 * Fetches client data for AI insights
 */
export const fetchClientsForAIInsights = async (userId: string): Promise<AIClientData[]> => {
  if (!userId) return [];
  
  try {
    // First get all clients with workout info
    const { data: clientInfos, error: clientInfoError } = await supabase
      .from('client_workout_info')
      .select('user_id, user_type, last_workout_at, total_workouts_completed, current_program_id');
    
    if (clientInfoError) {
      console.error('Error fetching client workout info:', clientInfoError);
      return [];
    }
    
    if (!clientInfos || clientInfos.length === 0) {
      return [];
    }
    
    // Get client IDs
    const clientIds = clientInfos.map(info => info.user_id);
    
    // Get client profiles for these users
    const { data: clientProfiles, error: profilesError } = await supabase
      .from('client_profiles')
      .select('id, first_name, last_name')
      .in('id', clientIds);
      
    if (profilesError) {
      console.error('Error fetching client profiles:', profilesError);
    }
    
    // Create a map for quick lookup of profile data
    const profilesMap = new Map();
    if (clientProfiles) {
      clientProfiles.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });
    }
    
    // Get emails for these clients
    const { data: emails } = await supabase.rpc('get_users_email', {
      user_ids: clientIds
    });
    
    const emailMap = new Map(emails ? emails.map(e => [e.id, e.email]) : []);
    
    // Transform the data to match the expected interface
    const formattedClients = clientInfos.map(clientInfo => {
      const profile = profilesMap.get(clientInfo.user_id);
      
      // Calculate days since last workout
      let daysSinceLastWorkout = null;
      if (clientInfo.last_workout_at) {
        daysSinceLastWorkout = Math.ceil(
          (new Date().getTime() - new Date(clientInfo.last_workout_at).getTime()) / (1000 * 60 * 60 * 24)
        );
      }
      
      return {
        id: clientInfo.user_id,
        email: emailMap.get(clientInfo.user_id) || 'Unknown',
        user_type: clientInfo.user_type,
        first_name: profile?.first_name || null,
        last_name: profile?.last_name || null,
        last_workout_at: clientInfo.last_workout_at,
        total_workouts_completed: clientInfo.total_workouts_completed || 0,
        current_program_id: clientInfo.current_program_id,
        current_program_title: null, // We'd need another query to get this
        days_since_last_workout: daysSinceLastWorkout,
        group_ids: []
      };
    });

    // Sort clients by workout count in descending order
    return formattedClients.sort((a, b) => 
      (b.total_workouts_completed || 0) - (a.total_workouts_completed || 0)
    );
    
  } catch (error) {
    console.error('Error in fetchClientsForAIInsights:', error);
    return [];
  }
};
