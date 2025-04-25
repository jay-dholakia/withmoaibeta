
import { supabase } from "@/integrations/supabase/client";

/**
 * Parses draft data if it's a string
 */
const safeParseDraftData = (data: any): any => {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (error) {
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
  if (!workoutId) return false;

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return false;
    
    const workoutTypeValue = workoutType || 'workout';
    const draftDataToStore = typeof draftData === 'string' 
      ? JSON.parse(draftData) 
      : draftData;

    const { error } = await supabase
      .from("workout_drafts")
      .upsert({
        user_id: user.id,
        workout_id: workoutId,
        workout_type: workoutTypeValue,
        draft_data: draftDataToStore,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: "user_id,workout_id" 
      });

    return !error;
  } catch {
    return false;
  }
};

/**
 * Updates exercise ID references in workout draft data
 * Used when swapping exercises to maintain user progress
 */
export const updateExerciseIdInDraft = async (
  workoutId: string | null,
  oldExerciseId: string,
  newExerciseId: string
): Promise<boolean> => {
  if (!workoutId || !oldExerciseId || !newExerciseId) return false;

  try {
    const draft = await getWorkoutDraft(workoutId);
    if (!draft || !draft.draft_data) return false;

    const draftData = draft.draft_data;
    let updated = false;
    
    // Update exercise_id in exerciseStates
    if (draftData.exerciseStates && draftData.exerciseStates[oldExerciseId]) {
      // Update the exercise_id field
      draftData.exerciseStates[oldExerciseId].exercise_id = newExerciseId;
      updated = true;
    }
    
    // Update references in pendingSets
    if (draftData.pendingSets && Array.isArray(draftData.pendingSets)) {
      draftData.pendingSets = draftData.pendingSets.map((set: any) => {
        if (set.exerciseId === oldExerciseId) {
          return { ...set, exerciseId: newExerciseId };
        }
        return set;
      });
      updated = true;
    }
    
    // Update references in pendingCardio
    if (draftData.pendingCardio && Array.isArray(draftData.pendingCardio)) {
      draftData.pendingCardio = draftData.pendingCardio.map((item: any) => {
        if (item.exerciseId === oldExerciseId) {
          return { ...item, exerciseId: newExerciseId };
        }
        return item;
      });
      updated = true;
    }
    
    // Update references in pendingFlexibility
    if (draftData.pendingFlexibility && Array.isArray(draftData.pendingFlexibility)) {
      draftData.pendingFlexibility = draftData.pendingFlexibility.map((item: any) => {
        if (item.exerciseId === oldExerciseId) {
          return { ...item, exerciseId: newExerciseId };
        }
        return item;
      });
      updated = true;
    }
    
    // Update references in pendingRuns
    if (draftData.pendingRuns && Array.isArray(draftData.pendingRuns)) {
      draftData.pendingRuns = draftData.pendingRuns.map((item: any) => {
        if (item.exerciseId === oldExerciseId) {
          return { ...item, exerciseId: newExerciseId };
        }
        return item;
      });
      updated = true;
    }
    
    if (updated) {
      return await saveWorkoutDraft(workoutId, 'workout', draftData);
    }
    
    return true;
  } catch {
    return false;
  }
};

export const getWorkoutDraft = async (
  workoutId: string | null,
  maxRetries = 5,
  retryInterval = 300
): Promise<any | null> => {
  if (!workoutId) return null;
  
  try {
    for (let i = 0; i <= maxRetries; i++) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        if (i === maxRetries) return null;
        await new Promise(res => setTimeout(res, retryInterval));
        continue;
      }

      const { data, error } = await supabase
        .from("workout_drafts")
        .select("*")
        .eq("user_id", user.id)
        .eq("workout_id", workoutId)
        .maybeSingle();

      if (error) {
        if (i === maxRetries) return null;
        await new Promise(res => setTimeout(res, retryInterval));
      } else {
        if (data) {
          return {
            ...data,
            draft_data: safeParseDraftData(data.draft_data)
          };
        }
        return null;
      }
    }
  } catch {
    return null;
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

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return false;

    const { error } = await supabase
      .from("workout_drafts")
      .delete()
      .eq("user_id", user.id)
      .eq("workout_id", workoutId);

    return !error;
  } catch {
    return false;
  }
};
