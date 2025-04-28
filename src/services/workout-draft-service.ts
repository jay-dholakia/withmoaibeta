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
 * Wraps raw exerciseStates into full draft structure
 */
const normalizeDraftData = (draftData: any): any => {
  if (!draftData) return {
    exerciseStates: {},
    pendingSets: [],
    pendingCardio: [],
    pendingFlexibility: [],
    pendingRuns: []
  };

  // If exerciseStates is missing but the data looks like exerciseStates directly, wrap it
  if (!draftData.exerciseStates && typeof draftData === 'object') {
    console.warn("Normalizing old draft data format into full structure...");
    return {
      exerciseStates: draftData,
      pendingSets: [],
      pendingCardio: [],
      pendingFlexibility: [],
      pendingRuns: []
    };
  }

  // Ensure all required properties exist
  return {
    exerciseStates: draftData.exerciseStates || {},
    pendingSets: draftData.pendingSets || [],
    pendingCardio: draftData.pendingCardio || [],
    pendingFlexibility: draftData.pendingFlexibility || [],
    pendingRuns: draftData.pendingRuns || []
  };
};

/**
 * Verifies Supabase connection is available
 */
const verifySupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("Auth error during connection check:", authError);
      return false;
    }

    const { error: dbError } = await supabase
      .from("workout_drafts")
      .select("id", { count: "exact", head: true })
      .limit(1);

    if (dbError) {
      console.error("Database connection error:", dbError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to verify Supabase connection:", error);
    return false;
  }
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
    console.error("Cannot save draft: Missing workoutId");
    return false;
  }

  try {
    const isConnected = await verifySupabaseConnection();
    if (!isConnected) {
      console.error("Cannot save draft: Supabase connection unavailable");
      return false;
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error or no user found:", authError);
      return false;
    }

    const workoutTypeValue = workoutType || 'workout';
    const draftDataToStore = typeof draftData === 'string'
      ? JSON.parse(draftData)
      : draftData;

    const wrappedDraftData = normalizeDraftData(draftDataToStore);

    // Validate that all exercise states are properly formed
    if (wrappedDraftData.exerciseStates) {
      // No modifications needed here - the validation will happen in the hooks
      console.log(`Exercise states validation check passed for workout ${workoutId}`);
    }

    console.log(`Saving workout draft for workout ${workoutId}`, {
      userId: user.id,
      workoutType: workoutTypeValue,
      dataSize: JSON.stringify(wrappedDraftData).length,
      timestamp: new Date().toISOString(),
      exerciseStatesCount: Object.keys(wrappedDraftData.exerciseStates || {}).length
    });

    const { data: existingDraft, error: queryError } = await supabase
      .from("workout_drafts")
      .select("id")
      .eq("user_id", user.id)
      .eq("workout_id", workoutId)
      .maybeSingle();

    if (queryError) {
      console.error("Error checking for existing draft:", queryError);
      return false;
    }

    let result;
    if (existingDraft) {
      // Update existing draft
      result = await supabase
        .from("workout_drafts")
        .update({
          draft_data: JSON.stringify(wrappedDraftData),
          workout_type: workoutTypeValue,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id)
        .eq("workout_id", workoutId);
    } else {
      // Insert new draft
      result = await supabase
        .from("workout_drafts")
        .insert({
          user_id: user.id,
          workout_id: workoutId,
          workout_type: workoutTypeValue,
          draft_data: JSON.stringify(wrappedDraftData),
          updated_at: new Date().toISOString()
        });
    }

    if (!result.error) {
      console.log(`Draft successfully saved to Supabase for workout ${workoutId}`);
      return true;
    } else {
      console.error("Error saving draft to Supabase:", result.error);
      return false;
    }
  } catch (error) {
    console.error("Exception during draft save:", error);
    return false;
  }
};

/**
 * Updates exercise ID references in workout draft data
 */
