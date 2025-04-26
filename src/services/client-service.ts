import { supabase } from '@/integrations/supabase/client';
import { PersonalRecord } from '@/types/workout';

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
  const { data: existingProfile, error: checkError } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error("Error checking for existing profile:", checkError);
    throw checkError;
  }

  if (existingProfile) {
    return existingProfile as ClientProfile;
  }

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
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (profileError) {
      console.error("Error deleting user profile:", profileError);
      throw profileError;
    }
    
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
      console.error("Error deleting user from auth:", error);
      throw error;
    }
    
    return true;
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
export const trackWorkoutSet = async (
  exerciseId: string, 
  completionId: string, 
  setNumber: number, 
  data: {
    weight?: number | null;
    reps_completed?: number | null;
    notes?: string | null;
    distance?: string | null;
    duration?: string | null;
    location?: string | null;
    completed?: boolean;
  }
) => {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;

  if (!userId) {
    throw new Error("User must be authenticated to track workout sets");
  }
  
  console.log(`Tracking set ${setNumber} for exercise ${exerciseId}`, data);
  
  try {
    // Check if this set already exists
    const { data: existingSet, error: checkError } = await supabase
      .from('workout_set_completions')
      .select('id')
      .eq('workout_exercise_id', exerciseId)
      .eq('workout_completion_id', completionId)
      .eq('set_number', setNumber)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (checkError) {
      console.error("Error checking for existing set:", checkError);
      throw checkError;
    }
    
    if (existingSet) {
      // Update existing set
      const { data: updatedSet, error: updateError } = await supabase
        .from('workout_set_completions')
        .update({
          weight: data.weight,
          reps_completed: data.reps_completed,
          notes: data.notes,
          distance: data.distance,
          duration: data.duration,
          location: data.location,
          completed: data.completed || false
        })
        .eq('id', existingSet.id)
        .select()
        .single();
        
      if (updateError) {
        console.error("Error updating workout set:", updateError);
        throw updateError;
      }
      
      return updatedSet;
    }
    
    // Insert new set
    const { data: result, error } = await supabase
      .from('workout_set_completions')
      .insert([{
        workout_exercise_id: exerciseId,
        workout_completion_id: completionId,
        set_number: setNumber,
        weight: data.weight,
        reps_completed: data.reps_completed,
        notes: data.notes,
        distance: data.distance,
        duration: data.duration,
        location: data.location,
        completed: data.completed || false,
        user_id: userId
      }])
      .select()
      .single();

    if (error) {
      console.error("Error tracking workout set:", error);
      throw error;
    }

    return result;
  } catch (error) {
    console.error("Error in trackWorkoutSet:", error);
    throw error;
  }
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
export const fetchPersonalRecords = async (userId: string): Promise<PersonalRecord[]> => {
  const { data, error } = await supabase
    .from('personal_records')
    .select(`
      *,
      exercise:exercises(name, category)
    `)
    .eq('user_id', userId);

  if (error) {
    console.error("Error fetching personal records:", error);
    throw error;
  }

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
      exercise:exercises(name, category)
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
