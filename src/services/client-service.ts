
import { supabase } from "@/integrations/supabase/client";

/**
 * Saves journal notes for a workout completion
 * @param workoutCompletionId ID of the workout completion
 * @param notes Notes to save
 * @returns Promise resolving to a boolean indicating success/failure
 */
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
