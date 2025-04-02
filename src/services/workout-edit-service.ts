
import { supabase } from "@/integrations/supabase/client";
import { WorkoutSetCompletion } from "@/types/workout";

/**
 * Updates a workout set completion record
 */
export const updateWorkoutSetCompletion = async (
  completionId: string,
  data: Partial<WorkoutSetCompletion>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_set_completions')
      .update(data)
      .eq('id', completionId);
      
    if (error) {
      console.error("Error updating workout set completion:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateWorkoutSetCompletion:", error);
    return false;
  }
};

/**
 * Updates a workout completion entry directly
 */
export const updateWorkoutCompletion = async (
  completionId: string,
  data: {
    title?: string;
    description?: string | null;
    duration?: string | null;
    workout_type?: string;
    notes?: string | null;
    location?: string | null;
    distance?: string | null;
  }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_completions')
      .update(data)
      .eq('id', completionId);
      
    if (error) {
      console.error("Error updating workout completion:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateWorkoutCompletion:", error);
    return false;
  }
};

/**
 * Batch updates a list of workout set completions
 */
export const batchUpdateWorkoutSetCompletions = async (
  updates: Array<{
    id: string,
    changes: Partial<WorkoutSetCompletion>
  }>
): Promise<number> => {
  try {
    let successCount = 0;
    
    // Process updates in batches of 10 to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      // Create an array of promises for this batch
      const promises = batch.map(({ id, changes }) => 
        supabase
          .from('workout_set_completions')
          .update(changes)
          .eq('id', id)
      );
      
      // Execute all promises in this batch
      const results = await Promise.all(promises);
      
      // Count successful updates
      results.forEach((result) => {
        if (!result.error) {
          successCount++;
        } else {
          console.error("Error updating workout set completion:", result.error);
        }
      });
    }
    
    return successCount;
  } catch (error) {
    console.error("Error in batchUpdateWorkoutSetCompletions:", error);
    return 0;
  }
};

/**
 * Gets complete exercise information for a workout exercise
 */
export const getExerciseForWorkoutExercise = async (
  workoutExerciseId: string
): Promise<{ id: string; name: string; exercise_type: string } | null> => {
  try {
    // First get the exercise_id from the workout_exercise
    const { data: workoutExercise, error: workoutExerciseError } = await supabase
      .from('workout_exercises')
      .select('exercise_id')
      .eq('id', workoutExerciseId)
      .single();
      
    if (workoutExerciseError || !workoutExercise) {
      console.error("Could not find workout exercise:", workoutExerciseError);
      return null;
    }
    
    // Then get the exercise details
    const { data: exercise, error: exerciseError } = await supabase
      .from('exercises')
      .select('id, name, exercise_type')
      .eq('id', workoutExercise.exercise_id)
      .single();
      
    if (exerciseError || !exercise) {
      console.error("Could not find exercise:", exerciseError);
      return null;
    }
    
    return exercise;
  } catch (error) {
    console.error("Error in getExerciseForWorkoutExercise:", error);
    return null;
  }
};

/**
 * Gets exercise information from a workout_exercise_id
 * This is a more robust method that attempts multiple ways to look up the exercise
 */
export const getExerciseInfoByWorkoutExerciseId = async (
  workoutExerciseId: string
): Promise<{ name: string; type: string } | null> => {
  try {
    // First try to get the exercise_id from the workout_exercises table
    const { data: workoutExercise, error: workoutExerciseError } = await supabase
      .from('workout_exercises')
      .select('exercise_id')
      .eq('id', workoutExerciseId)
      .maybeSingle();
      
    if (!workoutExerciseError && workoutExercise && workoutExercise.exercise_id) {
      // Then get the exercise details from the exercises table
      const { data: exercise, error: exerciseError } = await supabase
        .from('exercises')
        .select('name, exercise_type')
        .eq('id', workoutExercise.exercise_id)
        .maybeSingle();
        
      if (!exerciseError && exercise) {
        return {
          name: exercise.name,
          type: exercise.exercise_type
        };
      }
    }
    
    // If the first approach fails, try with standalone_workout_exercises
    const { data: standaloneExercise, error: standaloneError } = await supabase
      .from('standalone_workout_exercises')
      .select('exercise_id')
      .eq('id', workoutExerciseId)
      .maybeSingle();
      
    if (!standaloneError && standaloneExercise && standaloneExercise.exercise_id) {
      const { data: exercise, error: exerciseError } = await supabase
        .from('exercises')
        .select('name, exercise_type')
        .eq('id', standaloneExercise.exercise_id)
        .maybeSingle();
        
      if (!exerciseError && exercise) {
        return {
          name: exercise.name,
          type: exercise.exercise_type
        };
      }
    }
    
    // If all direct approaches fail, try a more generic approach
    // Look at the workout_set_completions to determine exercise type
    const { data: setCompletions, error: setCompletionsError } = await supabase
      .from('workout_set_completions')
      .select('*')
      .eq('workout_exercise_id', workoutExerciseId)
      .limit(1)
      .maybeSingle();
      
    if (!setCompletionsError && setCompletions) {
      // Try to determine exercise type from the set data
      if (setCompletions.distance) {
        return { name: "Running Exercise", type: "cardio" };
      } else if (setCompletions.duration && !setCompletions.weight) {
        return { name: "Cardio Exercise", type: "cardio" };
      } else if (setCompletions.weight) {
        return { name: "Strength Exercise", type: "strength" };
      }
    }
    
    // Last resort fallback
    return { name: "Exercise", type: "strength" };
  } catch (error) {
    console.error("Error in getExerciseInfoByWorkoutExerciseId:", error);
    return null;
  }
};

/**
 * Imports exercises from RapidAPI
 */
export const importExercisesFromRapidAPI = async (
  limit?: number, 
  checkExisting: boolean = true
): Promise<{ 
  total: number; 
  inserted: number; 
  updated: number; 
  skipped: number; 
}> => {
  try {
    const { data, error } = await supabase.functions.invoke('import-rapidapi-exercises', {
      body: { shouldCheckExisting: checkExisting, limit }
    });
    
    if (error) {
      console.error("RapidAPI import error:", error);
      throw new Error(error.message);
    }
    
    return {
      total: data.total || 0,
      inserted: data.inserted || 0,
      updated: data.updated || 0,
      skipped: data.skipped || 0
    };
  } catch (error) {
    console.error("Error in importExercisesFromRapidAPI:", error);
    throw error;
  }
};
