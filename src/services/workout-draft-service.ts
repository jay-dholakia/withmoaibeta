
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
    if (!workoutId) {
      console.error("No workout ID provided for draft");
      return false;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found");
      return false;
    }
    
    console.log(`Saving workout draft for ID: ${workoutId}, Type: ${workoutType}, Data:`, JSON.stringify(draftData).substring(0, 100) + "...");
    
    // Check if a draft already exists for this workout
    const { data: existingDraft, error: queryError } = await supabase
      .from('workout_drafts')
      .select('id')
      .eq('user_id', user.id)
      .eq('workout_id', workoutId)
      .maybeSingle();
      
    if (queryError) {
      console.error("Error checking for existing draft:", queryError);
      return false;
    }
      
    if (existingDraft) {
      // Update existing draft
      const { error } = await supabase
        .from('workout_drafts')
        .update({ 
          draft_data: draftData,
          workout_type: workoutType,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingDraft.id);
        
      if (error) {
        console.error("Error updating workout draft:", error);
        return false;
      }
      
      console.log("Updated existing workout draft successfully");
      return true;
    } else {
      // Create new draft
      const { error } = await supabase
        .from('workout_drafts')
        .insert({
          user_id: user.id,
          workout_id: workoutId,
          workout_type: workoutType,
          draft_data: draftData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        console.error("Error creating workout draft:", error);
        return false;
      }
      
      console.log("Created new workout draft successfully");
      return true;
    }
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
    if (!workoutId) {
      console.error("No workout ID provided for fetching draft");
      return null;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found");
      return null;
    }
    
    console.log("Retrieving workout draft for ID:", workoutId);
    
    const { data, error } = await supabase
      .from('workout_drafts')
      .select('draft_data, workout_type')
      .eq('user_id', user.id)
      .eq('workout_id', workoutId)
      .maybeSingle();
      
    if (error) {
      console.error("Error retrieving workout draft:", error);
      return null;
    }
    
    if (data && data.draft_data) {
      console.log("Found workout draft with data:", JSON.stringify(data.draft_data).substring(0, 100) + "...");
      return data;
    } else {
      console.log("No workout draft found for ID:", workoutId);
      return null;
    }
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
    if (!workoutId) {
      console.error("No workout ID provided for deleting draft");
      return false;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found");
      return false;
    }
    
    console.log("Deleting workout draft for ID:", workoutId);
    
    const { error } = await supabase
      .from('workout_drafts')
      .delete()
      .eq('user_id', user.id)
      .eq('workout_id', workoutId);
      
    if (error) {
      console.error("Error deleting workout draft:", error);
      return false;
    }
    
    console.log("Successfully deleted workout draft");
    return true;
  } catch (error) {
    console.error("Error in deleteWorkoutDraft:", error);
    return false;
  }
};
