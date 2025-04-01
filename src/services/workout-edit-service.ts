
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
