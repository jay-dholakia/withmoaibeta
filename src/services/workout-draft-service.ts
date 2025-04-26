
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
    const { data, error } = await supabase.from("workout_drafts").select("count(*)", { count: "exact", head: true });
    if (error) {
      console.error("Supabase connection error:", error);
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
    // Verify connection before attempting save
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
      timestamp: new Date().toISOString()
    });

    // First check if a draft already exists for this workout
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
          draft_data: draftDataToStore,
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
          draft_data: draftDataToStore,
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
 * Used when swapping exercises to maintain user progress
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
    
    // Update exercise_id in exerciseStates
    if (draftData.exerciseStates && draftData.exerciseStates[workoutExerciseId]) {
      const originalExerciseId = draftData.exerciseStates[workoutExerciseId].exercise_id;
      
      console.log(`Found exercise in draft states to update: ${workoutExerciseId}`, {
        originalExerciseId,
        newExerciseId,
        exerciseState: draftData.exerciseStates[workoutExerciseId]
      });
      
      // Add swap tracking data - this helps us identify swapped exercises
      draftData.exerciseStates[workoutExerciseId].swapData = {
        timestamp: new Date().toISOString(),
        originalExerciseId: originalExerciseId || null,
        replacementExerciseId: newExerciseId
      };
      
      // Update the exercise_id field
      draftData.exerciseStates[workoutExerciseId].exercise_id = newExerciseId;
      
      updated = true;
    } else {
      console.error(`Exercise ${workoutExerciseId} not found in draft states`, {
        availableExerciseIds: Object.keys(draftData.exerciseStates || {})
      });
    }
    
    // Update references in pendingSets
    if (draftData.pendingSets && Array.isArray(draftData.pendingSets)) {
      const setsToUpdate = draftData.pendingSets.filter((set: any) => set.exerciseId === workoutExerciseId);
      
      if (setsToUpdate.length > 0) {
        console.log(`Updating ${setsToUpdate.length} pending sets with new exercise ID`, {
          originalSets: setsToUpdate,
          workoutExerciseId,
          newExerciseId
        });
      }
      
      draftData.pendingSets = draftData.pendingSets.map((set: any) => {
        if (set.exerciseId === workoutExerciseId) {
          return { ...set, exerciseId: workoutExerciseId };
        }
        return set;
      });
      updated = true;
    }
    
    // Update references in pendingCardio
    if (draftData.pendingCardio && Array.isArray(draftData.pendingCardio)) {
      const cardioToUpdate = draftData.pendingCardio.filter((item: any) => item.exerciseId === workoutExerciseId);
      
      if (cardioToUpdate.length > 0) {
        console.log(`Updating ${cardioToUpdate.length} pending cardio items with new exercise ID`, {
          originalItems: cardioToUpdate,
          workoutExerciseId,
          newExerciseId
        });
      }
      
      draftData.pendingCardio = draftData.pendingCardio.map((item: any) => {
        if (item.exerciseId === workoutExerciseId) {
          return { ...item, exerciseId: workoutExerciseId };
        }
        return item;
      });
      updated = true;
    }
    
    // Update references in pendingFlexibility
    if (draftData.pendingFlexibility && Array.isArray(draftData.pendingFlexibility)) {
      const flexToUpdate = draftData.pendingFlexibility.filter((item: any) => item.exerciseId === workoutExerciseId);
      
      if (flexToUpdate.length > 0) {
        console.log(`Updating ${flexToUpdate.length} pending flexibility items with new exercise ID`, {
          originalItems: flexToUpdate,
          workoutExerciseId,
          newExerciseId
        });
      }
      
      draftData.pendingFlexibility = draftData.pendingFlexibility.map((item: any) => {
        if (item.exerciseId === workoutExerciseId) {
          return { ...item, exerciseId: workoutExerciseId };
        }
        return item;
      });
      updated = true;
    }
    
    // Update references in pendingRuns
    if (draftData.pendingRuns && Array.isArray(draftData.pendingRuns)) {
      const runsToUpdate = draftData.pendingRuns.filter((item: any) => item.exerciseId === workoutExerciseId);
      
      if (runsToUpdate.length > 0) {
        console.log(`Updating ${runsToUpdate.length} pending runs with new exercise ID`, {
          originalItems: runsToUpdate,
          workoutExerciseId,
          newExerciseId
        });
      }
      
      draftData.pendingRuns = draftData.pendingRuns.map((item: any) => {
        if (item.exerciseId === workoutExerciseId) {
          return { ...item, exerciseId: workoutExerciseId };
        }
        return item;
      });
      updated = true;
    }
    
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

      console.log(`Fetching draft for workout ${workoutId}, user ${user.id}`);
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
          
          // Ensure draft_data is properly parsed
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
 * Deletes a workout draft from the server
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
