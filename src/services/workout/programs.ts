
import { supabase } from '@/integrations/supabase/client';
import { WorkoutProgram } from '@/types/workout';

/**
 * Fetches workout programs
 */
export const fetchWorkoutPrograms = async (coachId?: string, fetchAllPrograms: boolean = false) => {
  try {
    let query = supabase
      .from('workout_programs')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Only filter by coach ID if fetchAllPrograms is false
    if (coachId && !fetchAllPrograms) {
      query = query.eq('coach_id', coachId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout programs:', error);
    throw error;
  }
};

/**
 * Fetches a specific workout program
 */
export const fetchWorkoutProgram = async (programId: string) => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('id', programId)
      .maybeSingle();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching workout program:', error);
    throw error;
  }
};

/**
 * Creates a workout program
 */
export const createWorkoutProgram = async (programData: {
  title: string;
  description?: string | null;
  coach_id: string;
  program_type: string;
  weeks: number;
}) => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .insert([programData])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating workout program:', error);
    throw error;
  }
};

/**
 * Updates a workout program
 */
export const updateWorkoutProgram = async (programId: string, programData: {
  title?: string;
  description?: string | null;
  program_type?: string;
  weeks?: number;
}) => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .update(programData)
      .eq('id', programId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating workout program:', error);
    throw error;
  }
};

/**
 * Deletes a workout program
 */
export const deleteWorkoutProgram = async (programId: string) => {
  try {
    const { error } = await supabase
      .from('workout_programs')
      .delete()
      .eq('id', programId);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting workout program:', error);
    throw error;
  }
};
