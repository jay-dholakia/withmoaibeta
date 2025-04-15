
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

  const payload = {
    user_id: user.id,
    workout_id: workoutId,
    workout_type: workoutType,
    draft_data: draftData,
    updated_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabase
      .from("workout_drafts")
      .upsert(payload, { onConflict: ["user_id", "workout_id"] });

    if (error) {
      console.error("Error saving workout draft:", error);
      return false;
    }

    sessionStorage.setItem(
      `workout_draft_${workoutId}`,
      JSON.stringify(payload)
    );

    console.log("Workout draft saved successfully");
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

  const cached = sessionStorage.getItem(`workout_draft_${workoutId}`);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      console.error("Cache parse error:", e);
    }
  }

  for (let i = 0; i <= maxRetries; i++) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      if (i === maxRetries) return null;
      await new Promise(res => setTimeout(res, retryInterval));
      continue;
    }

    const { data, error } = await supabase
      .from("workout_drafts")
      .select("draft_data, workout_type, updated_at")
      .eq("user_id", user.id)
      .eq("workout_id", workoutId)
      .maybeSingle();

    if (error) {
      console.error("Fetch error:", error);
      if (i === maxRetries) return null;
      await new Promise(res => setTimeout(res, retryInterval));
    } else {
      if (data) {
        const parsed = { ...data, draft_data: safeParseDraftData(data.draft_data) };
        sessionStorage.setItem(`workout_draft_${workoutId}`, JSON.stringify(parsed));
        return parsed;
      }
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

  sessionStorage.removeItem(`workout_draft_${workoutId}`);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return false;

  const { error } = await supabase
    .from("workout_drafts")
    .delete()
    .eq("user_id", user.id)
    .eq("workout_id", workoutId);

  if (error) {
    console.error("Delete error:", error);
    return false;
  }

  return true;
};
