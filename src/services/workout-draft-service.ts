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

    try {
      // Store the complete payload in sessionStorage
      const sessionPayload = {
        user_id: user.id,
        workout_id: workoutId,
        workout_type: workoutTypeValue,
        draft_data: draftDataToStore,
        id: data?.[0]?.id,
        updated_at: new Date().toISOString()
      };
      
      sessionStorage.setItem(
        `workout_draft_${workoutId}`,
        JSON.stringify(sessionPayload)
      );
      console.log(">>> Draft also saved to sessionStorage:", sessionPayload);
    } catch (e) {
      console.warn(">>> sessionStorage save failed:", e);
    }

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
    // First check sessionStorage for immediate access
    const cached = sessionStorage.getItem(`workout_draft_${workoutId}`);
    if (cached) {
      try {
        console.log("Found draft in sessionStorage");
        const parsedCache = JSON.parse(cached);
        console.log("Parsed sessionStorage draft:", parsedCache);
        
        // Ensure consistent format
        if (parsedCache && typeof parsedCache === 'object') {
          return parsedCache;
        }
      } catch (e) {
        console.error("Error parsing sessionStorage draft:", e);
      }
    }

    // If not in sessionStorage, fetch from database with retries
    // Important: For active workouts, we need to wait for user authentication
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
          const formattedData = {
            ...data,
            draft_data: safeParseDraftData(data.draft_data)
          };
          
          try {
            // Store complete retrieved data in sessionStorage
            sessionStorage.setItem(`workout_draft_${workoutId}`, JSON.stringify(formattedData));
            console.log("Saved retrieved draft to sessionStorage:", formattedData);
          } catch (e) {
            console.warn("Failed to save to sessionStorage:", e);
          }
          return formattedData;
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
    sessionStorage.removeItem(`workout_draft_${workoutId}`);
    console.log("Removed draft from sessionStorage");
  } catch (e) {
    console.warn("Error removing from sessionStorage:", e);
  }

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
