import { supabase } from '@/integrations/supabase/client';
import { GroupData } from '@/types/group';
import { startOfWeek, startOfMonth } from 'date-fns';

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

export interface ClientProfile {
  id?: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  state: string | null;
  birthday: string | null;
  height: string | null;
  weight: string | null;
  fitness_goals: string[];
  favorite_movements: string[];
  avatar_url: string | null;
  profile_completed: boolean;
}

export interface CoachProfile {
  id?: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  specialty: string | null;
  certifications: string[];
  favorite_movements: string[];
  avatar_url: string | null;
}

export interface LeaderboardEntry {
  user_id: string;
  email: string;
  total_workouts: number;
}

export interface TeamStreakEntry {
  group_id: string;
  group_name: string;
  current_streak: number;
  monthly_perfect_weeks: number;
  all_time_perfect_weeks: number;
}

export const fetchAllGroups = async (): Promise<GroupData[]> => {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*');

    if (error) {
      console.error('Error fetching groups:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching groups:', error);
    return [];
  }
};

export const fetchGroupLeaderboardWeekly = async (groupId: string): Promise<LeaderboardEntry[]> => {
  try {
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    
    const { data, error } = await supabase
      .rpc('get_group_weekly_leaderboard', { 
        group_id: groupId,
        start_date: currentWeekStart.toISOString()
      });
    
    if (error) {
      console.error('Error fetching weekly leaderboard:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchGroupLeaderboardWeekly:', error);
    return [];
  }
};

export const fetchGroupLeaderboardMonthly = async (groupId: string): Promise<LeaderboardEntry[]> => {
  try {
    const currentMonthStart = startOfMonth(new Date());
    
    const { data, error } = await supabase
      .rpc('get_group_monthly_leaderboard', { 
        group_id: groupId,
        start_date: currentMonthStart.toISOString()
      });
    
    if (error) {
      console.error('Error fetching monthly leaderboard:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchGroupLeaderboardMonthly:', error);
    return [];
  }
};

export const fetchTeamStreaks = async (): Promise<TeamStreakEntry[]> => {
  try {
    const mockTeamStreaks: TeamStreakEntry[] = [
      { 
        group_id: "1", 
        group_name: "Team Alpha", 
        current_streak: 3, 
        monthly_perfect_weeks: 3, 
        all_time_perfect_weeks: 12 
      },
      { 
        group_id: "2", 
        group_name: "Team Beta", 
        current_streak: 2, 
        monthly_perfect_weeks: 2, 
        all_time_perfect_weeks: 8 
      },
      { 
        group_id: "3", 
        group_name: "Team Gamma", 
        current_streak: 1, 
        monthly_perfect_weeks: 1, 
        all_time_perfect_weeks: 5 
      },
      { 
        group_id: "4", 
        group_name: "Team Delta", 
        current_streak: 0, 
        monthly_perfect_weeks: 0, 
        all_time_perfect_weeks: 3 
      }
    ];
    
    return mockTeamStreaks;
  } catch (error) {
    console.error('Error in fetchTeamStreaks:', error);
    return [];
  }
};

export const fetchClientProfile = async (userId: string): Promise<ClientProfile> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching client profile:', error);
    throw error;
  }

  const profile: ClientProfile = {
    id: data?.id,
    first_name: data?.first_name ?? null,
    last_name: data?.last_name ?? null,
    city: data?.city ?? null,
    state: data?.state ?? null,
    birthday: data?.birthday ?? null,
    height: data?.height ?? null,
    weight: data?.weight ?? null,
    fitness_goals: Array.isArray(data?.fitness_goals) ? data.fitness_goals : [],
    favorite_movements: Array.isArray(data?.favorite_movements) ? data.favorite_movements : [],
    avatar_url: data?.avatar_url ?? null,
    profile_completed: Boolean(data?.profile_completed)
  };

  return profile;
};

