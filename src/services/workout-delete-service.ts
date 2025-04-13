
import { supabase } from "@/integrations/supabase/client";

/**
 * Deletes a workout by ID
 * @param workoutId ID of the workout to delete
 * @returns Promise resolving to a boolean indicating success/failure
 */
export const deleteWorkout = async (workoutId: string): Promise<boolean> => {
  try {
    // First delete any exercise associations
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
