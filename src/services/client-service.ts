import { supabase } from '@/integrations/supabase/client';

/**
 * Client Profile interface
 */
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
  fitness_goals: string[];
  favorite_movements: string[];
  event_type: string | null;
  event_date: string | null;
  event_name: string | null;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch client profile
 */
export const fetchClientProfile = async (userId: string): Promise<ClientProfile> => {
  const { data, error } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error("Error fetching client profile:", error);
    throw error;
  }

  return data as ClientProfile;
};

/**
 * Create client profile if it doesn't exist
 */
export const createClientProfile = async (userId: string): Promise<ClientProfile | null> => {
  // Check if profile exists
  const { data: existingProfile, error: checkError } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error("Error checking for existing profile:", checkError);
    throw checkError;
  }

  // If profile exists, return it
  if (existingProfile) {
    return existingProfile as ClientProfile;
  }

  // Otherwise, create a new profile
  const { data: newProfile, error: createError } = await supabase
    .from('client_profiles')
    .insert([{ id: userId }])
    .select()
    .single();

  if (createError) {
    console.error("Error creating client profile:", createError);
    throw createError;
  }

  return newProfile as ClientProfile;
};

/**
 * Update client profile
 */
export const updateClientProfile = async (userId: string, profileData: Partial<ClientProfile>): Promise<ClientProfile> => {
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

  return data as ClientProfile;
};

/**
 * Upload client avatar
 */
export const uploadClientAvatar = async (userId: string, file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file);

  if (uploadError) {
    console.error("Error uploading avatar:", uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  // Update the user profile with the new avatar URL
  await updateClientProfile(userId, {
    avatar_url: data.publicUrl
  });

  return data.publicUrl;
};

/**
 * Delete user
 */
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('admin_delete_user', { user_id: userId });
    
    if (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
    
    // Return the boolean result directly from the RPC function
    return data === true;
  } catch (error) {
    console.error("Error in deleteUser:", error);
    throw error;
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

/**
 * Fetch all client profiles
 */
export const fetchAllClientProfiles = async () => {
  const { data, error } = await supabase
    .from('client_profiles')
    .select('*');

  if (error) {
    console.error("Error fetching client profiles:", error);
    throw error;
  }

  return data;
};

/**
 * Track workout set
 */
export const trackWorkoutSet = async (workoutData: any) => {
  const { data, error } = await supabase
    .from('workout_set_completions')
    .insert([workoutData])
    .select()
    .single();

  if (error) {
    console.error("Error tracking workout set:", error);
    throw error;
  }

  return data;
};

/**
 * Complete workout
 */
export const completeWorkout = async (workoutCompletionId: string) => {
  const { data, error } = await supabase
    .from('workout_completions')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', workoutCompletionId)
    .select()
    .single();

  if (error) {
    console.error("Error completing workout:", error);
    throw error;
  }

  return data;
};

/**
 * Fetch personal records
 */
export const fetchPersonalRecords = async (userId: string) => {
  const { data, error } = await supabase
    .from('personal_records')
    .select(`
      *,
      exercise:exercise_id (name, category, equipment)
    `)
    .eq('user_id', userId);

  if (error) {
    console.error("Error fetching personal records:", error);
    throw error;
  }

  return data;
};
