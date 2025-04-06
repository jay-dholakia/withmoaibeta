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
          workout_type: workoutType
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
          draft_data: draftData
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
 * Retrieves a workout draft from the server with retry logic
 * @param workoutId The workout ID
 * @param maxRetries Maximum number of retries (default: 3)
 * @param retryInterval Interval between retries in ms (default: 1000)
 */
export const getWorkoutDraft = async (
  workoutId: string | null,
  maxRetries = 3,
  retryInterval = 1000
): Promise<any | null> => {
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log(`No authenticated user found, retry ${retries + 1}/${maxRetries + 1}`);
        // If we've reached max retries, return null
        if (retries === maxRetries) {
          console.error("Max retries reached, no authenticated user found");
          return null;
        }
        // Otherwise, wait and retry
        retries++;
        await new Promise(resolve => setTimeout(resolve, retryInterval));
        continue;
      }
      
      const { data, error } = await supabase
        .from('workout_drafts')
        .select('draft_data, workout_type')
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
      
      // If we've reached max retries, return null
      if (retries === maxRetries) {
        return null;
      }
      
      // Otherwise, wait and retry
      retries++;
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }
  
  return null;
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
