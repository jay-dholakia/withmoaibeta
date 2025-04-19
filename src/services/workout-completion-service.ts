
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch workout completion details
 */
export const fetchWorkoutCompletion = async (completionId: string) => {
  const { data, error } = await supabase
    .from('workout_completions')
    .select(`
      *,
      workout:workout_id (
        id,
        title,
        description
      )
    `)
    .eq('id', completionId)
    .single();

  if (error) {
    console.error('Error fetching workout completion:', error);
    throw error;
  }

  return data;
};

/**
 * Update workout completion progress - we use a field in the component but track in metadata
 */
export const updateWorkoutCompletion = async (completionId: string, updates: { progress: number }) => {
  // Since the workout_completions table doesn't have a progress field,
  // we'll update the notes field to include progress information
  const { error } = await supabase
    .from('workout_completions')
    .update({
      notes: `Progress: ${updates.progress.toFixed(0)}%`
    })
    .eq('id', completionId);

  if (error) {
    console.error('Error updating workout completion:', error);
    throw error;
  }

  return true;
};

/**
 * Mark workout as complete
 */
export const completeWorkoutCompletion = async (completionId: string) => {
  const { error } = await supabase
    .from('workout_completions')
    .update({
      completed_at: new Date().toISOString(),
      notes: 'Completed 100%'
    })
    .eq('id', completionId);

  if (error) {
    console.error('Error completing workout:', error);
    throw error;
  }

  return true;
};
