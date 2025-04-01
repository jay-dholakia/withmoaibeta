
import { supabase } from '@/integrations/supabase/client';
import { Session, AuthError } from '@supabase/supabase-js';

/**
 * Get the current authenticated user
 */
export const getUser = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session:", error);
      return null;
    }
    
    const session = data.session;
    return session ? session.user : null;
  } catch (error) {
    console.error("Error in getUser:", error);
    return null;
  }
};

// Client Profile Interface
export interface ClientProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  state?: string;
  birthday?: string | null;
  height?: string;
  weight?: string;
  avatar_url?: string;
  fitness_goals?: string[];
  favorite_movements?: string[];
  profile_completed?: boolean;
  created_at?: string;
  updated_at?: string;
  event_name?: string;
  event_date?: string;
  event_type?: string;
}

// Coach Profile Interface
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
 * Fetch client profile
 */
export const fetchClientProfile = async (userId: string): Promise<ClientProfile> => {
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
 * Create client profile
 */
export const createClientProfile = async (userId: string): Promise<ClientProfile | null> => {
  try {
    // Check if profile already exists
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
      console.log("Profile already exists:", existingProfile);
      return existingProfile;
    }
    
    console.log("Creating new client profile for user:", userId);
    
    // Create new profile if it doesn't exist
    const { data, error } = await supabase
      .from('client_profiles')
      .insert({ 
        id: userId,
        fitness_goals: [],
        favorite_movements: [],
        profile_completed: false 
      })
      .select()
      .single();
      
    if (error) {
      console.error("Error creating client profile:", error);
      throw error;
    }
    
    console.log("Created new profile:", data);
    return data;
  } catch (error) {
    console.error("Error in createClientProfile:", error);
    throw error;
  }
};

/**
 * Update client profile
 */
export const updateClientProfile = async (userId: string, profileData: Partial<ClientProfile>): Promise<ClientProfile> => {
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
 * Upload client avatar
 */
export const uploadClientAvatar = async (userId: string, file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('lovable-uploads')
      .upload(filePath, file);
      
    if (uploadError) {
      console.error("Error uploading avatar:", uploadError);
      throw uploadError;
    }
    
    const { data } = supabase.storage
      .from('lovable-uploads')
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  } catch (error) {
    console.error("Error in uploadClientAvatar:", error);
    throw error;
  }
};

/**
 * Fetch coach profile
 */
export const fetchCoachProfile = async (coachId: string): Promise<CoachProfile> => {
  try {
    const { data, error } = await supabase
      .from('coach_profiles')
      .select('*')
      .eq('id', coachId)
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
 * Update coach profile
 */
export const updateCoachProfile = async (coachId: string, profileData: Partial<CoachProfile>): Promise<CoachProfile> => {
  try {
    const { data, error } = await supabase
      .from('coach_profiles')
      .update(profileData)
      .eq('id', coachId)
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
 * Upload coach avatar
 */
export const uploadCoachAvatar = async (coachId: string, file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${coachId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('lovable-uploads')
      .upload(filePath, file);
      
    if (uploadError) {
      console.error("Error uploading avatar:", uploadError);
      throw uploadError;
    }
    
    const { data } = supabase.storage
      .from('lovable-uploads')
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  } catch (error) {
    console.error("Error in uploadCoachAvatar:", error);
    throw error;
  }
};

/**
 * Fetch personal records
 */
export const fetchPersonalRecords = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('personal_records')
      .select(`
        *,
        exercise:exercise_id (*)
      `)
      .eq('user_id', userId);
      
    if (error) {
      console.error("Error fetching personal records:", error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in fetchPersonalRecords:", error);
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
 * Delete user
 */
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('admin_delete_user', { user_id: userId });
    
    if (error) {
      console.error("Error deleting user:", error);
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
export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      console.error("Error sending password reset email:", error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error in sendPasswordResetEmail:", error);
    throw error;
  }
};

/**
 * Track workout set
 */
export const trackWorkoutSet = async (
  workoutExerciseId: string,
  workoutCompletionId: string,
  setNumber: number,
  data: {
    weight?: number | null;
    reps_completed?: number | null;
    completed?: boolean;
    notes?: string | null;
    distance?: string | null;
    duration?: string | null;
    location?: string | null;
  }
) => {
  try {
    const user = await getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const { data: existingSet, error: fetchError } = await supabase
      .from('workout_set_completions')
      .select('*')
      .eq('workout_exercise_id', workoutExerciseId)
      .eq('workout_completion_id', workoutCompletionId)
      .eq('set_number', setNumber)
      .maybeSingle();
      
    if (fetchError) {
      console.error("Error checking existing set:", fetchError);
      throw fetchError;
    }
    
    if (existingSet) {
      // Update existing set
      const { data: updatedSet, error: updateError } = await supabase
        .from('workout_set_completions')
        .update({
          ...data,
          user_id: user.id
        })
        .eq('id', existingSet.id)
        .select()
        .single();
        
      if (updateError) {
        console.error("Error updating workout set:", updateError);
        throw updateError;
      }
      
      return updatedSet;
    } else {
      // Create new set
      const { data: newSet, error: insertError } = await supabase
        .from('workout_set_completions')
        .insert({
          workout_exercise_id: workoutExerciseId,
          workout_completion_id: workoutCompletionId,
          set_number: setNumber,
          user_id: user.id,
          ...data
        })
        .select()
        .single();
        
      if (insertError) {
        console.error("Error creating workout set:", insertError);
        throw insertError;
      }
      
      return newSet;
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
): Promise<any> => {
  try {
    const { data: existingCompletion, error: fetchError } = await supabase
      .from('workout_completions')
      .select('*')
      .eq('id', workoutId)
      .maybeSingle();
      
    if (fetchError) {
      console.error("Error checking workout completion:", fetchError);
    }
    
    const user = await getUser();
    const userId = user?.id;
    
    if (!userId) {
      throw new Error("User not authenticated");
    }
    
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
      const { data, error } = await supabase
        .from('workout_completions')
        .insert({
          workout_id: workoutId,
          user_id: userId,
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
