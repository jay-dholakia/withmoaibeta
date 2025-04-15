import { supabase } from "@/integrations/supabase/client";

/**
 * Parses draft data if it's a string
 */
const safeParseDraftData = (data: any): any => {
  if (typeof data === 'string') {
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
  try {
    // Skip if no workout ID
    if (!workoutId) {
      console.warn("No workout ID provided to saveWorkoutDraft");
      return false;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found in saveWorkoutDraft");
      return false;
    }
    
    // Convert data to string to accurately measure size
    const stringifiedData = JSON.stringify(draftData);
    const dataSize = stringifiedData.length;
    console.log(`Saving draft for workout ${workoutId}, size: ${dataSize} bytes, user: ${user.id}`);
    
    if (dataSize > 100000) {
      console.warn(`Draft data size is large: ${dataSize} bytes. Consider optimizing.`);
    }
    
    // Add log to verify the data being saved
    console.log("Saving workout draft with data:", draftData);
    
    // Store in sessionStorage for immediate access
    try {
      sessionStorage.setItem(`workout_draft_${workoutId}`, JSON.stringify({
        draft_data: draftData,
        workout_type: workoutType,
        updated_at: new Date().toISOString()
      }));
      console.log(`Successfully saved draft to sessionStorage for workout ${workoutId}`);
    } catch (e) {
      console.warn("Failed to save draft to sessionStorage:", e);
    }
    
    // MODIFIED: Changed approach to check first, then update or insert as appropriate
    // This avoids the need for an ON CONFLICT constraint in the database
    console.log(`Checking if draft exists for workout ${workoutId}`);
    
    // Check if a draft already exists for this user and workout
    const { data: existingDraft, error: queryError } = await supabase
      .from('workout_drafts')
      .select('id')
      .eq('user_id', user.id)
      .eq('workout_id', workoutId)
      .maybeSingle();
    
    if (queryError) {
      console.error("Error checking for existing workout draft:", {
        error: queryError,
        workoutId,
        userId: user.id,
        timestamp: new Date().toISOString()
      });
      return false;
    }
    
    // Log to debug
    console.log(`Existing draft check result:`, existingDraft);
    
    let result;
    
    if (existingDraft) {
      // Update existing draft
      console.log(`Updating existing draft for workout ${workoutId}`, existingDraft);
      const { error, data } = await supabase
        .from('workout_drafts')
        .update({ 
          draft_data: draftData,
          workout_type: workoutType,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingDraft.id)
        .select('id')
        .maybeSingle();
        
      if (error) {
        console.error("Error updating workout draft:", {
          error,
          workoutId,
          draftId: existingDraft.id,
          timestamp: new Date().toISOString()
        });
        return false;
      }
      
      console.log(`Successfully updated draft for workout ${workoutId}`, data);
      result = data;
    } else {
      // Create new draft
      console.log(`Creating new draft for workout ${workoutId}`);
      const { error, data } = await supabase
        .from('workout_drafts')
        .insert({
          user_id: user.id,
          workout_id: workoutId,
          workout_type: workoutType,
          draft_data: draftData,
          updated_at: new Date().toISOString()
        })
        .select('id')
        .maybeSingle();
        
      if (error) {
        console.error("Error creating workout draft:", {
          error,
          workoutId,
          userId: user.id,
          errorCode: error.code,
          errorMessage: error.message,
          timestamp: new Date().toISOString()
        });
        return false;
      }
      
      console.log(`Successfully created new draft for workout ${workoutId}`, data);
      result = data;
    }
    
    // Verify the data was saved
    if (result?.id) {
      console.log(`Draft save confirmed for workout ${workoutId} with ID ${result.id}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error in saveWorkoutDraft:", {
      error,
      workoutId,
      workoutType,
      timestamp: new Date().toISOString()
    });
    return false;
  }
};

/**
 * Fallback method for saving drafts - checks if draft exists first, then updates or inserts
 */
const fallbackDraftSave = async (
  workoutId: string,
  workoutType: string | null,
  draftData: any,
  userId: string
): Promise<boolean> => {
  try {
    // Check if a draft already exists for this workout
    const { data: existingDraft, error: queryError } = await supabase
      .from('workout_drafts')
      .select('id')
      .eq('user_id', userId)
      .eq('workout_id', workoutId)
      .maybeSingle();
      
    if (queryError) {
      console.error("Error checking for existing workout draft:", {
        error: queryError,
        workoutId,
        userId,
        timestamp: new Date().toISOString()
      });
      
      console.log("Unable to determine if draft exists; attempting direct insert");
      return await attemptInsertDraft(workoutId, workoutType, draftData, userId);
    }
      
    // Log to debug
    console.log(`Existing draft check result:`, existingDraft);
    
    if (existingDraft) {
      // Update existing draft
      const { error, data } = await supabase
        .from('workout_drafts')
        .update({ 
          draft_data: draftData,
          workout_type: workoutType,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingDraft.id)
        .select('id')
        .maybeSingle();
        
      if (error) {
        console.error("Error updating workout draft:", {
          error,
          workoutId,
          draftId: existingDraft.id,
          timestamp: new Date().toISOString()
        });
        
        // If update fails, try inserting a new record
        console.log("Update failed, attempting to insert new record instead");
        return await attemptInsertDraft(workoutId, workoutType, draftData, userId);
      } else {
        console.log(`Successfully updated draft for workout ${workoutId}`, data);
        return true;
      }
    } else {
      // No existing draft found, create new one
      return await attemptInsertDraft(workoutId, workoutType, draftData, userId);
    }
  } catch (error) {
    console.error("Error in fallbackDraftSave:", error);
    return false;
  }
};

/**
 * Helper function to attempt inserting a new draft record
 */
const attemptInsertDraft = async (
  workoutId: string,
  workoutType: string | null,
  draftData: any,
  userId: string
): Promise<boolean> => {
  try {
    console.log(`Attempting insert for draft of workout ${workoutId}, user: ${userId}`);
    const { error, data } = await supabase
      .from('workout_drafts')
      .insert({
        user_id: userId,
        workout_id: workoutId,
        workout_type: workoutType,
        draft_data: draftData,
        updated_at: new Date().toISOString()
      })
      .select('id')
      .maybeSingle();
      
    if (error) {
      console.error("Error creating workout draft:", {
        error,
        workoutId,
        userId,
        errorCode: error.code,
        errorMessage: error.message,
        timestamp: new Date().toISOString()
      });
      return false;
    } 
    
    console.log(`Successfully created new draft for workout ${workoutId}`, data);
    return !!data;
  } catch (error) {
    console.error("Error in attemptInsertDraft:", error);
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
  // Early return if no workoutId
  if (!workoutId) {
    console.log("No workout ID provided to getWorkoutDraft");
    return null;
  }
  
  // Look for cached draft first
  const cachedDraft = sessionStorage.getItem(`workout_draft_${workoutId}`);
  if (cachedDraft) {
    try {
      const parsedCache = JSON.parse(cachedDraft);
      console.log(`Using cached draft for workout ${workoutId}`);
      return parsedCache;
    } catch (error) {
      console.error("Error parsing cached draft:", error);
      // Continue to fetch from server if cache parsing fails
    }
  }
  
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      // Get current user session
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log(`No authenticated user found, retry ${retries + 1}/${maxRetries + 1}`);
        // If we've reached max retries, return null
        if (retries === maxRetries) {
          console.error("Max retries reached, no authenticated user found");
          return null;
        }
        // Otherwise, wait and retry
        retries++;
        await new Promise(resolve => setTimeout(resolve, retryInterval));
        continue;
      }
      
      console.log(`Fetching workout draft for workout ${workoutId} as user ${user.id}`);
      
      // Query for drafts by workoutId
      const { data, error } = await supabase
        .from('workout_drafts')
        .select('draft_data, workout_type, updated_at')
        .eq('user_id', user.id)
        .eq('workout_id', workoutId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (error) {
        console.error("Error retrieving workout draft:", {
          error,
          workoutId,
          userId: user.id,
          retry: retries,
        });
        
        if (retries === maxRetries) {
          return null;
        }
        
        retries++;
        await new Promise(resolve => setTimeout(resolve, retryInterval));
        continue;
      }
      
      console.log("Database query result:", data);
      
      if (data) {
        // Ensure draft data is properly parsed
        const parsedData = {
          ...data,
          draft_data: safeParseDraftData(data.draft_data)
        };
        
        const dataSize = JSON.stringify(parsedData.draft_data).length;
        console.log(`Successfully loaded draft data for ${workoutId}, size: ${dataSize} bytes`);
        
        // Log information about the draft content for debugging
        if (dataSize > 0) {
          const draftData = parsedData.draft_data;
          if (draftData && typeof draftData === 'object') {
            const keys = Object.keys(draftData);
            console.log(`Draft data contains keys: ${keys.join(', ')}`);
            
            // Check for exercise states
            if (draftData.exerciseStates && typeof draftData.exerciseStates === 'object') {
              const exerciseCount = Object.keys(draftData.exerciseStates).length;
              console.log(`Draft contains ${exerciseCount} exercise states`);
            }
            
            // Check for pending sets
            if (Array.isArray(draftData.pendingSets)) {
              console.log(`Draft contains ${draftData.pendingSets.length} pending sets`);
            }
          }
        }
        
        // Cache the draft in sessionStorage for faster access on reloads
        try {
          sessionStorage.setItem(`workout_draft_${workoutId}`, JSON.stringify(parsedData));
        } catch (e) {
          console.warn("Failed to cache draft in sessionStorage:", e);
        }
        
        return parsedData;
      } else {
        console.log(`No draft data found for workout ${workoutId}`);
      }
      
      return null;
    } catch (error) {
      console.error("Error in getWorkoutDraft:", {
        error,
        workoutId,
        retry: retries,
      });
      
      if (retries === maxRetries) {
        console.error(`Max retries (${maxRetries}) reached for getWorkoutDraft`);
        return null;
      }
      
      retries++;
      await new Promise(resolve => setTimeout(resolve, retryInterval));
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
  try {
    if (!workoutId) {
      console.warn("No workout ID provided to deleteWorkoutDraft");
      return false;
    }

    // Also clear from sessionStorage
    try {
      sessionStorage.removeItem(`workout_draft_${workoutId}`);
    } catch (e) {
      console.warn("Failed to remove draft from sessionStorage:", e);
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found in deleteWorkoutDraft");
      return false;
    }
    
    const { error } = await supabase
      .from('workout_drafts')
      .delete()
      .eq('user_id', user.id)
      .eq('workout_id', workoutId);
      
    if (error) {
      console.error("Error deleting workout draft:", {
        error,
        workoutId,
        userId: user.id,
      });
      return false;
    }
    
    console.log(`Successfully deleted draft for workout ${workoutId}`);
    return true;
  } catch (error) {
    console.error("Error in deleteWorkoutDraft:", {
      error,
      workoutId,
    });
    return false;
  }
};
