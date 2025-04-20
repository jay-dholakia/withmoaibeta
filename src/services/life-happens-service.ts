
import { supabase } from "@/integrations/supabase/client";

export const MAX_MONTHLY_PASSES = 2;

export const createLifeHappensCompletion = async (
  userId: string,
  notes: string = ""
): Promise<string | null> => {
  try {
    console.log("Creating life happens completion for user:", userId);
    
    const now = new Date().toISOString();
    
    const insertData = {
      user_id: userId,
      workout_id: null,
      completed_at: now,
      notes: notes,
      life_happens_pass: true,
      title: "Life Happens Pass", 
      workout_type: "life_happens",
      description: null
    };
    
    console.log("Inserting workout completion data:", insertData);
    
    const { data, error } = await supabase
      .from('workout_completions')
      .insert(insertData)
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

export const getLifeHappensPassesUsed = async (userId: string): Promise<number> => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
  
  try {
    console.log("Checking life happens passes for user:", userId);
    console.log("Date range:", startOfMonth.toISOString(), "to", endOfMonth.toISOString());
    
    const { data, error } = await supabase
      .from('workout_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('life_happens_pass', true)
      .gte('completed_at', startOfMonth.toISOString())
      .lte('completed_at', endOfMonth.toISOString());
    
    if (error) {
      console.error("Error checking life happens passes:", error);
      throw error;
    }
    
    console.log("Life happens passes used this month:", data?.length || 0);
    return data?.length || 0;
  } catch (error) {
    console.error("Error checking life happens passes:", error);
    return 0;
  }
};

export const getRemainingPasses = async (userId: string): Promise<number> => {
  const usedPasses = await getLifeHappensPassesUsed(userId);
  return Math.max(0, MAX_MONTHLY_PASSES - usedPasses);
};

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