export const updateExerciseIdInDraft = async (
  workoutId: string | null,
  workoutExerciseId: string,
  newExerciseId: string
): Promise<boolean> => {
  if (!workoutId || !workoutExerciseId || !newExerciseId) return false;

  try {
    console.log(`Updating exercise ID in draft for workout ${workoutId}`, {
      workoutExerciseId,
      newExerciseId
    });

    const draft = await getWorkoutDraft(workoutId);
    if (!draft || !draft.draft_data) {
      console.error("No draft found to update exercise");
      return false;
    }

    const draftData = draft.draft_data;
    let updated = false;

    if (draftData.exerciseStates && draftData.exerciseStates[workoutExerciseId]) {
      const originalExerciseId = draftData.exerciseStates[workoutExerciseId].exercise_id;

      console.log(`Found exercise in draft states to update: ${workoutExerciseId}`, {
        originalExerciseId,
        newExerciseId
      });

      draftData.exerciseStates[workoutExerciseId].swapData = {
        timestamp: new Date().toISOString(),
        originalExerciseId: originalExerciseId || null,
        replacementExerciseId: newExerciseId
      };

      draftData.exerciseStates[workoutExerciseId].exercise_id = newExerciseId;
      updated = true;
    } else {
      // If state doesn't exist yet, create it
      console.log(`Creating new state for swapped exercise ${workoutExerciseId}`);
      
      // We don't have the exercise details here, so create a minimal state
      // The full state will be created during initialization
      draftData.exerciseStates = draftData.exerciseStates || {};
      draftData.exerciseStates[workoutExerciseId] = {
        exercise_id: newExerciseId,
        expanded: true,
        sets: [],
        swapData: {
          timestamp: new Date().toISOString(),
          originalExerciseId: null,
          replacementExerciseId: newExerciseId
        }
      };
      updated = true;
    }

    const pendingKeys = ['pendingSets', 'pendingCardio', 'pendingFlexibility', 'pendingRuns'];
    pendingKeys.forEach((key) => {
      if (draftData[key] && Array.isArray(draftData[key])) {
        draftData[key] = draftData[key].map((item: any) => {
          if (item.exerciseId === workoutExerciseId) {
            return { ...item, exerciseId: newExerciseId };
          }
          return item;
        });
        updated = true;
      }
    });

    if (updated) {
      console.log("Saving updated draft after exercise swap...");
      const saveResult = await saveWorkoutDraft(workoutId, 'workout', draftData);
      console.log("Draft save result after exercise swap:", saveResult ? "SUCCESS" : "FAILED");
      return saveResult;
    }

    console.log("No updates needed to draft data for exercise swap");
    return true;
  } catch (error) {
    console.error("Error updating exercise ID in draft:", error);
    return false;
  }
};

/**
 * Retrieves a workout draft
 */
export const getWorkoutDraft = async (
  workoutId: string | null,
  maxRetries = 5,
  retryInterval = 300
): Promise<any | null> => {
  if (!workoutId) {
    console.error("Cannot get workout draft: Missing workoutId");
    return null;
  }

  try {
    console.log(`Attempting to retrieve workout draft for ${workoutId}`);

    for (let i = 0; i <= maxRetries; i++) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Auth error or no user found:", authError);
        if (i === maxRetries) return null;
        console.log(`Retrying after auth error (attempt ${i + 1})`);
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
        console.error(`Error fetching draft (attempt ${i + 1}):`, error);
        if (i === maxRetries) return null;
        await new Promise(res => setTimeout(res, retryInterval));
      } else if (data) {
        const parsedData = safeParseDraftData(data.draft_data);
        const normalizedData = normalizeDraftData(parsedData);

        console.log(`Retrieved workout draft for ${workoutId}`, {
          exerciseStatesCount: Object.keys(normalizedData.exerciseStates || {}).length,
          updatedAt: data.updated_at
        });

        return {
          ...data,
          draft_data: normalizedData
        };
      } else {
        console.log(`No draft found for workout ${workoutId}`);
        return {
          draft_data: {
            exerciseStates: {},
            pendingSets: [],
            pendingCardio: [],
            pendingFlexibility: [],
            pendingRuns: []
          }
        };
      }
    }
  } catch (error) {
    console.error("Error retrieving workout draft:", error);
    return null;
  }

  return null;
};

/**
 * Deletes a workout draft
 */
export const deleteWorkoutDraft = async (
  workoutId: string | null
): Promise<boolean> => {
  if (!workoutId) {
    console.error("Cannot delete draft: Missing workoutId");
    return false;
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error or no user found:", authError);
      return false;
    }

    console.log(`Deleting workout draft for workout ${workoutId}`);

    const { error } = await supabase
      .from("workout_drafts")
      .delete()
      .eq("user_id", user.id)
      .eq("workout_id", workoutId);

    if (!error) {
      console.log(`Draft successfully deleted for workout ${workoutId}`);
    } else {
      console.error("Error deleting draft:", error);
    }

    return !error;
  } catch (error) {
    console.error("Exception deleting draft:", error);
    return false;
  }
};
