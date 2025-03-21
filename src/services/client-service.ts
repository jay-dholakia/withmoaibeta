import { supabase } from "@/integrations/supabase/client";
import { fetchClientPrograms, fetchCurrentProgram } from "./program-service";
import { fetchClientWorkoutHistory } from "./workout-history-service";
import { fetchCoachGroups } from "./coach-group-service";

// Re-export the functions from other services so existing imports still work
export { fetchClientPrograms, fetchCurrentProgram, fetchClientWorkoutHistory, fetchCoachGroups };

// Client Profile Types
export interface ClientProfile {
  id?: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  state: string | null;
  birthday: string | null;
  height: string | null;
  weight: string | null;
  avatar_url: string | null;
  fitness_goals: string[];
  favorite_movements: string[];
  profile_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

// Coach Profile Types - Updated to match the actual database schema
export interface CoachProfile {
  id?: string;
  bio: string | null;
  avatar_url: string | null;
  favorite_movements: string[] | null;
  created_at?: string;
  updated_at?: string;
}

// Client Data Types for Coach Views
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

// Group Types
export interface GroupData {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  member_count: number;
}

// Leaderboard Entry Type
export interface LeaderboardEntry {
  user_id: string;
  email: string;
  total_workouts: number;
}

// Workout History Types
export interface WorkoutCompletionBasic {
  id: string;
  completed_at: string;
  notes?: string;
  rating?: number;
  user_id: string;
  workout_id: string;
}

export interface WorkoutBasic {
  id: string;
  title: string;
  description?: string;
  day_of_week: number;
  week_id: string;
  week?: {
    week_number: number;
    program?: {
      title: string;
    }
  } | null;
}

export interface WorkoutHistoryItem extends WorkoutCompletionBasic {
  workout?: WorkoutBasic | null;
}

// Client Profile Functions
export const fetchClientProfile = async (userId: string): Promise<ClientProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data as ClientProfile;
  } catch (error) {
    console.error("Error fetching client profile:", error);
    return null;
  }
};

export const updateClientProfile = async (userId: string, profileData: Partial<ClientProfile>): Promise<ClientProfile> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data as ClientProfile;
  } catch (error) {
    console.error("Error updating client profile:", error);
    throw error;
  }
};

export const uploadClientAvatar = async (userId: string, file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('client-avatars')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage
      .from('client-avatars')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw error;
  }
};

// Coach Profile Functions - Updated to match the database schema
export const fetchCoachProfile = async (coachId: string): Promise<CoachProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('coach_profiles')
      .select('*')
      .eq('id', coachId)
      .single();
    
    if (error) throw error;
    return data as CoachProfile;
  } catch (error) {
    console.error("Error fetching coach profile:", error);
    return null;
  }
};

export const updateCoachProfile = async (coachId: string, profileData: Partial<CoachProfile>): Promise<CoachProfile> => {
  try {
    const { data, error } = await supabase
      .from('coach_profiles')
      .update(profileData)
      .eq('id', coachId)
      .select()
      .single();
    
    if (error) throw error;
    return data as CoachProfile;
  } catch (error) {
    console.error("Error updating coach profile:", error);
    throw error;
  }
};

export const uploadCoachAvatar = async (coachId: string, file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${coachId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('coach-avatars')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage
      .from('coach-avatars')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw error;
  }
};

// Coach Client Functions
export const fetchCoachClients = async (coachId: string): Promise<ClientData[]> => {
  try {
    const { data, error } = await supabase.rpc('get_coach_clients', { coach_id: coachId });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching coach clients:", error);
    return [];
  }
};

export const fetchAllClientProfiles = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'client');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching client profiles:", error);
    return [];
  }
};

