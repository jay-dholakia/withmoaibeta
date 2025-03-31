
/**
 * Client service methods for workout tracking and completion
 */

import { supabase } from "@/integrations/supabase/client";

// Type definitions
export interface ClientProfile {
  id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  city?: string;
  state?: string;
  birthday?: string | null;
  height?: string;
  weight?: string;
  avatar_url?: string;
  fitness_goals?: string[];
  favorite_movements?: string[];
  event_type?: string;
  event_date?: string;
  event_name?: string;
  profile_completed?: boolean;
}

export interface CoachProfile {
  id?: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar_url?: string;
  favorite_movements?: string[];
}

// Define the GroupData interface to explicitly include coach_id
export interface GroupData {
  id: string;
  name: string;
  coach_id: string;
  created_at: string;
  created_by: string;
  description?: string | null;
}

export interface LeaderboardEntry {
  user_id: string;
  email: string;
  total_workouts: number;
}

/**
 * Fetches the client profile data
 */
export const fetchClientProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error("Error fetching client profile:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error in fetchClientProfile:", error);
    throw error;
  }
};

/**
 * Creates a client profile if it doesn't exist
 */
export const createClientProfile = async (userId: string) => {
  try {
    // First check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error("Error checking client profile:", checkError);
      throw checkError;
    }
    
    if (existingProfile) {
      return existingProfile;
    }
    
    // Create new profile
    const { data, error } = await supabase
      .from('client_profiles')
      .insert({
        id: userId,
        profile_completed: false
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating client profile:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error in createClientProfile:", error);
    throw error;
  }
};

/**
 * Fetches all client profiles
 */
export const fetchAllClientProfiles = async () => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*');
    
    if (error) {
      console.error("Error fetching all client profiles:", error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in fetchAllClientProfiles:", error);
    throw error;
  }
};

/**
 * Uploads a client avatar
 */
export const uploadClientAvatar = async (userId: string, file: File) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('client-avatars')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('client-avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading client avatar:", error);
    throw error;
  }
};

/**
 * Tracks a set for a workout
 */
export const trackWorkoutSet = async (
  workoutCompletionId: string,
  workoutExerciseId: string,
  setNumber: number,
  weight: number | null,
  reps: number | null,
  notes: string | null = null,
  distance: string | null = null,
  duration: string | null = null,
  location: string | null = null
) => {
  try {
    console.log("Tracking workout set with params:", {
      workoutCompletionId,
      workoutExerciseId,
      setNumber,
      weight,
      reps,
      notes,
      distance,
      duration,
      location
    });

    // First, get the user_id from the workout_completions table
    const { data: completionData, error: completionError } = await supabase
      .from('workout_completions')
      .select('user_id, workout_id')
      .eq('id', workoutCompletionId)
      .maybeSingle();
    
    if (completionError) {
      console.error("Error fetching workout completion:", completionError);
      throw completionError;
    }
    
    if (!completionData || !completionData.user_id) {
      console.error("Cannot track set: No workout completion found for ID", workoutCompletionId);
      throw new Error("Workout completion not found");
    }
    
    const { data: existingSetData, error: existingSetError } = await supabase
      .from('workout_set_completions')
      .select('id')
      .eq('workout_completion_id', workoutCompletionId)
      .eq('workout_exercise_id', workoutExerciseId)
      .eq('set_number', setNumber)
      .maybeSingle();
    
    if (existingSetError) {
      console.error("Error checking for existing set:", existingSetError);
      throw existingSetError;
    }
    
    if (existingSetData) {
      // Update existing set
      const { data, error } = await supabase
        .from('workout_set_completions')
        .update({
          weight,
          reps_completed: reps,
          completed: true,
          notes,
          distance,
          duration,
          location
        })
        .eq('id', existingSetData.id)
        .select();
      
      if (error) {
        console.error("Error updating workout set:", error);
        throw error;
      }
      
      return data?.[0];
    } else {
      // Insert new set
      const { data, error } = await supabase
        .from('workout_set_completions')
        .insert({
          workout_completion_id: workoutCompletionId,
          workout_exercise_id: workoutExerciseId,
          user_id: completionData.user_id,
          set_number: setNumber,
          weight,
          reps_completed: reps,
          completed: true,
          notes,
          distance,
          duration,
          location
        })
        .select();
      
      if (error) {
        console.error("Error tracking workout set:", error);
        throw error;
      }
      
      return data?.[0];
    }
  } catch (error) {
    console.error("Error in trackWorkoutSet:", error);
    throw error;
  }
};