export const updateClientProfile = async (userId: string, profile: Partial<ClientProfile>): Promise<ClientProfile> => {
  const { data, error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating client profile:', error);
    throw error;
  }

  const updatedProfile: ClientProfile = {
    id: data?.id,
    first_name: data?.first_name ?? null,
    last_name: data?.last_name ?? null,
    city: data?.city ?? null,
    state: data?.state ?? null,
    birthday: data?.birthday ?? null,
    height: data?.height ?? null,
    weight: data?.weight ?? null,
    fitness_goals: Array.isArray(data?.fitness_goals) ? data.fitness_goals : [],
    favorite_movements: Array.isArray(data?.favorite_movements) ? data.favorite_movements : [],
    avatar_url: data?.avatar_url ?? null,
    profile_completed: Boolean(data?.profile_completed)
  };

  return updatedProfile;
};

export const uploadClientAvatar = async (userId: string, file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('profiles')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading avatar:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('profiles')
    .getPublicUrl(filePath);

  await updateClientProfile(userId, { avatar_url: data.publicUrl });

  return data.publicUrl;
};

export const fetchCoachProfile = async (userId: string): Promise<CoachProfile> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching coach profile:', error);
    throw error;
  }

  const profile: CoachProfile = {
    id: data?.id,
    first_name: data?.first_name ?? null,
    last_name: data?.last_name ?? null,
    bio: data?.bio ?? null,
    specialty: data?.specialty ?? null,
    certifications: Array.isArray(data?.certifications) ? data.certifications : [],
    favorite_movements: Array.isArray(data?.favorite_movements) ? data.favorite_movements : [],
    avatar_url: data?.avatar_url ?? null
  };

  return profile;
};

export const updateCoachProfile = async (userId: string, profile: Partial<CoachProfile>): Promise<CoachProfile> => {
  const { data, error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating coach profile:', error);
    throw error;
  }

  const updatedProfile: CoachProfile = {
    id: data?.id,
    first_name: data?.first_name ?? null,
    last_name: data?.last_name ?? null,
    bio: data?.bio ?? null,
    specialty: data?.specialty ?? null,
    certifications: Array.isArray(data?.certifications) ? data.certifications : [],
    favorite_movements: Array.isArray(data?.favorite_movements) ? data.favorite_movements : [],
    avatar_url: data?.avatar_url ?? null
  };

  return updatedProfile;
};

export const trackWorkoutSet = async (
  workoutCompletionId: string, 
  exerciseId: string, 
  setData: any
) => {
  const { data, error } = await supabase
    .from('workout_set_completions')
    .insert({
      workout_completion_id: workoutCompletionId,
      exercise_id: exerciseId,
      ...setData
    })
    .select()
    .single();

  if (error) {
    console.error('Error tracking workout set:', error);
    throw error;
  }

  return data;
};

export const completeWorkout = async (
  workoutCompletionId: string, 
  rating: number | null, 
  notes: string
) => {
  const { data, error } = await supabase
    .from('workout_completions')
    .update({
      completed_at: new Date().toISOString(),
      rating,
      notes
    })
    .eq('id', workoutCompletionId)
    .select()
    .single();

  if (error) {
    console.error('Error completing workout:', error);
    throw error;
  }

  return data;
};

export const fetchPersonalRecords = async (userId: string) => {
  const { data, error } = await supabase
    .from('personal_records')
    .select(`
      *,
      exercise:exercise_id (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching personal records:', error);
    throw error;
  }

  return data;
};

export const fetchAllClientProfiles = async (): Promise<ClientProfile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_type', 'client');

  if (error) {
    console.error('Error fetching all client profiles:', error);
    throw error;
  }

  return (data || []).map(profile => ({
    id: profile?.id,
    first_name: profile?.first_name ?? null,
    last_name: profile?.last_name ?? null,
    city: profile?.city ?? null,
    state: profile?.state ?? null,
    birthday: profile?.birthday ?? null,
    height: profile?.height ?? null,
    weight: profile?.weight ?? null,
    fitness_goals: Array.isArray(profile?.fitness_goals) ? profile.fitness_goals : [],
    favorite_movements: Array.isArray(profile?.favorite_movements) ? profile.favorite_movements : [],
    avatar_url: profile?.avatar_url ?? null,
    profile_completed: Boolean(profile?.profile_completed)
  }));
};

