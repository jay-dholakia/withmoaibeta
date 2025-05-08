
import { supabase } from "@/integrations/supabase/client";

/**
 * Client Profile type definition
 */
export interface ClientProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  weight?: string;
  height?: string;
  birthday?: string | null; // Changed from string | Date to string | null
  city?: string;
  state?: string;
  fitness_goals?: string[];
  favorite_movements?: string[];
  program_type?: string;
  event_type?: string;
  event_name?: string;
  event_date?: string | null; // Changed from string | Date to string | null
  avatar_url?: string;
  profile_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Saves journal notes for a workout completion
 * @param workoutCompletionId ID of the workout completion
 * @param notes Notes to save
 * @returns Promise resolving to a boolean indicating success/failure
 */
export const saveWorkoutJournalNotes = async (
  workoutCompletionId: string,
  notes: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_completions')
      .update({ notes })
      .eq('id', workoutCompletionId);

    if (error) {
      console.error('Error saving workout journal notes:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in saveWorkoutJournalNotes:', error);
    return false;
  }
};

/**
 * Fetches a client's profile
 * @param userId The user's ID
 * @returns Promise resolving to the client profile or null if not found
 */
export const fetchClientProfile = async (userId: string): Promise<ClientProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching client profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchClientProfile:', error);
    return null;
  }
};

/**
 * Creates a new client profile
 * @param userId The user's ID
 * @returns Promise resolving to the created profile or null on failure
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
      return existingProfile;
    }

    // Create new profile
    const { data, error } = await supabase
      .from('client_profiles')
      .insert([{ id: userId }])
      .select()
      .single();

    if (error) {
      console.error('Error creating client profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createClientProfile:', error);
    return null;
  }
};

/**
 * Updates a client's profile
 * @param userId The user's ID
 * @param profileData The profile data to update
 * @returns Promise resolving to the updated profile or null on failure
 */
export const updateClientProfile = async (
  userId: string,
  profileData: Partial<ClientProfile>
): Promise<ClientProfile | null> => {
  try {
    // Ensure dates are converted to strings before sending to Supabase
    const processedData = { ...profileData };
    
    // Check for birthday property and if it's a Date object
    if (profileData.birthday && profileData.birthday !== null && typeof profileData.birthday === 'object' && 
        'toISOString' in profileData.birthday) {
      processedData.birthday = (profileData.birthday as unknown as Date).toISOString();
    }
    
    // Check for event_date property and if it's a Date object
    if (profileData.event_date && profileData.event_date !== null && typeof profileData.event_date === 'object' && 
        'toISOString' in profileData.event_date) {
      processedData.event_date = (profileData.event_date as unknown as Date).toISOString();
    }
    
    const { data, error } = await supabase
      .from('client_profiles')
      .update(processedData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating client profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateClientProfile:', error);
    return null;
  }
};

/**
 * Fetches all client profiles
 * @returns Promise resolving to an array of client profiles or empty array on failure
 */
export const fetchAllClientProfiles = async (): Promise<ClientProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*');

    if (error) {
      console.error('Error fetching all client profiles:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchAllClientProfiles:', error);
    return [];
  }
};

/**
 * Uploads a client's avatar
 * @param userId The user's ID
 * @param file The file to upload
 * @returns Promise resolving to the avatar URL or null on failure
 */
export const uploadClientAvatar = async (userId: string, file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-avatar.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('user-content')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('user-content').getPublicUrl(filePath);
    
    // Update profile with avatar URL
    await updateClientProfile(userId, { avatar_url: data.publicUrl });
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadClientAvatar:', error);
    return null;
  }
};

/**
 * Fetches personal records for a user
 * @param userId The user's ID
 * @returns Promise resolving to array of personal records
 */
export const fetchPersonalRecords = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('personal_records')
      .select('*, exercise:exercise_id(*)')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching personal records:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchPersonalRecords:', error);
    return [];
  }
};

/**
 * Tracks a workout set completion
 * @param workoutId The workout ID
 * @param exerciseId The exercise ID
 * @param setData The set completion data
 * @returns Promise resolving to the created set completion or null on failure
 */
export const trackWorkoutSet = async (
  workoutId: string, 
  exerciseId: string, 
  setData: any
) => {
  try {
    const data = {
      ...setData,
      workout_exercise_id: exerciseId,
      user_id: supabase.auth.getUser().then(res => res.data.user?.id)
    };
    
    const { data: result, error } = await supabase
      .from('workout_set_completions')
      .insert([data])
      .select();

    if (error) {
      console.error('Error tracking workout set:', error);
      return null;
    }

    return result?.[0] || null;
  } catch (error) {
    console.error('Error in trackWorkoutSet:', error);
    return null;
  }
};

/**
 * Completes a workout
 * @param workoutData The workout data
 * @returns Promise resolving to the completed workout or null on failure
 */
export const completeWorkout = async (workoutData: any) => {
  try {
    const { data, error } = await supabase
      .from('workout_completions')
      .insert([workoutData])
      .select();

    if (error) {
      console.error('Error completing workout:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error in completeWorkout:', error);
    return null;
  }
};

/**
 * Deletes a user
 * @param userId The user's ID
 * @returns Promise resolving to success boolean
 */
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.functions.invoke('delete-user', {
      body: { user_id: userId }
    });

    if (error) {
      console.error('Error deleting user:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteUser:', error);
    return false;
  }
};

/**
 * Sends a password reset email
 * @param email The user's email
 * @returns Promise resolving to success boolean
 */
export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in sendPasswordResetEmail:', error);
    return false;
  }
};
