
import { supabase } from '@/integrations/supabase/client';
import { PersonalRecord } from '@/types/workout';

// Define the ClientProfile type that's used across the application
export interface ClientProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  state?: string;
  birthday?: string;
  height?: string;
  weight?: string;
  favorite_movements?: string[];
  fitness_goals?: string[];
  event_type?: string;
  event_date?: string;
  event_name?: string;
  avatar_url?: string;
  profile_completed?: boolean;
}

// Fetch personal records function that was already implemented
export const fetchPersonalRecords = async (userId: string): Promise<PersonalRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('personal_records')
      .select(`
        id, 
        user_id,
        exercise_id,
        weight,
        reps,
        achieved_at,
        workout_completion_id,
        exercises (name)
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching personal records:', error);
      return [];
    }

    // Transform the data to include the exercise name if available
    return (data || []).map(record => ({
      ...record,
      exercise_name: record.exercises?.name
    })) as PersonalRecord[];
  } catch (error) {
    console.error('Error in fetchPersonalRecords:', error);
    return [];
  }
};

// Function to save workout journal notes
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

// Implement other missing functions

// Fetch client profile
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

    return data as ClientProfile;
  } catch (error) {
    console.error('Error in fetchClientProfile:', error);
    return null;
  }
};

// Update client profile
export const updateClientProfile = async (userId: string, profileData: Partial<ClientProfile>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('client_profiles')
      .update(profileData)
      .eq('id', userId);

    if (error) {
      console.error('Error updating client profile:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateClientProfile:', error);
    return false;
  }
};

// Create client profile
export const createClientProfile = async (userId: string, profileData: Partial<ClientProfile> = {}): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('client_profiles')
      .insert([{ id: userId, ...profileData }]);

    if (error) {
      console.error('Error creating client profile:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in createClientProfile:', error);
    return false;
  }
};

// Upload client avatar
export const uploadClientAvatar = async (userId: string, file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('client-avatars')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      throw new Error('Failed to upload avatar');
    }

    const { data } = supabase.storage
      .from('client-avatars')
      .getPublicUrl(filePath);

    if (!data.publicUrl) {
      throw new Error('Failed to get public URL for avatar');
    }

    // Update the client profile with the new avatar URL
    await updateClientProfile(userId, { avatar_url: data.publicUrl });

    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadClientAvatar:', error);
    throw error;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error('Error sending reset password email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in sendPasswordResetEmail:', error);
    return false;
  }
};

// Delete user (admin function)
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    // First delete from auth.users through RPC (requires proper RLS policies)
    const { error } = await supabase.rpc('delete_user', {
      target_user_id: userId
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

// Track workout set function
export const trackWorkoutSet = async (
  workoutCompletionId: string, 
  exerciseId: string, 
  setData: {
    set_number: number;
    weight?: number;
    reps_completed?: number;
    completed: boolean;
  }
): Promise<boolean> => {
  try {
    // Get the user ID from the session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      console.error('No authenticated user found');
      return false;
    }

    // Check if the set already exists for this workout and exercise
    const { data: existingSets, error: fetchError } = await supabase
      .from('workout_set_completions')
      .select('id')
      .eq('workout_completion_id', workoutCompletionId)
      .eq('workout_exercise_id', exerciseId)
      .eq('set_number', setData.set_number);

    if (fetchError) {
      console.error('Error checking existing sets:', fetchError);
      return false;
    }

    if (existingSets && existingSets.length > 0) {
      // Update existing set
      const { error } = await supabase
        .from('workout_set_completions')
        .update({
          weight: setData.weight,
          reps_completed: setData.reps_completed,
          completed: setData.completed
        })
        .eq('id', existingSets[0].id);

      if (error) {
        console.error('Error updating workout set:', error);
        return false;
      }
    } else {
      // Create new set
      const { error } = await supabase
        .from('workout_set_completions')
        .insert([{
          workout_completion_id: workoutCompletionId,
          workout_exercise_id: exerciseId,
          user_id: userId,
          set_number: setData.set_number,
          weight: setData.weight,
          reps_completed: setData.reps_completed,
          completed: setData.completed
        }]);

      if (error) {
        console.error('Error creating workout set:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in trackWorkoutSet:', error);
    return false;
  }
};

// Complete workout function
export const completeWorkout = async (
  workoutId: string, 
  data: {
    rating?: number;
    notes?: string;
  } = {}
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_completions')
      .update({
        ...data,
      })
      .eq('id', workoutId);

    if (error) {
      console.error('Error completing workout:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in completeWorkout:', error);
    return false;
  }
};

// Fetch all client profiles (admin function)
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
