
import { supabase } from "@/integrations/supabase/client";

export interface ClientData {
  id: string;
  email: string;
  user_type: string;
  last_workout_at: string | null;
  total_workouts_completed: number;
  current_program_id: string | null;
  current_program_title: string | null;
  days_since_last_workout: number | null;
  group_ids: string[];
}

export interface GroupData {
  id: string;
  name: string;
  description: string | null;
}

// Fetch all clients that the coach has access to
export const fetchCoachClients = async (coachId: string): Promise<ClientData[]> => {
  const { data, error } = await supabase
    .rpc('get_coach_clients', { coach_id: coachId });

  if (error) {
    console.error('Error fetching coach clients:', error);
    throw error;
  }

  return data || [];
};

// Fetch all groups the coach is assigned to
export const fetchCoachGroups = async (coachId: string): Promise<GroupData[]> => {
  const { data: groupCoaches, error: groupCoachesError } = await supabase
    .from('group_coaches')
    .select('group_id')
    .eq('coach_id', coachId);
    
  if (groupCoachesError) throw groupCoachesError;
  
  if (groupCoaches.length === 0) return [];
  
  // Get the actual group details
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupCoaches.map(gc => gc.group_id));
    
  if (groupsError) throw groupsError;
  
  return groups || [];
};

// Fetch workout completion history for a client
export const fetchClientWorkoutHistory = async (clientId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('workout_completions')
    .select(`
      *,
      workout:workout_id (
        *,
        week:week_id (
          *,
          program:program_id (*)
        )
      )
    `)
    .eq('user_id', clientId)
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('Error fetching client workout history:', error);
    throw error;
  }

  return data || [];
};

// Fetch client's assigned workout programs
export const fetchClientPrograms = async (clientId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('program_assignments')
    .select(`
      *,
      program:program_id (*)
    `)
    .eq('user_id', clientId)
    .order('start_date', { ascending: false });

  if (error) {
    console.error('Error fetching client programs:', error);
    throw error;
  }

  return data || [];
};
