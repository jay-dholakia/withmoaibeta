
import { Profile, ClientProfile } from '@/types/user';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const createClientProfile = async (userId: string): Promise<ClientProfile | null> => {
  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (existingProfile) {
    return {
      ...existingProfile,
      user_type: 'client',
      vacation_mode: existingProfile.vacation_mode ?? false // Ensure vacation_mode is always set
    };
  }

  // Create new profile with default vacation_mode
  const { data, error } = await supabase
    .from('client_profiles')
    .insert({ 
      id: userId, 
      vacation_mode: false // Explicitly set default to false
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating client profile:', error);
    return null;
  }

  return {
    ...data,
    user_type: 'client',
    vacation_mode: false
  };
};

// Add missing functions that are referenced in other files
export const fetchClientProfile = async (userId: string): Promise<ClientProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return {
      ...data,
      user_type: 'client',
      vacation_mode: data.vacation_mode ?? false
    };
  } catch (error) {
    console.error('Error fetching client profile:', error);
    return null;
  }
};

export const updateClientProfile = async (userId: string, updates: Partial<ClientProfile>): Promise<ClientProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      user_type: 'client'
    };
  } catch (error) {
    console.error('Error updating client profile:', error);
    return null;
  }
};

export const uploadClientAvatar = async (userId: string, file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-avatar.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('user_content')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('user_content').getPublicUrl(filePath);
    
    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('client_profiles')
      .update({ avatar_url: data.publicUrl })
      .eq('id', userId);

    if (updateError) throw updateError;

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return null;
  }
};

export const fetchAllClientProfiles = async (): Promise<ClientProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*');

    if (error) throw error;

    return data.map(profile => ({
      ...profile,
      user_type: 'client',
      vacation_mode: profile.vacation_mode ?? false
    }));
  } catch (error) {
    console.error('Error fetching all client profiles:', error);
    return [];
  }
};

export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.functions.invoke('delete-user', {
      body: { userId }
    });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
};

export const fetchPersonalRecords = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('personal_records')
      .select(`
        *,
        exercise:exercise_id (
          id,
          name,
          exercise_type
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching personal records:', error);
    return [];
  }
};

export const trackWorkoutSet = async (
  exerciseId: string, 
  workoutCompletionId: string, 
  setNumber: number,
  setData: {
    weight?: number | null;
    reps_completed?: number | null;
    notes?: string | null;
    distance?: string | null;
    duration?: string | null;
    location?: string | null;
    completed: boolean;
  }
) => {
  try {
    const userData = await supabase.auth.getUser();
    const userId = userData.data.user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('workout_set_completions')
      .upsert({
        workout_exercise_id: exerciseId,
        workout_completion_id: workoutCompletionId,
        set_number: setNumber,
        weight: setData.weight || null,
        reps_completed: setData.reps_completed || null,
        notes: setData.notes || null,
        distance: setData.distance || null,
        duration: setData.duration || null,
        location: setData.location || null,
        completed: setData.completed,
        user_id: userId
      })
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error tracking workout set:', error);
    throw error;
  }
};

export const completeWorkout = async (
  workoutCompletionId: string,
  data: {
    rating?: number;
    notes?: string;
  }
) => {
  try {
    const { error } = await supabase
      .from('workout_completions')
      .update({
        rating: data.rating,
        notes: data.notes,
        completed_at: new Date().toISOString()
      })
      .eq('id', workoutCompletionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error completing workout:', error);
    return false;
  }
};
