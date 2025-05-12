
import { supabase } from '@/integrations/supabase/client';
import { WorkoutWeek } from '@/types/workout';

/**
 * Fetches workout weeks for a program
 */
export const fetchWorkoutWeeks = async (programId: string) => {
  try {
    const { data, error } = await supabase
      .from('workout_weeks')
      .select('*')
      .eq('program_id', programId)
      .order('week_number', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout weeks:', error);
    throw error;
  }
};

/**
 * Fetches a specific workout week
 */
export const fetchWorkoutWeek = async (weekId: string) => {
  try {
    const { data, error } = await supabase
      .from('workout_weeks')
      .select('*')
      .eq('id', weekId)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching workout week:', error);
    throw error;
  }
};

/**
 * Creates a workout week
 */
export const createWorkoutWeek = async (weekData: {
  program_id: string;
  week_number: number;
  title: string;
  description?: string | null;
}) => {
  try {
    const { data, error } = await supabase
      .from('workout_weeks')
      .insert([weekData])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating workout week:', error);
    throw error;
  }
};

/**
 * Updates a workout week
 */
export const updateWorkoutWeek = async (weekId: string, weekData: {
  title?: string;
  description?: string | null;
  target_miles_run?: number;
  target_cardio_minutes?: number;
  target_strength_workouts?: number;
  target_strength_mobility_workouts?: number;
}) => {
  try {
    const { data, error } = await supabase
      .from('workout_weeks')
      .update(weekData)
      .eq('id', weekId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating workout week:', error);
    throw error;
  }
};