/**
 * Completes a workout
 */
export const completeWorkout = async (
  workoutCompletionId: string,
  rating: number | null,
  notes: string | null
) => {
  try {
    const { data, error } = await supabase
      .from('workout_completions')
      .update({
        completed_at: new Date().toISOString(),
        rating,
        notes
      })
      .eq('id', workoutCompletionId)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error("Error completing workout:", error);
      throw error;
    }
    
    // Check for any personal records that were achieved
    await fetchPersonalRecords(workoutCompletionId);
    
    return data;
  } catch (error) {
    console.error("Error in completeWorkout:", error);
    throw error;
  }
};

/**
 * Fetches personal records for a specific workout completion
 */
export const fetchPersonalRecords = async (workoutCompletionId: string) => {
  try {
    const { data, error } = await supabase
      .from('personal_records')
      .select(`
        *,
        exercise:exercise_id (*)
      `)
      .eq('workout_completion_id', workoutCompletionId);
    
    if (error) {
      console.error("Error fetching personal records:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error in fetchPersonalRecords:", error);
    throw error;
  }
};

/**
 * Updates a client profile
 */
export const updateClientProfile = async (userId: string, profileData: Partial<ClientProfile>) => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .update(profileData)
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
 * Submits beta feedback
 */
export const submitBetaFeedback = async (userId: string, feedback: string) => {
  try {
    const { data, error } = await supabase
      .from('beta_feedback')
      .insert({
        user_id: userId,
        feedback
      });
    
    if (error) {
      console.error("Error submitting beta feedback:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error in submitBetaFeedback:", error);
    throw error;
  }
};

/**
 * Fetches the coach profile data
 */
export const fetchCoachProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('coach_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error("Error fetching coach profile:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error in fetchCoachProfile:", error);
    throw error;
  }
};

/**
 * Updates a coach profile
 */
export const updateCoachProfile = async (userId: string, profileData: Partial<CoachProfile>) => {
  try {
    const { data, error } = await supabase
      .from('coach_profiles')
      .update(profileData)
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
 * Uploads a coach avatar
 */
export const uploadCoachAvatar = async (userId: string, file: File) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('coach-avatars')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('coach-avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading coach avatar:", error);
    throw error;
  }
};

/**
 * Fetches all groups
 */
export const fetchAllGroups = async (coachId?: string) => {
  try {
    // Create the base query without executing it yet
    let queryBuilder = supabase
      .from('groups')
      .select('*');
    
    // Add coach filter if provided
    if (coachId) {
      queryBuilder = queryBuilder.eq('coach_id', coachId);
    }
    
    // Execute the query with order clause
    const queryResult = await queryBuilder.order('created_at', { ascending: false });
    
    // Extract data and error using simple object destructuring to avoid type inference issues
    const data = queryResult.data as any[] || [];
    const error = queryResult.error;
    
    if (error) {
      console.error("Error fetching groups:", error);
      throw error;
    }
    
    // Transform the data to our GroupData interface
    const groups: GroupData[] = data.map(item => ({
      id: item.id,
      name: item.name,
      coach_id: item.coach_id || item.created_by, // Use created_by as fallback
      created_at: item.created_at,
      created_by: item.created_by,
      description: item.description
    }));
    
    return groups;
  } catch (error) {
    console.error("Error in fetchAllGroups:", error);
    throw error;
  }
};

/**
 * Fetches the weekly group leaderboard
 */
export const fetchGroupLeaderboardWeekly = async (groupId: string) => {
  try {
    // This is a simplified implementation. In a real app, you would 
    // fetch this data from a view or function in your database
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const { data: groupMembers, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);
    
    if (membersError) {
      console.error("Error fetching group members:", membersError);
      throw membersError;
    }
    
    const memberIds = groupMembers.map(m => m.user_id);
    
    if (memberIds.length === 0) {
      return [];
    }
    
    // Get user emails
    const { data: users, error: usersError } = await supabase.rpc('get_users_email', {
      user_ids: memberIds
    });
    
    if (usersError) {
      console.error("Error fetching user emails:", usersError);
      throw usersError;
    }
    
    const emailMap = users.reduce((map: Record<string, string>, user: any) => {
      map[user.id] = user.email;
      return map;
    }, {});
    
    // Count workouts completed this week per user
    const { data: workouts, error: workoutsError } = await supabase
      .from('workout_completions')
      .select('user_id, count')
      .in('user_id', memberIds)
      .gte('completed_at', startOfWeek.toISOString())
      .not('completed_at', 'is', null)
      .order('count', { ascending: false });
    
    if (workoutsError) {
      console.error("Error counting workouts:", workoutsError);
      throw workoutsError;
    }
    
    // Transform to leaderboard entries
    const leaderboard: LeaderboardEntry[] = [];
    
    for (const user_id of memberIds) {
      const workoutCount = workouts.find(w => w.user_id === user_id)?.count || 0;
      leaderboard.push({
        user_id,
        email: emailMap[user_id] || 'Unknown',
        total_workouts: Number(workoutCount)
      });
    }
    
    return leaderboard.sort((a, b) => b.total_workouts - a.total_workouts);
  } catch (error) {
    console.error("Error in fetchGroupLeaderboardWeekly:", error);
    throw error;
  }
};

/**
 * Fetches the monthly group leaderboard
 */
export const fetchGroupLeaderboardMonthly = async (groupId: string) => {
  try {
    // Similar to weekly, but with month timeframe
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const { data: groupMembers, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);
    
    if (membersError) {
      console.error("Error fetching group members:", membersError);
      throw membersError;
    }
    
    const memberIds = groupMembers.map(m => m.user_id);
    
    if (memberIds.length === 0) {
      return [];
    }
    
    // Get user emails
    const { data: users, error: usersError } = await supabase.rpc('get_users_email', {
      user_ids: memberIds
    });
    
    if (usersError) {
      console.error("Error fetching user emails:", usersError);
      throw usersError;
    }
    
    const emailMap = users.reduce((map: Record<string, string>, user: any) => {
      map[user.id] = user.email;
      return map;
    }, {});
    
    // Count workouts completed this month per user
    const { data: workouts, error: workoutsError } = await supabase
      .from('workout_completions')
      .select('user_id, count')
      .in('user_id', memberIds)
      .gte('completed_at', startOfMonth.toISOString())
      .not('completed_at', 'is', null)
      .order('count', { ascending: false });
    
    if (workoutsError) {
      console.error("Error counting workouts:", workoutsError);
      throw workoutsError;
    }
    
    // Transform to leaderboard entries
    const leaderboard: LeaderboardEntry[] = [];
    
    for (const user_id of memberIds) {
      const workoutCount = workouts.find(w => w.user_id === user_id)?.count || 0;
      leaderboard.push({
        user_id,
        email: emailMap[user_id] || 'Unknown',
        total_workouts: Number(workoutCount)
      });
    }
    
    return leaderboard.sort((a, b) => b.total_workouts - a.total_workouts);
  } catch (error) {
    console.error("Error in fetchGroupLeaderboardMonthly:", error);
    throw error;
  }
};

/**
 * Sends a password reset email
 */
export const sendPasswordResetEmail = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    if (error) {
      console.error("Error sending password reset email:", error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error in sendPasswordResetEmail:", error);
    return false;
  }
};

/**
 * Deletes a user account
 */
export const deleteUser = async (userId: string) => {
  try {
    // This is a simplified implementation. In a real app, you would need admin privileges,
    // and would probably use a serverless function to handle this securely.
    
    // First delete any related records (profiles, etc)
    const { error: profileError } = await supabase
      .from('client_profiles')
      .delete()
      .eq('id', userId);
    
    if (profileError) {
      console.error("Error deleting client profile:", profileError);
      throw profileError;
    }
    
    // Then delete from auth.users (using the correct RPC function name)
    const { error: deleteError } = await supabase.rpc('admin_delete_user', {
      user_id: userId
    });
    
    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      throw deleteError;
    }
    
    return true;
  } catch (error) {
    console.error("Error in deleteUser:", error);
    return false;
  }
};
