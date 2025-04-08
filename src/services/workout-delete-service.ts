
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Deletes a workout completion by ID
 * @param completionId ID of the workout completion to delete
 * @returns Promise resolving to a boolean indicating success/failure
 */
export const deleteWorkoutCompletion = async (completionId: string): Promise<boolean> => {
  try {
    // First delete the associated workout set completions
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
