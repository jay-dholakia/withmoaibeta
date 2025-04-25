
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

    console.log(`Saving workout draft for workout ${workoutId}`, {
      dataSize: JSON.stringify(draftDataToStore).length,
      exerciseStatesCount: Object.keys(draftDataToStore.exerciseStates || {}).length,
      pendingSetsCount: (draftDataToStore.pendingSets || []).length
    });

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

    if (!error) {
      console.log(`Draft successfully saved to Supabase for workout ${workoutId}`);
      return true;
    } else {
      console.error("Error saving draft to Supabase:", error);
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
  oldExerciseId: string,
  newExerciseId: string
): Promise<boolean> => {
  if (!workoutId || !oldExerciseId || !newExerciseId) return false;

  try {
    console.log(`Updating exercise ID in draft for workout ${workoutId}`, {
      oldExerciseId,
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
    if (draftData.exerciseStates && draftData.exerciseStates[oldExerciseId]) {
      console.log(`Found exercise in draft states to update: ${oldExerciseId} → ${newExerciseId}`, {
        exerciseState: draftData.exerciseStates[oldExerciseId]
      });
      
      // Update the exercise_id field
      draftData.exerciseStates[oldExerciseId].exercise_id = newExerciseId;
      updated = true;
    }
    
    // Update references in pendingSets
    if (draftData.pendingSets && Array.isArray(draftData.pendingSets)) {
      const setsToUpdate = draftData.pendingSets.filter((set: any) => set.exerciseId === oldExerciseId);
      
      if (setsToUpdate.length > 0) {
        console.log(`Updating ${setsToUpdate.length} pending sets with new exercise ID`, {
          originalSets: setsToUpdate
        });
      }
      
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
      const cardioToUpdate = draftData.pendingCardio.filter((item: any) => item.exerciseId === oldExerciseId);
      
      if (cardioToUpdate.length > 0) {
        console.log(`Updating ${cardioToUpdate.length} pending cardio items with new exercise ID`, {
          originalItems: cardioToUpdate
        });
      }
      
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
      const flexToUpdate = draftData.pendingFlexibility.filter((item: any) => item.exerciseId === oldExerciseId);
      
      if (flexToUpdate.length > 0) {
        console.log(`Updating ${flexToUpdate.length} pending flexibility items with new exercise ID`, {
          originalItems: flexToUpdate
        });
      }
      
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
      const runsToUpdate = draftData.pendingRuns.filter((item: any) => item.exerciseId === oldExerciseId);
      
      if (runsToUpdate.length > 0) {
        console.log(`Updating ${runsToUpdate.length} pending runs with new exercise ID`, {
          originalItems: runsToUpdate
        });
      }
      
      draftData.pendingRuns = draftData.pendingRuns.map((item: any) => {
        if (item.exerciseId === oldExerciseId) {
          return { ...item, exerciseId: newExerciseId };
        }
        return item;
      });
      updated = true;
    }
    
    if (updated) {
      console.log("Saving draft with updated exercise IDs...");
      const saveResult = await saveWorkoutDraft(workoutId, 'workout', draftData);
      console.log("Draft save after exercise swap result:", saveResult ? "SUCCESS" : "FAILED");
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
          console.log(`Retrieved workout draft for ${workoutId}`);
          return {
            ...data,
            draft_data: safeParseDraftData(data.draft_data)
          };
        }
        return null;
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
  if (!workoutId) return false;

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return false;

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
