
import { supabase } from "@/integrations/supabase/client";

// Define ClientProfile as an exported interface instead of importing it
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
  event_type: string | null;
  event_date: string | null;
  event_name: string | null;
  profile_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

// Define PersonalRecord interface
export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  weight: number;
  reps?: number;
  achieved_at: string;
  workout_completion_id?: string;
}

/**
 * Fetches a client profile by user ID
 */
export const fetchClientProfile = async (userId: string): Promise<ClientProfile | null> => {
  try {
    const result = await supabase
      .from('client_profiles')
      .select('id, first_name, last_name, city, state, birthday, height, weight, avatar_url, fitness_goals, favorite_movements, event_type, event_date, event_name, profile_completed, created_at, updated_at')
      .eq('user_id', userId)
      .single();

    const data = result.data as ClientProfile | null;
    const error = result.error;

    if (error) {
      console.error('Error fetching client profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching client profile:', error);
    return null;
  }
};

/**
 * Creates a new client profile for a user
 */
export const createClientProfile = async (userId: string): Promise<ClientProfile | null> => {
  try {
    const { data: existingProfile } = await supabase
      .from('client_profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfile) {
      console.log('Profile already exists for user:', userId);
      return fetchClientProfile(userId);
    }

    const profileData = {
      id: userId,
      profile_completed: false,
    };

    const { data, error } = await supabase
      .from('client_profiles')
      .insert([profileData])
      .select('*')
      .single();

    if (error) {
      console.error('Error creating client profile:', error);
      return null;
    }

    console.log('New client profile created:', data);
    return data as ClientProfile;
  } catch (error) {
    console.error('Error creating client profile:', error);
    return null;
  }
};

/**
 * Updates a client profile
 */
export const updateClientProfile = async (userId: string, updates: Partial<ClientProfile>): Promise<ClientProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating client profile:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error updating client profile:', error);
    return null;
  }
};

/**
 * Uploads a client avatar image
 */
export const uploadClientAvatar = async (userId: string, file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-avatar.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const avatarUrl = data.publicUrl;

    await updateClientProfile(userId, { avatar_url: avatarUrl });

    return avatarUrl;
  } catch (error) {
    console.error('Error in uploadClientAvatar:', error);
    throw error;
  }
};

/**
 * Saves workout journal notes for a specific workout completion
 */
export const saveWorkoutJournalNotes = async (workoutCompletionId: string, notes: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_completions')
      .update({ notes: notes })
      .eq('id', workoutCompletionId);

    if (error) {
      console.error('Error saving workout journal notes:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error saving workout journal notes:', error);
    return false;
  }
};

/**
 * Fetches personal records for a specific user
 */
export const fetchPersonalRecords = async (userId: string): Promise<PersonalRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching personal records:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching personal records:', error);
    return [];
  }
};

/**
 * Updates the completion date of a workout
 */
export const updateWorkoutCompletionDate = async (workoutId: string, newDate: Date): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_completions')
      .update({ completed_at: newDate.toISOString() })
      .eq('id', workoutId);

    if (error) {
      console.error('Error updating workout date:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating workout date:', error);
    return false;
  }
};

/**
 * Fetch all client profiles (for admin use)
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

    return data as ClientProfile[];
  } catch (error) {
    console.error('Error in fetchAllClientProfiles:', error);
    return [];
  }
};

/**
 * Track workout set
 */
export const trackWorkoutSet = async (
  workoutId: string,
  exerciseId: string,
  setData: {
    set_number: number,
    weight?: number,
    reps_completed?: number,
    completed?: boolean,
    distance?: string,
    duration?: string,
    location?: string
  }
) => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      console.error('No authenticated user found');
      return false;
    }

    const { error } = await supabase
      .from('workout_set_completions')
      .insert({
        user_id: userId,
        workout_completion_id: workoutId,
        workout_exercise_id: exerciseId,
        set_number: setData.set_number,
        weight: setData.weight,
        reps_completed: setData.reps_completed,
        completed: setData.completed || false,
        distance: setData.distance,
        duration: setData.duration,
        location: setData.location
      });

    if (error) {
      console.error('Error tracking workout set:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error tracking workout set:', error);
    return false;
  }
};

/**
 * Complete a workout
 */
export const completeWorkout = async (
  workoutId: string,
  userId: string,
  notes?: string,
  rating?: number
) => {
  try {
    const { error } = await supabase
      .from('workout_completions')
      .update({
        completed_at: new Date().toISOString(),
        notes: notes,
        rating: rating
      })
      .eq('id', workoutId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error completing workout:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error completing workout:', error);
    return false;
  }
};

/**
 * Delete a user account (admin only)
 */
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('admin_delete_user', { user_id: userId });

    if (error) {
      console.error('Error deleting user:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
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
      console.error('Error sending password reset email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};
