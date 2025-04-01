import { supabase } from "@/integrations/supabase/client";
import { Exercise } from "@/types/workout";
import { getUser } from "./auth-service";

/**
 * Fetch all exercises
 */
export const fetchExercises = async (): Promise<Exercise[]> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error("Error fetching exercises:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchExercises:", error);
    return [];
  }
};

/**
 * Fetch a single exercise by ID
 */
export const fetchExerciseById = async (exerciseId: string): Promise<Exercise | null> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exerciseId)
      .single();

    if (error) {
      console.error("Error fetching exercise by ID:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in fetchExerciseById:", error);
    return null;
  }
};

/**
 * Track a workout set completion
 */
export const trackWorkoutSet = async (
  workoutCompletionId: string,
  workoutExerciseId: string,
  setNumber: number,
  weight: number | null = null,
  reps: number | null = null,
  notes: string | null = null,
  distance: string | null = null,
  duration: string | null = null,
  location: string | null = null
) => {
  try {
    // First check if this workout completion exists
    const { data: workoutCompletion, error: fetchError } = await supabase
      .from('workout_completions')
      .select('*')
      .eq('id', workoutCompletionId)
      .maybeSingle();
      
    if (fetchError) {
      console.error("Error fetching workout completion:", fetchError);
      throw fetchError;
    }
    
    if (!workoutCompletion) {
      console.error("Workout completion not found with ID:", workoutCompletionId);
      
      // Get the user and workout_id information from workout_exercise_id
      const { data: exerciseData, error: exerciseError } = await supabase
        .from('workout_exercises')
        .select('workout_id')
        .eq('id', workoutExerciseId)
        .maybeSingle();
        
      if (exerciseError || !exerciseData) {
        console.error("Error fetching workout exercise data:", exerciseError);
        throw exerciseError || new Error("Could not find workout exercise data");
      }
      
      // Create a new workout completion record
      const { data: newCompletionData, error: insertError } = await supabase
        .from('workout_completions')
        .insert({
          id: workoutCompletionId,
          workout_id: exerciseData.workout_id,
          user_id: getUser()?.id,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (insertError) {
        console.error("Error creating workout completion:", insertError);
        throw insertError;
      }
    }
    
    // Check if a set completion already exists
    const { data: existingSet, error: existingSetError } = await supabase
      .from('workout_set_completions')
      .select('*')
      .eq('workout_completion_id', workoutCompletionId)
      .eq('workout_exercise_id', workoutExerciseId)
      .eq('set_number', setNumber)
      .maybeSingle();
      
    if (existingSetError) {
      console.error("Error checking for existing set completion:", existingSetError);
    }
    
    // If set already exists, update it
    if (existingSet) {
      const { data, error } = await supabase
        .from('workout_set_completions')
        .update({
          reps_completed: reps,
          weight,
          completed: true,
          notes,
          distance,
          duration,
          location,
        })
        .eq('id', existingSet.id)
        .select()
        .single();
        
      if (error) {
        console.error("Error updating workout set:", error);
        throw error;
      }
      
      return data;
    } else {
      // Create a new set completion
      const { data, error } = await supabase
        .from('workout_set_completions')
        .insert({
          workout_completion_id: workoutCompletionId,
          workout_exercise_id: workoutExerciseId,
          set_number: setNumber,
          reps_completed: reps,
          weight,
          completed: true,
          user_id: getUser()?.id,
          notes,
          distance,
          duration,
          location,
        })
        .select()
        .single();
        
      if (error) {
        console.error("Error tracking workout set:", error);
        throw error;
      }
      
      return data;
    }
  } catch (error) {
    console.error("Error in trackWorkoutSet:", error);
    throw error;
  }
};

/**
 * Complete a workout
 */
export const completeWorkout = async (
  workoutId: string,
  rating: number | null = null,
  notes: string | null = null
) => {
  try {
    // First check if this is a workout ID or a workout completion ID
    const { data: existingCompletion, error: fetchError } = await supabase
      .from('workout_completions')
      .select('*')
      .eq('id', workoutId)
      .maybeSingle();
      
    if (fetchError) {
      console.error("Error checking workout completion:", fetchError);
    }
    
    // If this is already a completion ID, just update it
    if (existingCompletion) {
      const { data, error } = await supabase
        .from('workout_completions')
        .update({
          rating,
          notes,
          completed_at: new Date().toISOString(),
        })
        .eq('id', workoutId)
        .select()
        .single();
        
      if (error) {
        console.error("Error completing workout:", error);
        throw error;
      }
      
      return data;
    } else {
      // This is a workout ID, not a completion ID
      // Create a new completion record
      const { data, error } = await supabase
        .from('workout_completions')
        .insert({
          workout_id: workoutId,
          user_id: getUser()?.id,
          rating,
          notes,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();
        
      if (error) {
        console.error("Error recording workout completion:", error);
        throw error;
      }
      
      return data;
    }
  } catch (error) {
    console.error("Error in completeWorkout:", error);
    throw error;
  }
};

/**
 * Fetch personal records for a user
 */
export const fetchPersonalRecords = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error("Error fetching personal records:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in fetchPersonalRecords:", error);
    return null;
  }
};
