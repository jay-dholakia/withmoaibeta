import { supabase } from "@/integrations/supabase/client";
import { Exercise } from "@/types/workout";
import { User } from "@supabase/supabase-js";

/**
 * Helper function to get the current authenticated user
 */
export const getUser = (): User | null => {
  const { data } = supabase.auth.getSession();
  return data?.session?.user || null;
};

/**
 * Client profile interface
 */
export interface ClientProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  state?: string;
  height?: string;
  weight?: string;
  birthday?: string;
  avatar_url?: string;
  fitness_goals?: string[];
  favorite_movements?: string[];
  event_name?: string;
  event_type?: string;
  event_date?: string;
  profile_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Coach profile interface
 */
export interface CoachProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar_url?: string;
  favorite_movements?: string[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch a client's profile
 */
export const fetchClientProfile = async (userId: string): Promise<ClientProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching client profile:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in fetchClientProfile:", error);
    return null;
  }
};

/**
 * Create a client profile
 */
export const createClientProfile = async (userId: string): Promise<ClientProfile | null> => {
  try {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
      
    if (existingProfile) {
      console.log("Profile already exists, returning existing profile");
      return existingProfile;
    }
    
    // Create new profile
    const { data, error } = await supabase
      .from('client_profiles')
      .insert({ id: userId })
      .select()
      .single();

    if (error) {
      console.error("Error creating client profile:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in createClientProfile:", error);
    return null;
  }
};

/**
 * Update a client's profile
 */
export const updateClientProfile = async (
  userId: string, 
  updates: Partial<ClientProfile>
): Promise<ClientProfile> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating client profile:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in updateClientProfile:", error);
    throw error;
  }
};

/**
 * Upload a client's avatar image
 */
export const uploadClientAvatar = async (userId: string, file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('client-avatars')
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error uploading avatar:", uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('client-avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error("Error in uploadClientAvatar:", error);
    throw error;
  }
};

/**
 * Fetch a coach's profile
 */
export const fetchCoachProfile = async (userId: string): Promise<CoachProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('coach_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching coach profile:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in fetchCoachProfile:", error);
    return null;
  }
};

/**
 * Update a coach's profile
 */
export const updateCoachProfile = async (
  userId: string, 
  updates: Partial<CoachProfile>
): Promise<CoachProfile> => {
  try {
    const { data, error } = await supabase
      .from('coach_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating coach profile:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in updateCoachProfile:", error);
    throw error;
  }
};

/**
 * Upload a coach's avatar image
 */
export const uploadCoachAvatar = async (userId: string, file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('coach-avatars')
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error uploading avatar:", uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('coach-avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error("Error in uploadCoachAvatar:", error);
    throw error;
  }
};

/**
 * Fetch all client profiles
 */
export const fetchAllClientProfiles = async (): Promise<ClientProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching all client profiles:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchAllClientProfiles:", error);
    return [];
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error("Error sending password reset email:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in sendPasswordResetEmail:", error);
    return false;
  }
};

/**
 * Delete a user
 */
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    // Delete user from auth
    const { error } = await supabase.functions.invoke('delete-user', {
      body: { user_id: userId }
    });

    if (error) {
      console.error("Error deleting user:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteUser:", error);
    return false;
  }
};

/**
 * Leaderboard entry interface
 */
export interface LeaderboardEntry {
  user_id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  workouts_completed: number;
  life_happens_used: number;
}

/**
 * Group data interface
 */
export interface GroupData {
  id: string;
  name: string;
  description?: string;
  members: LeaderboardEntry[];
}

/**
 * Fetch group leaderboard data (weekly)
 */
export const fetchGroupLeaderboardWeekly = async (groupId: string): Promise<GroupData | null> => {
  try {
    // First get the group info
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError) {
      console.error("Error fetching group data:", groupError);
      return null;
    }

    // Then get the leaderboard data
    const { data: leaderboardData, error: leaderboardError } = await supabase.functions.invoke(
      'get-group-leaderboard',
      {
        body: { group_id: groupId, timeframe: 'week' }
      }
    );

    if (leaderboardError) {
      console.error("Error fetching group leaderboard:", leaderboardError);
      return null;
    }

    return {
      ...groupData,
      members: leaderboardData || []
    };
  } catch (error) {
    console.error("Error in fetchGroupLeaderboardWeekly:", error);
    return null;
  }
};

/**
 * Fetch group leaderboard data (monthly)
 */
export const fetchGroupLeaderboardMonthly = async (groupId: string): Promise<GroupData | null> => {
  try {
    // First get the group info
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError) {
      console.error("Error fetching group data:", groupError);
      return null;
    }

    // Then get the leaderboard data
    const { data: leaderboardData, error: leaderboardError } = await supabase.functions.invoke(
      'get-group-leaderboard',
      {
        body: { group_id: groupId, timeframe: 'month' }
      }
    );

    if (leaderboardError) {
      console.error("Error fetching group leaderboard:", leaderboardError);
      return null;
    }

    return {
      ...groupData,
      members: leaderboardData || []
    };
  } catch (error) {
    console.error("Error in fetchGroupLeaderboardMonthly:", error);
    return null;
  }
};

