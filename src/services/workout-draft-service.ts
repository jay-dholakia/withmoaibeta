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
  return data;
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
    
    const dataSize = JSON.stringify(draftData).length;
    console.log(`Saving draft for workout ${workoutId}, size: ${dataSize} bytes`);
    
    if (dataSize > 100000) {
      console.warn(`Draft data size is large: ${dataSize} bytes. Consider optimizing.`);
    }
    
    // Check if a draft already exists for this workout
    const { data: existingDraft, error: queryError } = await supabase
      .from('workout_drafts')
      .select('id')
      .eq('user_id', user.id)
      .eq('workout_id', workoutId || '')
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
      
    if (existingDraft) {
      // Update existing draft
      const { error } = await supabase
        .from('workout_drafts')
        .update({ 
          draft_data: draftData,
          workout_type: workoutType,
          updated_at: new Date().toISOString() // Convert to string to fix TypeScript error
        })
        .eq('id', existingDraft.id);
        
      if (error) {
        console.error("Error updating workout draft:", {
          error,
          workoutId,
          draftId: existingDraft.id,
          timestamp: new Date().toISOString()
        });
        return false;
      }
      
      console.log(`Successfully updated draft for workout ${workoutId}`);
    } else {
      // Create new draft
      const { error } = await supabase
        .from('workout_drafts')
        .insert({
          user_id: user.id,
          workout_id: workoutId,
          workout_type: workoutType,
          draft_data: draftData
        });
        
      if (error) {
        console.error("Error creating workout draft:", {
          error,
          workoutId,
          userId: user.id,
          timestamp: new Date().toISOString()
        });
        return false;
      }
      
      console.log(`Successfully created new draft for workout ${workoutId}`);
    }
    
    return true;
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
 * Retrieves a workout draft from the server with improved reliability and retry logic
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
  
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      // Use fresh user session on each retry attempt to handle auth state changes
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log(`No authenticated user found, retry ${retries + 1}/${maxRetries + 1}`);
        // If we've reached max retries, return null
        if (retries === maxRetries) {
          console.error("Max retries reached, no authenticated user found", {
            workoutId,
            maxRetries,
            timestamp: new Date().toISOString()
          });
          return null;
        }
        // Otherwise, wait and retry
        retries++;
        await new Promise(resolve => setTimeout(resolve, retryInterval));
        continue;
      }
      
      console.log(`User found (${user.id}), fetching workout draft for workout ${workoutId}`);
      
      // Enhanced query with better logging
      const { data, error } = await supabase
        .from('workout_drafts')
        .select('draft_data, workout_type, updated_at')
        .eq('user_id', user.id)
        .eq('workout_id', workoutId || '')
        .order('updated_at', { ascending: false })
        .maybeSingle();
        
      if (error) {
        console.error("Error retrieving workout draft:", {
          error,
          workoutId,
          userId: user.id,
          retry: retries,
          timestamp: new Date().toISOString()
        });
        
        // If we've reached max retries, return null
        if (retries === maxRetries) {
          return null;
        }
        
        // Otherwise, wait and retry
        retries++;
        await new Promise(resolve => setTimeout(resolve, retryInterval));
        continue;
      }
      
      if (data) {
        const parsedData = {
          ...data,
          draft_data: safeParseDraftData(data.draft_data)
        };
        
        const dataSize = parsedData.draft_data ? JSON.stringify(parsedData.draft_data).length : 0;
        console.log(`Successfully loaded draft data for ${workoutId}, size: ${dataSize} bytes`);
        
        // Don't stringify the entire object to the log, but provide better insights
        if (dataSize > 0) {
          const draftData = parsedData.draft_data;
          if (draftData && typeof draftData === 'object') {
            const keys = Object.keys(draftData);
            console.log(`Draft data contains keys: ${keys.join(', ')}`);
            
            // Check if we have exerciseStates and how many
            if (draftData.exerciseStates && typeof draftData.exerciseStates === 'object') {
              const exerciseCount = Object.keys(draftData.exerciseStates).length;
              console.log(`Draft contains ${exerciseCount} exercise states`);
            }
            
            // Check if we have pendingSets and how many
            if (Array.isArray(draftData.pendingSets)) {
              console.log(`Draft contains ${draftData.pendingSets.length} pending sets`);
            }
          } else {
            console.warn("Draft data is not an object, might need parsing:", typeof draftData);
          }
        }
        
        return parsedData;
      } else {
        console.log("No draft data found for workout:", workoutId);
      }
      
      return data;
    } catch (error) {
      console.error("Error in getWorkoutDraft:", {
        error,
        workoutId,
        retry: retries,
        timestamp: new Date().toISOString()
      });
      
      // If we've reached max retries, return null
      if (retries === maxRetries) {
        console.error(`Max retries (${maxRetries}) reached for getWorkoutDraft`);
        return null;
      }
      
      // Otherwise, wait and retry
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

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found in deleteWorkoutDraft");
      return false;
    }
    
    const { error } = await supabase
      .from('workout_drafts')
      .delete()
      .eq('user_id', user.id)
      .eq('workout_id', workoutId || '');
      
    if (error) {
      console.error("Error deleting workout draft:", {
        error,
        workoutId,
        userId: user.id,
        timestamp: new Date().toISOString()
      });
      return false;
    }
    
    console.log(`Successfully deleted draft for workout ${workoutId}`);
    return true;
  } catch (error) {
    console.error("Error in deleteWorkoutDraft:", {
      error,
      workoutId,
      timestamp: new Date().toISOString()
    });
    return false;
  }
};
