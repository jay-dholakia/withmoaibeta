
import { supabase } from '@/integrations/supabase/client';
import { PersonalRecord } from '@/types/workout';

// Client profile interface
export interface ClientProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  birthday?: string;
  height?: string;
  weight?: string;
  city?: string;
  state?: string;
  avatar_url?: string;
  fitness_goals?: string[];
  favorite_movements?: string[];
  event_type?: string;
  event_date?: string;
  event_name?: string;
  profile_completed?: boolean;
  created_at?: string;
}

/**
 * Fetch personal records
 */
export const fetchPersonalRecords = async (userId: string): Promise<PersonalRecord[]> => {
  const { data, error } = await supabase
    .from('personal_records')
    .select(`
      *,
      exercise:exercise_id (name, category)
    `)
    .eq('user_id', userId);

  if (error) {
    console.error("Error fetching personal records:", error);
    throw error;
  }

  // Log the raw data for debugging
  console.log("Raw personal records data from DB:", data);

  return data.map(record => ({
    ...record,
    exercise_name: record.exercise?.name
  })) as PersonalRecord[];
};

/**
 * Fetch personal record for a specific exercise
 */
export const fetchExercisePersonalRecord = async (userId: string, exerciseId: string): Promise<PersonalRecord | null> => {
  const { data, error } = await supabase
    .from('personal_records')
    .select(`
      *,
      exercise:exercise_id (name, category)
    `)
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching personal record for exercise ${exerciseId}:`, error);
    throw error;
  }

  if (!data) return null;
  
  return {
    ...data,
    exercise_name: data.exercise?.name
  } as PersonalRecord;
};

/**
 * Fetch client profile by user ID
 */
export const fetchClientProfile = async (userId: string): Promise<ClientProfile> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching client profile:", error);
    throw error;
  }

  return data as ClientProfile;
};

/**
 * Fetch all client profiles
 */
export const fetchAllClientProfiles = async (): Promise<ClientProfile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_type', 'client');

  if (error) {
    console.error("Error fetching all client profiles:", error);
    throw error;
  }

  return data as ClientProfile[];
};

/**
 * Create client profile
 */
export const createClientProfile = async (userId: string): Promise<ClientProfile | null> => {
  // First check if profile already exists
  const { data: existingProfile, error: checkError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (checkError) {
    console.error("Error checking for existing profile:", checkError);
    throw checkError;
  }

  if (existingProfile) {
    return existingProfile as ClientProfile;
  }

  // Create new profile if it doesn't exist
  const { data, error } = await supabase
    .from('profiles')
    .insert([{ id: userId, user_type: 'client' }])
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error creating client profile:", error);
    throw error;
  }

  return data as ClientProfile;
};

/**
 * Update client profile
 */
export const updateClientProfile = async (userId: string, profileData: Partial<ClientProfile>): Promise<ClientProfile> => {
  const { data, error } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error updating client profile:", error);
    throw error;
  }

  return data as ClientProfile;
};

/**
 * Upload client avatar
 */
export const uploadClientAvatar = async (userId: string, file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error } = await supabase.storage
    .from('user-content')
    .upload(filePath, file);

  if (error) {
    console.error("Error uploading avatar:", error);
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('user-content')
    .getPublicUrl(filePath);

  // Update user profile with new avatar URL
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId);

  if (updateError) {
    console.error("Error updating profile with avatar URL:", updateError);
    throw updateError;
  }

  return publicUrl;
};

/**
 * Complete a workout
 */
export const completeWorkout = async (workoutId: string, userId: string, data: any): Promise<void> => {
  const { error } = await supabase
    .from('workout_completions')
    .insert([{
      workout_id: workoutId,
      user_id: userId,
      completed_at: new Date().toISOString(),
      ...data
    }]);

  if (error) {
    console.error("Error completing workout:", error);
    throw error;
  }
};

/**
 * Track workout set
 */
export const trackWorkoutSet = async (setData: any): Promise<void> => {
  const { error } = await supabase
    .from('workout_set_completions')
    .insert([setData]);

  if (error) {
    console.error("Error tracking workout set:", error);
    throw error;
  }
};

/**
 * Delete user account
 */
export const deleteUser = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .functions
    .invoke('delete-user', {
      body: { userId }
    });

  if (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });

  if (error) {
    console.error("Error sending password reset:", error);
    throw error;
  }
};
