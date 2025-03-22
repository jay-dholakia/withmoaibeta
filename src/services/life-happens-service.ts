
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

// Maximum number of life happens passes per month
export const MAX_MONTHLY_PASSES = 2;

// Check how many life happens passes a user has used in the current month
export const getLifeHappensPassesUsed = async (userId: string): Promise<number> => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
  
  try {
    const { data, error } = await supabase
      .from('workout_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('life_happens_pass', true)
      .gte('completed_at', startOfMonth.toISOString())
      .lte('completed_at', endOfMonth.toISOString());
    
    if (error) throw error;
    
    return data?.length || 0;
  } catch (error) {
    console.error("Error checking life happens passes:", error);
    return 0;
  }
};

// Get remaining passes for the current month
export const getRemainingPasses = async (userId: string): Promise<number> => {
  const usedPasses = await getLifeHappensPassesUsed(userId);
  return Math.max(0, MAX_MONTHLY_PASSES - usedPasses);
};

// Find a dummy workout ID to use for life happens pass
// This helps us satisfy the non-null constraint on the workout_id column
const getFirstAvailableWorkoutId = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error("Error getting workout ID:", error);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.error("No workouts found in the database");
      return null;
    }
    
    return data[0]?.id || null;
  } catch (error) {
    console.error("Error getting workout ID:", error);
    return null;
  }
};

// Create a new workout completion with a life happens pass
export const createLifeHappensCompletion = async (
  userId: string,
  notes: string = "Life happens pass used"
): Promise<string | null> => {
  try {
    console.log("Creating life happens completion for user:", userId);
    
    // Get a workout ID to use (required by the database constraint)
    const workoutId = await getFirstAvailableWorkoutId();
    
    if (!workoutId) {
      console.error("Could not find a workout ID to use for life happens pass");
      return null;
    }
    
    console.log("Using workout ID:", workoutId);
    
    const now = new Date().toISOString();
    console.log("Timestamp for completion:", now);
    
    const { data, error } = await supabase
      .from('workout_completions')
      .insert({
        user_id: userId,
        workout_id: workoutId,
        completed_at: now,
        notes: notes,
        life_happens_pass: true
      })
      .select('id')
      .single();
    
    if (error) {
      console.error("Error creating life happens completion:", error);
      throw error;
    }
    
    console.log("Successfully created life happens completion with ID:", data?.id);
    return data?.id || null;
  } catch (error) {
    console.error("Error creating life happens completion:", error);
    return null;
  }
};

// Use a life happens pass for a workout
export const useLifeHappensPass = async (
  workoutCompletionId: string,
  notes: string = "Life happens pass used"
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_completions')
      .update({
        completed_at: new Date().toISOString(),
        notes: notes,
        life_happens_pass: true
      })
      .eq('id', workoutCompletionId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error using life happens pass:", error);
    return false;
  }
};
