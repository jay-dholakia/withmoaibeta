
import { supabase } from "@/integrations/supabase/client";
import { fetchClientPrograms, fetchCurrentProgram } from "./program-service";
import { fetchClientWorkoutHistory } from "./client-workout-history-service";
import { fetchCoachGroups } from "./coach-group-service";

/**
 * Tracks a workout set completion
 * @param workoutCompletionId The ID of the workout completion
 * @param exerciseId The ID of the workout exercise
 * @param setNumber The set number
 * @param weight The weight used (optional)
 * @param reps The number of reps completed (optional)
 */
export const trackWorkoutSet = async (
  workoutCompletionId: string,
  exerciseId: string,
  setNumber: number,
  weight: number | null,
  reps: number | null
): Promise<any> => {
  try {
    // First fetch the workout completion to get the user_id
    const { data: workoutCompletion, error: workoutCompletionError } = await supabase
      .from('workout_completions')
      .select('user_id, workout_id')
      .eq('id', workoutCompletionId)
      .single();
    
    if (workoutCompletionError) {
      console.error('Error fetching workout completion:', workoutCompletionError);
      throw workoutCompletionError;
    }
    
    if (!workoutCompletion) {
      throw new Error(`Workout completion not found: ${workoutCompletionId}`);
    }
    
    // Now check if a set completion record already exists
    const { data: existingSet, error: queryError } = await supabase
      .from('workout_set_completions')
      .select('*')
      .eq('workout_completion_id', workoutCompletionId)
      .eq('workout_exercise_id', exerciseId)  // Make sure we're using workout_exercise_id here
      .eq('set_number', setNumber)
      .maybeSingle();
    
    if (queryError) {
      console.error('Error checking for existing set completion:', queryError);
      throw queryError;
    }
    
    console.log('Existing set check result:', existingSet);
    
    if (existingSet) {
      // Update existing record
      const { data, error } = await supabase
        .from('workout_set_completions')
        .update({
          weight: weight,
          reps_completed: reps,
          completed: true
        })
        .eq('id', existingSet.id)
        .select();
      
      if (error) {
        console.error('Error updating set completion:', error);
        throw error;
      }
      
      console.log('Updated set completion:', data);
      return data;
    } else {
      // Create new record
      console.log('Creating new set completion with data:', {
        workout_completion_id: workoutCompletionId,
        workout_exercise_id: exerciseId,
        set_number: setNumber,
        weight: weight,
        reps_completed: reps,
        completed: true,
        user_id: workoutCompletion.user_id // Add the user_id from the workout completion
      });
      
      const { data, error } = await supabase
        .from('workout_set_completions')
        .insert({
          workout_completion_id: workoutCompletionId,
          workout_exercise_id: exerciseId, // Using workout_exercise_id consistently
          set_number: setNumber,
          weight: weight,
          reps_completed: reps,
          completed: true,
          user_id: workoutCompletion.user_id // Add the user_id from the workout completion
        })
        .select();
      
      if (error) {
        console.error('Error creating set completion:', error);
        throw error;
      }
      
      console.log('Created new set completion:', data);
      return data;
    }
  } catch (error) {
    console.error('Error tracking workout set:', error);
    throw error;
  }
};

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
  id: string;
  bio: string | null;
  avatar_url: string | null;
  favorite_movements: string[] | null;
  first_name: string | null;
  last_name: string | null;
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
    
    if (error) {
      console.error("Error fetching client profile:", error);
      
      // If the error is that no profile exists, create one
      if (error.code === 'PGRST116') {
        console.log("No profile found, attempting to create one");
        return await createClientProfile(userId);
      }
      
      return null;
    }
    return data as ClientProfile;
  } catch (error) {
    console.error("Error fetching client profile:", error);
    return null;
  }
};

// New function to create a client profile
export const createClientProfile = async (userId: string): Promise<ClientProfile | null> => {
  try {
    console.log(`Creating new client profile for user: ${userId}`);
    
    // Create a minimal profile with just the ID
    const { data, error } = await supabase
      .from('client_profiles')
      .insert({
        id: userId,
        fitness_goals: [],
        favorite_movements: [],
        profile_completed: false
      })
      .select();
    
    if (error) {
      console.error("Error creating client profile:", error);
      return null;
    }
    
    console.log("Created profile:", data[0]);
    return data[0] as ClientProfile;
  } catch (error) {
    console.error("Error creating client profile:", error);
    return null;
  }
};

export const updateClientProfile = async (userId: string, profileData: Partial<ClientProfile>): Promise<ClientProfile> => {
  try {
    // First check if profile exists
    const existingProfile = await fetchClientProfile(userId);
    
    if (!existingProfile) {
      console.log("Profile doesn't exist, creating it first");
      // Create profile with the update data
      const initialData = {
        id: userId,
        ...profileData,
        fitness_goals: profileData.fitness_goals || [],
        favorite_movements: profileData.favorite_movements || []
      };
      
      const { data, error } = await supabase
        .from('client_profiles')
        .insert(initialData)
        .select()
        .single();
      
      if (error) throw error;
      return data as ClientProfile;
    }
    
    // Otherwise update the existing profile
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

// Coach Profile Functions - Updated to properly handle profile creation if it doesn't exist
export const fetchCoachProfile = async (coachId: string): Promise<CoachProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('coach_profiles')
      .select('*')
      .eq('id', coachId)
      .single();
    
    if (error) {
      // If error is "no rows returned", it means the profile doesn't exist yet
      if (error.code === 'PGRST116') {
        console.log("Coach profile doesn't exist yet, will be created on first update");
        return {
          id: coachId,
          bio: null,
          avatar_url: null,
          favorite_movements: [],
          first_name: null,
          last_name: null
        };
      }
      throw error;
    }
    return data as CoachProfile;
  } catch (error) {
    console.error("Error fetching coach profile:", error);
    return null;
  }
};

export const updateCoachProfile = async (coachId: string, profileData: Partial<CoachProfile>): Promise<CoachProfile> => {
  try {
    // First check if profile exists
    const { count, error: countError } = await supabase
      .from('coach_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('id', coachId);
    
    if (countError) throw countError;
    
    let data;
    
    // If profile doesn't exist, create it
    if (count === 0) {
      console.log("Creating new coach profile");
      const { data: insertData, error: insertError } = await supabase
        .from('coach_profiles')
        .insert({ 
          id: coachId,
          ...profileData 
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      data = insertData;
    } else {
      // Otherwise update it
      console.log("Updating existing coach profile");
      const { data: updateData, error: updateError } = await supabase
        .from('coach_profiles')
        .update(profileData)
        .eq('id', coachId)
        .select()
        .single();
      
      if (updateError) throw updateError;
      data = updateData;
    }
    
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

export const completeWorkout = async (
  workoutCompletionId: string,
  rating: number | null,
  notes: string
): Promise<any> => {
  try {
    console.log(`Completing workout ${workoutCompletionId} with rating: ${rating}, notes: ${notes}`);
    
    const { data, error } = await supabase
      .from('workout_completions')
      .update({
        completed_at: new Date().toISOString(),
        rating: rating,
        notes: notes
      })
      .eq('id', workoutCompletionId)
      .select();
    
    if (error) {
      console.error("Error completing workout:", error);
      throw error;
    }
    
    console.log("Workout completed successfully:", data);
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
