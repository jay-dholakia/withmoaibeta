
/**
 * Client service methods for workout tracking and completion
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches the client profile data
 */
export const fetchClientProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error("Error fetching client profile:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error in fetchClientProfile:", error);
    throw error;
  }
};

/**
 * Tracks a set for a workout
 */
export const trackWorkoutSet = async (
  workoutCompletionId: string,
  workoutExerciseId: string,
  setNumber: number,
  weight: number | null,
  reps: number | null,
  notes: string | null = null,
  distance: string | null = null,
  duration: string | null = null,
  location: string | null = null
) => {
  try {
    console.log("Tracking workout set with params:", {
      workoutCompletionId,
      workoutExerciseId,
      setNumber,
      weight,
      reps,
      notes,
      distance,
      duration,
      location
    });

    // First, get the user_id from the workout_completions table
    const { data: completionData, error: completionError } = await supabase
      .from('workout_completions')
      .select('user_id, workout_id')
      .eq('id', workoutCompletionId)
      .maybeSingle();
    
    if (completionError) {
      console.error("Error fetching workout completion:", completionError);
      throw completionError;
    }
    
    if (!completionData || !completionData.user_id) {
      console.error("Cannot track set: No workout completion found for ID", workoutCompletionId);
      throw new Error("Workout completion not found");
    }
    
    const { data: existingSetData, error: existingSetError } = await supabase
      .from('workout_set_completions')
      .select('id')
      .eq('workout_completion_id', workoutCompletionId)
      .eq('workout_exercise_id', workoutExerciseId)
      .eq('set_number', setNumber)
      .maybeSingle();
    
    if (existingSetError) {
      console.error("Error checking for existing set:", existingSetError);
      throw existingSetError;
    }
    
    if (existingSetData) {
      // Update existing set
      const { data, error } = await supabase
        .from('workout_set_completions')
        .update({
          weight,
          reps_completed: reps,
          completed: true,
          notes,
          distance,
          duration,
          location
        })
        .eq('id', existingSetData.id)
        .select();
      
      if (error) {
        console.error("Error updating workout set:", error);
        throw error;
      }
      
      return data?.[0];
    } else {
      // Insert new set
      const { data, error } = await supabase
        .from('workout_set_completions')
        .insert({
          workout_completion_id: workoutCompletionId,
          workout_exercise_id: workoutExerciseId,
          user_id: completionData.user_id,
          set_number: setNumber,
          weight,
          reps_completed: reps,
          completed: true,
          notes,
          distance,
          duration,
          location
        })
        .select();
      
      if (error) {
        console.error("Error tracking workout set:", error);
        throw error;
      }
      
      return data?.[0];
    }
  } catch (error) {
    console.error("Error in trackWorkoutSet:", error);
    throw error;
  }
};

/**
 * Completes a workout
 */
export const completeWorkout = async (
  workoutCompletionId: string,
  rating: number | null,
  notes: string | null
) => {
  try {
    const { data, error } = await supabase
      .from('workout_completions')
      .update({
        completed_at: new Date().toISOString(),
        rating,
        notes
      })
      .eq('id', workoutCompletionId)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error("Error completing workout:", error);
      throw error;
    }
    
    // Check for any personal records that were achieved
    await fetchPersonalRecords(workoutCompletionId);
    
    return data;
  } catch (error) {
    console.error("Error in completeWorkout:", error);
    throw error;
  }
};

/**
 * Fetches personal records for a specific workout completion
 */
export const fetchPersonalRecords = async (workoutCompletionId: string) => {
  try {
    const { data, error } = await supabase
      .from('personal_records')
      .select(`
        *,
        exercise:exercise_id (*)
      `)
      .eq('workout_completion_id', workoutCompletionId);
    
    if (error) {
      console.error("Error fetching personal records:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error in fetchPersonalRecords:", error);
    throw error;
  }
};

/**
 * Updates a client profile
 */
export const updateClientProfile = async (userId: string, profileData: any) => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating client profile:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error in updateClientProfile:", error);
    throw error;
  }
};

/**
 * Submits beta feedback
 */
export const submitBetaFeedback = async (userId: string, feedback: string) => {
  try {
    const { data, error } = await supabase
      .from('beta_feedback')
      .insert({
        user_id: userId,
        feedback
      });
    
    if (error) {
      console.error("Error submitting beta feedback:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error in submitBetaFeedback:", error);
    throw error;
  }
};
