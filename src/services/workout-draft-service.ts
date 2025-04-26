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

    console.log(`Saving workout draft for workout ${workoutId}`, {
      userId: user.id,
      workoutType: workoutTypeValue,
      dataSize: JSON.stringify(draftDataToStore).length,
      timestamp: new Date().toISOString(),
      exerciseStates: Object.keys(draftDataToStore.exerciseStates || {}).length
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
          draft_data: JSON.stringify(draftDataToStore),
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
          draft_data: JSON.stringify(draftDataToStore),
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
        newExerciseId,
        exerciseState: draftData.exerciseStates[workoutExerciseId]
      });

      draftData.exerciseStates[workoutExerciseId].swapData = {
        timestamp: new Date().toISOString(),
        originalExerciseId: originalExerciseId || null,
        replacementExerciseId: newExerciseId
      };

      draftData.exerciseStates[workoutExerciseId].exercise_id = newExerciseId;
      updated = true;
    } else {
      console.error(`Exercise ${workoutExerciseId} not found in draft states`, {
        availableExerciseIds: Object.keys(draftData.exerciseStates || {})
      });
    }

    const updatePending = (pendingKey: string) => {
      if (draftData[pendingKey] && Array.isArray(draftData[pendingKey])) {
        const itemsToUpdate = draftData[pendingKey].filter((item: any) => item.exerciseId === workoutExerciseId);

        if (itemsToUpdate.length > 0) {
          console.log(`Updating ${itemsToUpdate.length} items in ${pendingKey}`, {
            originalItems: itemsToUpdate
          });
        }

        draftData[pendingKey] = draftData[pendingKey].map((item: any) => {
          if (item.exerciseId === workoutExerciseId) {
            return { ...item, exerciseId: workoutExerciseId };
          }
          return item;
        });
        updated = true;
      }
    };

    updatePending('pendingSets');
    updatePending('pendingCardio');
    updatePending('pendingFlexibility');
    updatePending('pendingRuns');

    if (updated) {
      console.log("Saving draft with updated exercise IDs...", {
        workoutExerciseId,
        newExerciseId,
        draftData: {
          exerciseStates: Object.keys(draftData.exerciseStates || {}).map(id => ({
            id,
            exercise_id: draftData.exerciseStates[id].exercise_id,
            swapData: draftData.exerciseStates[id].swapData
          }))
        }
      });

      const saveResult = await saveWorkoutDraft(workoutId, 'workout', draftData);
      console.log("Draft save after exercise swap result:", saveResult ? "SUCCESS" : "FAILED", {
        workoutId,
        workoutExerciseId,
        newExerciseId
      });
      return saveResult;
    }

    console.log("No changes needed to draft data for exercise swap");
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
      } else {
        if (data) {
          console.log(`Retrieved workout draft for ${workoutId}`, {
            exerciseStatesCount: Object.keys(safeParseDraftData(data.draft_data).exerciseStates || {}).length,
            updatedAt: data.updated_at
          });

          const parsedData = safeParseDraftData(data.draft_data);

          return {
            ...data,
            draft_data: parsedData
          };
        } else {
          console.log(`No draft found for workout ${workoutId}`);
          return null;
        }
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
