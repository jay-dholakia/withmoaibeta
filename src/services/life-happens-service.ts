
import { supabase } from "@/integrations/supabase/client";

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
