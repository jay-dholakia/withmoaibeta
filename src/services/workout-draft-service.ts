
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

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("User auth error:", authError);
    return false;
  }

  // Ensure draft_data is converted to JSON string for storage
  const jsonData = typeof draftData === 'string' ? draftData : JSON.stringify(draftData);

  const payload = {
    user_id: user.id,
    workout_id: workoutId,
    workout_type: workoutType,
    draft_data: draftData,
    updated_at: new Date().toISOString(),
  };

  try {
    console.log("Attempting to save workout draft with payload:", payload);
    
    // Use the correct upsert syntax that matches our unique constraint
    const { error, data } = await supabase
      .from("workout_drafts")
      .upsert(payload, { onConflict: 'user_id,workout_id' });

    if (error) {
      console.error("Error saving workout draft:", error);
      return false;
    }

    console.log("Workout draft saved successfully to database:", data);

    try {
      sessionStorage.setItem(
        `workout_draft_${workoutId}`,
        JSON.stringify(payload)
      );
      console.log("Workout draft saved to sessionStorage");
    } catch (e) {
      console.warn("Failed to save to sessionStorage:", e);
    }

    return true;
  } catch (error) {
    console.error("Unexpected error saving workout draft:", error);
    return false;
  }
};

/**
 * Retrieves a workout draft from the server with improved reliability and added caching
 * @param workoutId The workout ID
 * @param maxRetries Maximum number of retries (default: 5)
 * @param retryInterval Interval between retries in ms (default: 300)
 */
export const getWorkoutDraft = async (
  workoutId: string | null,
  maxRetries = 5,
  retryInterval = 300
): Promise<any | null> => {
  if (!workoutId) return null;

  console.log(`Attempting to get workout draft for workoutId: ${workoutId}`);

  // First try getting from session storage for better performance
  const cached = sessionStorage.getItem(`workout_draft_${workoutId}`);
  if (cached) {
    try {
      console.log("Found draft in sessionStorage");
      return JSON.parse(cached);
    } catch (e) {
      console.error("Cache parse error:", e);
    }
  }

  // If not in session storage, try from database with retries
  for (let i = 0; i <= maxRetries; i++) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log(`Auth error (attempt ${i+1}/${maxRetries+1}):`, authError);
      if (i === maxRetries) return null;
      await new Promise(res => setTimeout(res, retryInterval));
      continue;
    }

    console.log(`Querying database for draft (attempt ${i+1}/${maxRetries+1})`);
    const { data, error } = await supabase
      .from("workout_drafts")
      .select("draft_data, workout_type, updated_at")
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
        const parsed = { ...data, draft_data: safeParseDraftData(data.draft_data) };
        try {
          sessionStorage.setItem(`workout_draft_${workoutId}`, JSON.stringify(parsed));
          console.log("Saved retrieved draft to sessionStorage");
        } catch (e) {
          console.warn("Failed to save to sessionStorage:", e);
        }
        return parsed;
      }
      console.log("No draft found in database");
      return null;
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
  if (!workoutId) return false;

  console.log(`Deleting workout draft for workoutId: ${workoutId}`);

  try {
    sessionStorage.removeItem(`workout_draft_${workoutId}`);
    console.log("Removed draft from sessionStorage");
  } catch (e) {
    console.warn("Error removing from sessionStorage:", e);
  }

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
};
