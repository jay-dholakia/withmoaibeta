import { supabase } from "@/integrations/supabase/client";

/**
 * Deletes a workout by ID
 * @param workoutId ID of the workout to delete
 * @returns Promise resolving to a boolean indicating success/failure
 */
export const deleteWorkout = async (workoutId: string): Promise<boolean> => {
  try {
    // First delete any personal records
    const { error: prError } = await supabase
      .from('personal_records')
      .delete()
      .eq('workout_completion_id', workoutId);
    
    if (prError) {
      console.error("Error deleting personal records:", prError);
      // Continue anyway as this is not critical
    }
    
    // Delete any exercise associations
    const { error: exercisesError } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('workout_id', workoutId);
    
    if (exercisesError) {
      console.error("Error deleting workout exercises:", exercisesError);
      return false;
    }
    
    // Then delete the workout itself
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', workoutId);
      
    if (error) {
      console.error("Error deleting workout:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in deleteWorkout:", error);
    return false;
  }
};

/**
 * Deletes a workout completion by ID
 * @param completionId ID of the workout completion to delete
 * @returns Promise resolving to a boolean indicating success/failure
 */
export const deleteWorkoutCompletion = async (completionId: string): Promise<boolean> => {
  try {
    // First delete the associated personal records
    const { error: prError } = await supabase
      .from('personal_records')
      .delete()
      .eq('workout_completion_id', completionId);
      
    if (prError) {
      console.error("Error deleting personal records:", prError);
      // Continue anyway as this is not critical
    }
    
    // Delete the associated workout set completions
    const { error: setsError } = await supabase
      .from('workout_set_completions')
      .delete()
      .eq('workout_completion_id', completionId);
    
    if (setsError) {
      console.error("Error deleting workout set completions:", setsError);
      return false;
    }
    
    // Then delete the workout completion itself
    const { error } = await supabase
      .from('workout_completions')
      .delete()
      .eq('id', completionId);
      
    if (error) {
      console.error("Error deleting workout completion:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in deleteWorkoutCompletion:", error);
    return false;
  }
};
