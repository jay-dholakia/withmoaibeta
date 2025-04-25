
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/user';

// Define a ClientProfile interface that extends Profile
export interface ClientProfile extends Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  state?: string;
  birthday?: string;
  height?: string;
  weight?: string;
  avatar_url?: string;
  fitness_goals?: string[];
  favorite_movements?: string[];
  event_type?: string;
  event_date?: string;
  event_name?: string;
  profile_completed?: boolean;
  vacation_mode?: boolean;
}

export const fetchClientProfile = async (userId: string): Promise<ClientProfile | null> => {
  const { data, error } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching client profile:', error);
    return null;
  }

  return {
    ...data,
    user_type: 'client', // Adding the required user_type property
  };
};

// Add missing functions referenced in components
export const fetchAllClientProfiles = async (): Promise<ClientProfile[]> => {
  const { data, error } = await supabase
    .from('client_profiles')
    .select('*');

  if (error) {
    console.error('Error fetching all client profiles:', error);
    return [];
  }

  return data.map(profile => ({
    ...profile,
    user_type: 'client',
  }));
};

export const updateClientProfile = async (userId: string, profileData: Partial<ClientProfile>): Promise<ClientProfile> => {
  const { data, error } = await supabase
    .from('client_profiles')
    .update(profileData)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating client profile:', error);
    throw error;
  }

  return {
    ...data,
    user_type: 'client',
  };
};

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
    };
  }

  // Create new profile
  const { data, error } = await supabase
    .from('client_profiles')
    .insert({ id: userId })
    .select()
    .single();

  if (error) {
    console.error('Error creating client profile:', error);
    return null;
  }

  return {
    ...data,
    user_type: 'client',
  };
};

export const uploadClientAvatar = async (userId: string, file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('profile-images')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading avatar:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('profile-images')
    .getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from('client_profiles')
    .update({ avatar_url: data.publicUrl })
    .eq('id', userId);

  if (updateError) {
    console.error('Error updating profile with avatar URL:', updateError);
    throw updateError;
  }

  return data.publicUrl;
};

// Fix the trackWorkoutSet function to accept all required parameters
export const trackWorkoutSet = async (
  exerciseId: string,
  workoutCompletionId: string, 
  setNumber: number, 
  data: any
) => {
  const response = await supabase
    .from('workout_set_completions')
    .insert({
      workout_exercise_id: exerciseId,
      workout_completion_id: workoutCompletionId,
      set_number: setNumber,
      ...data
    });
  
  return response;
};

export const completeWorkout = async (workoutId: string, data: any) => {
  // Implementation for completing a workout
  const response = await supabase
    .from('workout_completions')
    .update(data)
    .eq('id', workoutId);
  
  return response;
};

export const fetchPersonalRecords = async (userId: string) => {
  const { data, error } = await supabase
    .from('personal_records')
    .select('*,exercise:exercise_id(*)')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching personal records:', error);
    return [];
  }

  return data;
};

export const deleteUser = async (userId: string) => {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (error) {
    console.error('Error deleting user:', error);
    throw error;
  }

  return { success: true };
};

export const sendPasswordResetEmail = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  
  if (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
  
  return { success: true };
};
