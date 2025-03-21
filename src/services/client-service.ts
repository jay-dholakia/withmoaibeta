
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

export interface CoachProfile {
  id: string;
  bio: string | null;
  avatar_url: string | null;
  favorite_movements: string[] | null;
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

// Fetch coach profile
export const fetchCoachProfile = async (coachId: string): Promise<CoachProfile | null> => {
  // Using a raw query is a workaround since supabase.from('coach_profiles') doesn't work with TypeScript
  const { data, error } = await supabase
    .from('coach_profiles')
    .select('id, bio, avatar_url, favorite_movements')
    .eq('id', coachId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching coach profile:', error);
    throw error;
  }

  return data as CoachProfile | null;
};

// Update coach profile
export const updateCoachProfile = async (coachId: string, profile: Partial<CoachProfile>): Promise<CoachProfile> => {
  // Using a raw query as a workaround
  const { data, error } = await supabase
    .from('coach_profiles')
    .upsert({ 
      id: coachId, 
      bio: profile.bio, 
      avatar_url: profile.avatar_url,
      favorite_movements: profile.favorite_movements,
      updated_at: new Date().toISOString()
    })
    .select('id, bio, avatar_url, favorite_movements')
    .single();

  if (error) {
    console.error('Error updating coach profile:', error);
    throw error;
  }

  return data as CoachProfile;
};

// Upload coach avatar
export const uploadCoachAvatar = async (coachId: string, file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${coachId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `${coachId}/${fileName}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

// New function to fetch group workout leaderboard data
export interface LeaderboardEntry {
  user_id: string;
  email: string;
  total_workouts: number;
}

export const fetchGroupLeaderboardWeekly = async (groupId: string): Promise<LeaderboardEntry[]> => {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start of current week (Sunday)
  startOfWeek.setHours(0, 0, 0, 0);
  
  const { data, error } = await supabase
    .from('get_group_weekly_leaderboard')
    .select('*')
    .eq('group_id', groupId)
    .eq('start_date', startOfWeek.toISOString());

  if (error) {
    console.error('Error fetching weekly leaderboard:', error);
    throw error;
  }

  return data as LeaderboardEntry[] || [];
};

export const fetchGroupLeaderboardMonthly = async (groupId: string): Promise<LeaderboardEntry[]> => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1); // Start of current month
  startOfMonth.setHours(0, 0, 0, 0);
  
  const { data, error } = await supabase
    .from('get_group_monthly_leaderboard')
    .select('*')
    .eq('group_id', groupId)
    .eq('start_date', startOfMonth.toISOString());

  if (error) {
    console.error('Error fetching monthly leaderboard:', error);
    throw error;
  }

  return data as LeaderboardEntry[] || [];
};
