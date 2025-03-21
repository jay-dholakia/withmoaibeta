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

export interface ClientProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  state: string | null;
  birthday: string | null;
  height: string | null;
  weight: string | null;
  avatar_url: string | null;
  fitness_goals: string[] | null;
  favorite_movements: string[] | null;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
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

// Fetch all groups for leaderboard (not just the ones the coach is assigned to)
export const fetchAllGroups = async (): Promise<GroupData[]> => {
  const { data: groups, error } = await supabase
    .from('groups')
    .select('*')
    .order('name');
    
  if (error) {
    console.error('Error fetching all groups:', error);
    throw error;
  }
  
  return groups || [];
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
    .rpc('get_group_weekly_leaderboard', {
      group_id: groupId,
      start_date: startOfWeek.toISOString()
    });

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
    .rpc('get_group_monthly_leaderboard', {
      group_id: groupId,
      start_date: startOfMonth.toISOString()
    });

  if (error) {
    console.error('Error fetching monthly leaderboard:', error);
    throw error;
  }

  return data as LeaderboardEntry[] || [];
};

// Client profile functions
export const fetchClientProfile = async (clientId: string): Promise<ClientProfile | null> => {
  // Type assertion to any to work around TypeScript limitations
  const { data, error } = await (supabase
    .from('client_profiles' as any)
    .select('*')
    .eq('id', clientId)
    .maybeSingle() as any);

  if (error) {
    console.error('Error fetching client profile:', error);
    throw error;
  }

  return data as ClientProfile | null;
};

export const updateClientProfile = async (clientId: string, profile: Partial<ClientProfile>): Promise<ClientProfile> => {
  // Type assertion to any to work around TypeScript limitations
  const { data, error } = await (supabase
    .from('client_profiles' as any)
    .update({ 
      ...profile,
      updated_at: new Date().toISOString()
    })
    .eq('id', clientId)
    .select('*')
    .single() as any);

  if (error) {
    console.error('Error updating client profile:', error);
    throw error;
  }

  return data as ClientProfile;
};

export const uploadClientAvatar = async (clientId: string, file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${clientId}/${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  return data.publicUrl;
};

