
import { supabase } from '@/integrations/supabase/client';
import { CustomWorkoutExercise, CreateCustomWorkoutExerciseParams } from './types';

/**
 * Fetch all exercises for a custom workout
 */
export const fetchCustomWorkoutExercises = async (workoutId: string): Promise<CustomWorkoutExercise[]> => {
  const { data, error } = await supabase
    .from('client_custom_workout_exercises')
    .select(`
      *,
      exercise:exercise_id (*)
    `)
    .eq('workout_id', workoutId)
    .order('order_index');

  if (error) {
    console.error('Error fetching custom workout exercises:', error);
    throw error;
  }

  return data as CustomWorkoutExercise[];
};

/**
 * Create a new exercise for a custom workout
 */
export const createCustomWorkoutExercise = async (params: CreateCustomWorkoutExerciseParams): Promise<CustomWorkoutExercise> => {
  // Get the current count of exercises to set the order_index
  const { data: existingExercises } = await supabase
    .from('client_custom_workout_exercises')
    .select('id')
    .eq('workout_id', params.workout_id);

  const orderIndex = params.order_index !== undefined ? params.order_index : (existingExercises?.length || 0);

  const { data: exercise, error } = await supabase
    .from('client_custom_workout_exercises')
    .insert({
      workout_id: params.workout_id,
      exercise_id: params.exercise_id || null,
      custom_exercise_name: params.custom_exercise_name || null,
      sets: params.sets || null,
      reps: params.reps || null,
      rest_seconds: params.rest_seconds || null,
      notes: params.notes || null,
      order_index: orderIndex
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error adding custom workout exercise:', error);
    throw error;
  }

  return exercise as CustomWorkoutExercise;
};

/**
 * Update an existing custom workout exercise
 */
export const updateCustomWorkoutExercise = async (
  exerciseId: string,
  data: {
    exercise_id?: string | null;
    custom_exercise_name?: string | null;
    sets?: number | null;
    reps?: string | null;
    rest_seconds?: number | null;
    notes?: string | null;
    order_index?: number;
  }
): Promise<CustomWorkoutExercise> => {
  const { data: exercise, error } = await supabase
    .from('client_custom_workout_exercises')
    .update(data)
    .eq('id', exerciseId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating custom workout exercise:', error);
    throw error;
  }

  return exercise as CustomWorkoutExercise;
};

/**
 * Delete a custom workout exercise
 */
export const deleteCustomWorkoutExercise = async (exerciseId: string): Promise<void> => {
  const { error } = await supabase
    .from('client_custom_workout_exercises')
    .delete()
    .eq('id', exerciseId);

  if (error) {
    console.error('Error deleting custom workout exercise:', error);
    throw error;
  }
};
