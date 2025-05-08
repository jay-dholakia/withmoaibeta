
import { supabase } from '@/integrations/supabase/client';
import { PersonalRecord } from '@/types/workout';

export const fetchPersonalRecords = async (userId: string): Promise<PersonalRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('personal_records')
      .select(`
        id, 
        user_id,
        exercise_id,
        weight,
        reps,
        achieved_at,
        workout_completion_id,
        exercises (name)
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching personal records:', error);
      return [];
    }

    // Transform the data to include the exercise name if available
    return (data || []).map(record => ({
      ...record,
      exercise_name: record.exercises?.name
    })) as PersonalRecord[];
  } catch (error) {
    console.error('Error in fetchPersonalRecords:', error);
    return [];
  }
};

// Function to save workout journal notes
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
