import { supabase } from "@/integrations/supabase/client";
import { ClientProfile } from "@/types/profile";
import { PersonalRecord } from "@/types/workout";

/**
 * Fetches a client profile by user ID
 */
export const fetchClientProfile = async (userId: string): Promise<ClientProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching client profile:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error fetching client profile:', error);
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
 * @param workoutId The ID of the workout completion
 * @param newDate The new date for the workout
 * @returns boolean indicating success
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
