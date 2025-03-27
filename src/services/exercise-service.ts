
import { supabase } from "@/integrations/supabase/client";
import { Exercise } from "@/types/workout";

export const fetchExercises = async (): Promise<Exercise[]> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching exercises:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Unexpected error in fetchExercises:', error);
    return [];
  }
};

export const fetchExercisesByCategory = async (): Promise<Record<string, Exercise[]>> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching exercises:', error);
      return {};
    }
    
    // Group exercises by category
    const exercisesByCategory: Record<string, Exercise[]> = {};
    
    (data || []).forEach(exercise => {
      if (!exercisesByCategory[exercise.category]) {
        exercisesByCategory[exercise.category] = [];
      }
      exercisesByCategory[exercise.category].push(exercise);
    });
    
    return exercisesByCategory;
  } catch (error) {
    console.error('Unexpected error in fetchExercisesByCategory:', error);
    return {};
  }
};