// Group Functions
export const fetchClientGroups = async (coachId: string): Promise<GroupData[]> => {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        group_coaches!inner (coach_id),
        group_members (user_id)
      `)
      .eq('group_coaches.coach_id', coachId);
    
    if (error) throw error;
    
    // Transform the data to include member count
    return data.map(group => ({
      ...group,
      member_count: Array.isArray(group.group_members) ? group.group_members.length : 0
    }));
  } catch (error) {
    console.error("Error fetching coach groups:", error);
    return [];
  }
};

export const fetchAllGroups = async (): Promise<GroupData[]> => {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        group_members (user_id)
      `);
    
    if (error) throw error;
    
    return data.map(group => ({
      ...group,
      member_count: Array.isArray(group.group_members) ? group.group_members.length : 0
    }));
  } catch (error) {
    console.error("Error fetching all groups:", error);
    return [];
  }
};

// Workout Functions
export const startWorkout = async (userId: string, workoutId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('workout_completions')
      .insert({
        user_id: userId,
        workout_id: workoutId,
        started_at: new Date().toISOString(),
        status: 'in_progress'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error("Error starting workout:", error);
    throw error;
  }
};

export const trackWorkoutSet = async (
  workoutCompletionId: string,
  exerciseId: string,
  userId: string,
  setNumber: number,
  weight: number | null,
  reps: number | null
): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('workout_set_completions')
      .upsert({
        workout_completion_id: workoutCompletionId,
        workout_exercise_id: exerciseId,
        user_id: userId,
        set_number: setNumber,
        weight: weight,
        reps_completed: reps,
        completed: true
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error tracking workout set:", error);
    throw error;
  }
};

export const completeWorkout = async (
  workoutCompletionId: string,
  rating: number | null,
  notes: string
): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('workout_completions')
      .update({
        completed_at: new Date().toISOString(),
        status: 'completed',
        rating: rating,
        notes: notes
      })
      .eq('id', workoutCompletionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error completing workout:", error);
    throw error;
  }
};

// Simplify the fetchOngoingWorkout function to avoid deep type instantiation
export const fetchOngoingWorkout = async (userId: string): Promise<any | null> => {
  try {
    // First fetch the workout completion
    const { data: completion, error: completionError } = await supabase
      .from('workout_completions')
      .select('*')
      .eq('user_id', userId)
      .is('completed_at', null)
      .maybeSingle();
    
    if (completionError) {
      console.error("Error fetching ongoing workout completion:", completionError);
      throw completionError;
    }
    
    if (!completion) {
      return null;
    }
    
    // Then fetch the workout details
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', completion.workout_id)
      .maybeSingle();
    
    if (workoutError) {
      console.error("Error fetching workout details:", workoutError);
      throw workoutError;
    }
    
    // Finally fetch the workout exercises
    const { data: exercises, error: exercisesError } = await supabase
      .from('workout_exercises')
      .select(`
        *,
        exercise:exercise_id (*)
      `)
      .eq('workout_id', completion.workout_id);
    
    if (exercisesError) {
      console.error("Error fetching workout exercises:", exercisesError);
      throw exercisesError;
    }
    
    // Combine the data
    return {
      ...completion,
      workout: {
        ...workout,
        workout_exercises: exercises || []
      }
    };
  } catch (error) {
    console.error("Error fetching ongoing workout:", error);
    return null;
  }
};

export const fetchPersonalRecords = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('personal_records')
      .select(`
        *,
        exercise:exercise_id (*)
      `)
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching personal records:", error);
    return [];
  }
};

// Leaderboard Functions
export const fetchGroupLeaderboardWeekly = async (groupId: string): Promise<LeaderboardEntry[]> => {
  try {
    // Get the start of the current week (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
    const startOfWeek = new Date(today.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabase.rpc(
      'get_group_weekly_leaderboard', 
      { 
        group_id: groupId,
        start_date: startOfWeek.toISOString()
      }
    );
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching weekly leaderboard:", error);
    return [];
  }
};

export const fetchGroupLeaderboardMonthly = async (groupId: string): Promise<LeaderboardEntry[]> => {
  try {
    // Get the start of the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabase.rpc(
      'get_group_monthly_leaderboard', 
      { 
        group_id: groupId,
        start_date: startOfMonth.toISOString()
      }
    );
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching monthly leaderboard:", error);
    return [];
  }
};
