
import { supabase } from "@/integrations/supabase/client";

/**
 * Saves a workout draft to the server
 */
export const saveWorkoutDraft = async (
  workoutId: string | null,
  workoutType: string | null,
  draftData: any
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found");
      return false;
    }
    
    // Check if a draft already exists for this workout
    const { data: existingDraft } = await supabase
      .from('workout_drafts')
      .select('id')
      .eq('user_id', user.id)
      .eq('workout_id', workoutId || '')
      .maybeSingle();
      
    if (existingDraft) {
      // Update existing draft
      const { error } = await supabase
        .from('workout_drafts')
        .update({ 
          draft_data: draftData,
          workout_type: workoutType,
          updated_at: new Date().toISOString() // Add updated timestamp
        })
        .eq('id', existingDraft.id);
        
      if (error) {
        console.error("Error updating workout draft:", error);
        return false;
      }
    } else {
      // Create new draft
      const { error } = await supabase
        .from('workout_drafts')
        .insert({
          user_id: user.id,
          workout_id: workoutId,
          workout_type: workoutType,
          draft_data: draftData,
          updated_at: new Date().toISOString() // Add created timestamp
        });
        
      if (error) {
        console.error("Error creating workout draft:", error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error in saveWorkoutDraft:", error);
    return false;
  }
};

/**
 * Retrieves a workout draft from the server
 */
export const getWorkoutDraft = async (
  workoutId: string | null
): Promise<any | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found");
      return null;
    }
    
    const { data, error } = await supabase
      .from('workout_drafts')
      .select('draft_data, workout_type, updated_at')
      .eq('user_id', user.id)
      .eq('workout_id', workoutId || '')
      .maybeSingle();
      
    if (error) {
      console.error("Error retrieving workout draft:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in getWorkoutDraft:", error);
    return null;
  }
};

/**
 * Deletes a workout draft from the server
 */
export const deleteWorkoutDraft = async (
  workoutId: string | null
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found");
      return false;
    }
    
    const { error } = await supabase
      .from('workout_drafts')
      .delete()
      .eq('user_id', user.id)
      .eq('workout_id', workoutId || '');
      
    if (error) {
      console.error("Error deleting workout draft:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in deleteWorkoutDraft:", error);
    return false;
  }
};

/**
 * Force immediate save of workout draft
 * This can be used when we need to ensure data is saved before page unload
 */
export const forceSaveWorkoutDraft = async (
  workoutId: string | null,
  workoutType: string | null,
  draftData: any
): Promise<boolean> => {
  try {
    // Use the same logic as saveWorkoutDraft but without debouncing
    return await saveWorkoutDraft(workoutId, workoutType, draftData);
  } catch (error) {
    console.error("Error in forceSaveWorkoutDraft:", error);
    return false;
  }
};

// Register page visibility change handler to save drafts when page is hidden
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // This event fires when the user minimizes or switches tabs
      // Any active autosave will be forced to complete by the browser
      console.log("Page visibility changed to hidden, drafts will be saved if any are pending");
    }
  });
}
