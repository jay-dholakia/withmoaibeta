
import { supabase } from '@/integrations/supabase/client';
import { Exercise } from '@/types/workout';

/**
 * Fetch exercises by muscle group
 */
export const fetchExercisesByMuscleGroup = async (muscleGroup: string): Promise<Exercise[]> => {
  const { data, error } = await supabase
    .rpc('get_exercises_by_muscle_group', { muscle_group_param: muscleGroup });

  if (error) {
    console.error('Error fetching exercises by muscle group:', error);
    throw error;
  }

  return data as Exercise[];
};

/**
 * Get all available muscle groups
 */
export const fetchMuscleGroups = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('exercises')
    .select('muscle_group')
    .not('muscle_group', 'is', null)
    .order('muscle_group');

  if (error) {
    console.error('Error fetching muscle groups:', error);
    throw error;
  }

  // Remove duplicates and null values
  return [...new Set(data.map(e => e.muscle_group).filter(Boolean))];
};

/**
 * Get similar exercises by muscle group
 */
export const fetchSimilarExercises = async (exerciseId: string): Promise<Exercise[]> => {
  // First get the original exercise's muscle group
  const { data: originalExercise, error: originalError } = await supabase
    .from('exercises')
    .select('muscle_group')
    .eq('id', exerciseId)
    .single();

  if (originalError) {
    console.error('Error fetching original exercise:', originalError);
    throw originalError;
  }

  if (!originalExercise?.muscle_group) {
    return [];
  }

  // Then fetch all exercises with the same muscle group, excluding the original exercise
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('muscle_group', originalExercise.muscle_group)
    .neq('id', exerciseId)
    .order('name');

  if (error) {
    console.error('Error fetching similar exercises:', error);
    throw error;
  }

  return data || [];
};

