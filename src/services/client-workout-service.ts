import { supabase } from '@/integrations/supabase/client';

/** Save or update notes for a workout journal entry */
export const saveWorkoutJournalNotes = async (
  workoutCompletionId: string,
  notes: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_completions')
      .update({ notes })
      .eq('id', workoutCompletionId);
    if (error) {
      console.error('Error saving workout journal notes:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error in saveWorkoutJournalNotes:', error);
    return false;
  }
};

/** Track a workout set completion for an exercise */
export const trackWorkoutSet = async (
  workoutId: string,
  exerciseId: string,
  setData: any
): Promise<any | null> => {
  try {
    const data = {
      ...setData,
      workout_exercise_id: exerciseId,
      user_id: (await supabase.auth.getUser()).data.user?.id
    };
    const { data: result, error } = await supabase
      .from('workout_set_completions')
      .insert([data])
      .select();
    if (error) {
      console.error('Error tracking workout set:', error);
      return null;
    }
    return result?.[0] || null;
  } catch (error) {
    console.error('Error in trackWorkoutSet:', error);
    return null;
  }
};

/** Complete a workout session */
export const completeWorkout = async (workoutData: any): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from('workout_completions')
      .insert([workoutData])
      .select();
    if (error) {
      console.error('Error completing workout:', error);
      return null;
    }
    return data?.[0] || null;
  } catch (error) {
    console.error('Error in completeWorkout:', error);
    return null;
  }
};