/**
 * Fetch all groups
 */
export const fetchAllGroups = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error("Error fetching all groups:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchAllGroups:", error);
    return [];
  }
};

/**
 * Fetch all exercises
 */
export const fetchExercises = async (): Promise<Exercise[]> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error("Error fetching exercises:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchExercises:", error);
    return [];
  }
};

/**
 * Fetch a single exercise by ID
 */
export const fetchExerciseById = async (exerciseId: string): Promise<Exercise | null> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exerciseId)
      .single();

    if (error) {
      console.error("Error fetching exercise by ID:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in fetchExerciseById:", error);
    return null;
  }
};

/**
 * Track a workout set completion
 */
export const trackWorkoutSet = async (
  workoutCompletionId: string,
  workoutExerciseId: string,
  setNumber: number,
  weight: number | null = null,
  reps: number | null = null,
  notes: string | null = null,
  distance: string | null = null,
  duration: string | null = null,
  location: string | null = null
) => {
  try {
    // First check if this workout completion exists
    const { data: workoutCompletion, error: fetchError } = await supabase
      .from('workout_completions')
      .select('*')
      .eq('id', workoutCompletionId)
      .maybeSingle();
      
    if (fetchError) {
      console.error("Error fetching workout completion:", fetchError);
      throw fetchError;
    }
    
    if (!workoutCompletion) {
      console.error("Workout completion not found with ID:", workoutCompletionId);
      
      // Get the user and workout_id information from workout_exercise_id
      const { data: exerciseData, error: exerciseError } = await supabase
        .from('workout_exercises')
        .select('workout_id')
        .eq('id', workoutExerciseId)
        .maybeSingle();
        
      if (exerciseError || !exerciseData) {
        console.error("Error fetching workout exercise data:", exerciseError);
        throw exerciseError || new Error("Could not find workout exercise data");
      }
      
      // Create a new workout completion record
      const { data: newCompletionData, error: insertError } = await supabase
        .from('workout_completions')
        .insert({
          id: workoutCompletionId,
          workout_id: exerciseData.workout_id,
          user_id: getUser()?.id,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (insertError) {
        console.error("Error creating workout completion:", insertError);
        throw insertError;
      }
    }
    
    // Check if a set completion already exists
    const { data: existingSet, error: existingSetError } = await supabase
      .from('workout_set_completions')
      .select('*')
      .eq('workout_completion_id', workoutCompletionId)
      .eq('workout_exercise_id', workoutExerciseId)
      .eq('set_number', setNumber)
      .maybeSingle();
      
    if (existingSetError) {
      console.error("Error checking for existing set completion:", existingSetError);
    }
    
    // If set already exists, update it
    if (existingSet) {
      const { data, error } = await supabase
        .from('workout_set_completions')
        .update({
          reps_completed: reps,
          weight,
          completed: true,
          notes,
          distance,
          duration,
          location,
        })
        .eq('id', existingSet.id)
        .select()
        .single();
        
      if (error) {
        console.error("Error updating workout set:", error);
        throw error;
      }
      
      return data;
    } else {
      // Create a new set completion
      const { data, error } = await supabase
        .from('workout_set_completions')
        .insert({
          workout_completion_id: workoutCompletionId,
          workout_exercise_id: workoutExerciseId,
          set_number: setNumber,
          reps_completed: reps,
          weight,
          completed: true,
          user_id: getUser()?.id,
          notes,
          distance,
          duration,
          location,
        })
        .select()
        .single();
        
      if (error) {
        console.error("Error tracking workout set:", error);
        throw error;
      }
      
      return data;
    }
  } catch (error) {
    console.error("Error in trackWorkoutSet:", error);
    throw error;
  }
};

/**
 * Complete a workout
 */
export const completeWorkout = async (
  workoutId: string,
  rating: number | null = null,
  notes: string | null = null
) => {
  try {
    // First check if this is a workout ID or a workout completion ID
    const { data: existingCompletion, error: fetchError } = await supabase
      .from('workout_completions')
      .select('*')
      .eq('id', workoutId)
      .maybeSingle();
      
    if (fetchError) {
      console.error("Error checking workout completion:", fetchError);
    }
    
    // If this is already a completion ID, just update it
    if (existingCompletion) {
      const { data, error } = await supabase
        .from('workout_completions')
        .update({
          rating,
          notes,
          completed_at: new Date().toISOString(),
        })
        .eq('id', workoutId)
        .select()
        .single();
        
      if (error) {
        console.error("Error completing workout:", error);
        throw error;
      }
      
      return data;
    } else {
      // This is a workout ID, not a completion ID
      // Create a new completion record
      const { data, error } = await supabase
        .from('workout_completions')
        .insert({
          workout_id: workoutId,
          user_id: getUser()?.id,
          rating,
          notes,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();
        
      if (error) {
        console.error("Error recording workout completion:", error);
        throw error;
      }
      
      return data;
    }
  } catch (error) {
    console.error("Error in completeWorkout:", error);
    throw error;
  }
};

/**
 * Fetch personal records for a user
 */
export const fetchPersonalRecords = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error("Error fetching personal records:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in fetchPersonalRecords:", error);
    return null;
  }
};
