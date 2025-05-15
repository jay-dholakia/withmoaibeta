
import { supabase } from '@/integrations/supabase/client';
import { CustomWorkout } from './types';

/**
 * Fetch all custom workouts for the current user
 */
export const fetchCustomWorkouts = async (): Promise<CustomWorkout[]> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from('client_custom_workouts')
    .select('*')
    .eq('user_id', user.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching custom workouts:', error);
    throw error;
  }

  return data as CustomWorkout[];
};

/**
 * Fetch a single custom workout by ID
 */
export const fetchCustomWorkout = async (workoutId: string): Promise<CustomWorkout | null> => {
  const { data, error } = await supabase
    .from('client_custom_workouts')
    .select('*')
    .eq('id', workoutId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching custom workout:', error);
    throw error;
  }

  return data as CustomWorkout;
};

/**
 * Create a new custom workout
 */
export const createCustomWorkout = async (data: {
  title: string;
  description?: string | null;
  duration_minutes?: number | null;
  workout_type?: string;
}): Promise<CustomWorkout> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data: workout, error } = await supabase
    .from('client_custom_workouts')
    .insert({
      user_id: user.user.id,
      title: data.title,
      description: data.description || null,
      duration_minutes: data.duration_minutes || null,
      workout_type: data.workout_type || 'custom'
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating custom workout:', error);
    throw error;
  }

  return workout as CustomWorkout;
};

/**
 * Update an existing custom workout
 */
export const updateCustomWorkout = async (
  workoutId: string,
  data: {
    title?: string;
    description?: string | null;
    duration_minutes?: number | null;
    workout_type?: string;
  }
): Promise<CustomWorkout> => {
  const { data: workout, error } = await supabase
    .from('client_custom_workouts')
    .update(data)
    .eq('id', workoutId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating custom workout:', error);
    throw error;
  }

  return workout as CustomWorkout;
};

/**
 * Delete a custom workout
 */
export const deleteCustomWorkout = async (workoutId: string): Promise<void> => {
  const { error } = await supabase
    .from('client_custom_workouts')
    .delete()
    .eq('id', workoutId);

  if (error) {
    console.error('Error deleting custom workout:', error);
    throw error;
  }
};
