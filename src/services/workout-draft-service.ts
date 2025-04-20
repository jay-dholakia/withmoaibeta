
import { supabase } from "@/integrations/supabase/client";

/**
 * Parses draft data if it's a string
 */
const safeParseDraftData = (data: any): any => {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error("Error parsing draft data:", error);
      return {};
    }
  }
  return data || {};
};

/**
 * Saves a workout draft to the server
 */
export const saveWorkoutDraft = async (
  workoutId: string | null,
  workoutType: string | null,
  draftData: any
): Promise<boolean> => {
  if (!workoutId) {
    console.warn("No workout ID provided");
    return false;
  }

  console.log(`Attempting to save draft for workout ${workoutId} of type ${workoutType}`);
  console.log("Draft data to save:", draftData);

  try {
    // Ensure we have an authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("User auth error:", authError);
      return false;
    }
    
    // Ensure workout_type is a string, not null
    const workoutTypeValue = workoutType || 'workout';

    // Prepare the draft data to store
    const draftDataToStore = typeof draftData === 'string' 
      ? JSON.parse(draftData) 
      : draftData;

    // Perform the upsert operation - this will replace any existing draft for this workout
    const { data, error } = await supabase
      .from("workout_drafts")
      .upsert({
        user_id: user.id,
        workout_id: workoutId,
        workout_type: workoutTypeValue,
        draft_data: draftDataToStore,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: "user_id,workout_id" 
      })
      .select("id");

    if (error) {
      console.error(">>> UPSERT ERROR:", error);
      return false;
    }

    console.log(">>> UPSERT SUCCESS:", data);
    return true;
  } catch (err) {
    console.error(">>> UNEXPECTED ERROR DURING DRAFT SAVE:", err);
    return false;
  }
};

export const getWorkoutDraft = async (
  workoutId: string | null,
  maxRetries = 5,
  retryInterval = 300
): Promise<any | null> => {
  if (!workoutId) return null;

  console.log(`Attempting to get workout draft for workoutId: ${workoutId}`);
  
  try {
    // Fetch from database with retries
    for (let i = 0; i <= maxRetries; i++) {
      // Ensure we have the authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.log(`Auth error (attempt ${i+1}/${maxRetries+1}):`, authError);
        if (i === maxRetries) return null;
        await new Promise(res => setTimeout(res, retryInterval));
        continue;
      }

      console.log(`Querying database for draft (attempt ${i+1}/${maxRetries+1})`);
      console.log(`Looking for draft with user_id=${user.id}, workout_id=${workoutId}`);
      
      // IMPORTANT DEBUG: List all drafts for this user
      const { data: allDrafts } = await supabase
        .from("workout_drafts")
        .select("*")
        .eq("user_id", user.id);
        
      console.log(`Found ${allDrafts?.length || 0} total drafts for user:`, allDrafts);
      
      // Now get the specific draft
      const { data, error } = await supabase
        .from("workout_drafts")
        .select("*")
        .eq("user_id", user.id)
        .eq("workout_id", workoutId)
        .maybeSingle();

      if (error) {
        console.error(`Fetch error (attempt ${i+1}/${maxRetries+1}):`, error);
        if (i === maxRetries) return null;
        await new Promise(res => setTimeout(res, retryInterval));
      } else {
        if (data) {
          console.log("Retrieved draft from database:", data);
          // Ensure draft_data is properly formatted
          return {
            ...data,
            draft_data: safeParseDraftData(data.draft_data)
          };
        }
        console.log("No draft found in database for this specific workout ID");
        return null;
      }
    }
  } catch (err) {
    console.error("Unexpected error fetching draft:", err);
  }
  
  return null;
};

/**
 * Deletes a workout draft from the server
 */
export const deleteWorkoutDraft = async (
  workoutId: string | null
): Promise<boolean> => {
  if (!workoutId) return false;

  console.log(`Deleting workout draft for workoutId: ${workoutId}`);

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error when deleting draft:", authError);
      return false;
    }

    const { error } = await supabase
      .from("workout_drafts")
      .delete()
      .eq("user_id", user.id)
      .eq("workout_id", workoutId);

    if (error) {
      console.error("Delete error:", error);
      return false;
    }

    console.log("Successfully deleted draft from database");
    return true;
  } catch (err) {
    console.error("Unexpected error deleting draft:", err);
    return false;
  }
};
