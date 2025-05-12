
import { supabase } from '@/integrations/supabase/client';
import { Exercise } from '@/types/workout';

/**
 * Creates a new exercise
 */
export const createExercise = async (exerciseData: {
  name: string;
  category: string;
  description?: string;
  exercise_type: string;
  youtube_link?: string;
  muscle_group?: string;
}): Promise<{ success: boolean; data?: any; error?: any }> => {
  try {
    // Check if exercise with same name already exists
    const { data: existingExercise, error: checkError } = await supabase
      .from('exercises')
      .select('*')
      .ilike('name', exerciseData.name)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking for existing exercise:', checkError);
      return { success: false, error: checkError };
    }
    
    // If exercise with same name exists, return it
    if (existingExercise) {
      return { 
        success: true, 
        data: existingExercise,
        error: null
      };
    }
    
    // If exercise doesn't exist, create it
    const { data, error } = await supabase
      .from('exercises')
      .insert([exerciseData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating exercise:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error in createExercise:', error);
    return { success: false, error };
  }
};
