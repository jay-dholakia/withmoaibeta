
import { supabase } from "@/integrations/supabase/client";

/**
 * Saves workout journal notes for a specific workout completion
 */
export const saveWorkoutJournalNotes = async (workoutCompletionId: string, notes: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_completions')
      .update({ notes: notes })
      .eq('id', workoutCompletionId);

    if (error) {
      console.error('Error saving workout journal notes:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error saving workout journal notes:', error);
    return false;
  }
};

/**
 * Updates the completion date of a workout
 */
export const updateWorkoutCompletionDate = async (workoutId: string, newDate: Date): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_completions')
      .update({ completed_at: newDate.toISOString() })
      .eq('id', workoutId);

    if (error) {
      console.error('Error updating workout date:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating workout date:', error);
    return false;
  }
};

/**
 * Track workout set
 */
export const trackWorkoutSet = async (
  workoutId: string,
  exerciseId: string,
  setData: {
    set_number: number,
    weight?: number,
    reps_completed?: number,
    completed?: boolean,
    distance?: string,
    duration?: string,
    location?: string
  }
) => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      console.error('No authenticated user found');
      return false;
    }

    const { error } = await supabase
      .from('workout_set_completions')
      .insert({
        user_id: userId,
        workout_completion_id: workoutId,
        workout_exercise_id: exerciseId,
        set_number: setData.set_number,
        weight: setData.weight,
        reps_completed: setData.reps_completed,
        completed: setData.completed || false,
        distance: setData.distance,
        duration: setData.duration,
        location: setData.location
      });

    if (error) {
      console.error('Error tracking workout set:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error tracking workout set:', error);
    return false;
  }
};

/**
 * Complete a workout
 */
export const completeWorkout = async (
  workoutId: string,
  userId: string,
  notes?: string,
  rating?: number
) => {
  try {
    const { error } = await supabase
      .from('workout_completions')
      .update({
        completed_at: new Date().toISOString(),
        notes: notes,
        rating: rating
      })
      .eq('id', workoutId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error completing workout:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error completing workout:', error);
    return false;
  }
};
