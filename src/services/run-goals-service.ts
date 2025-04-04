
import { supabase } from '@/integrations/supabase/client';

export interface RunGoals {
  id: string;
  user_id: string;
  miles_goal: number;
  exercises_goal: number; 
  cardio_minutes_goal: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get run goals for a specific user
 */
export const getUserRunGoals = async (userId: string): Promise<RunGoals | null> => {
  try {
    const { data, error } = await supabase
      .from('run_goals')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching run goals:', error);
      return null;
    }
    
    return data as RunGoals;
  } catch (error) {
    console.error('Unexpected error fetching run goals:', error);
    return null;
  }
};

/**
 * Set run goals for a specific user
 */
export const setUserRunGoals = async (
  userId: string, 
  goals: { 
    miles_goal?: number; 
    exercises_goal?: number; 
    cardio_minutes_goal?: number;
  }
): Promise<{ success: boolean; data?: RunGoals; error?: any }> => {
  try {
    // Check if user already has goals
    const { data: existingGoals } = await supabase
      .from('run_goals')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    let result;
    
    if (existingGoals) {
      // Update existing goals
      result = await supabase
        .from('run_goals')
        .update(goals)
        .eq('user_id', userId)
        .select()
        .single();
    } else {
      // Create new goals
      result = await supabase
        .from('run_goals')
        .insert({
          user_id: userId,
          ...goals
        })
        .select()
        .single();
    }
    
    if (result.error) {
      console.error('Error setting run goals:', result.error);
      return { 
        success: false, 
        error: result.error 
      };
    }
    
    return { 
      success: true, 
      data: result.data as RunGoals 
    };
  } catch (error) {
    console.error('Unexpected error setting run goals:', error);
    return { 
      success: false, 
      error 
    };
  }
};

/**
 * Get run goals for multiple users
 */
export const getMultipleUserRunGoals = async (userIds: string[]): Promise<Record<string, RunGoals>> => {
  try {
    const { data, error } = await supabase
      .from('run_goals')
      .select('*')
      .in('user_id', userIds);
    
    if (error) {
      console.error('Error fetching run goals for multiple users:', error);
      return {};
    }
    
    // Create a map of user_id to run goals
    const goalsByUser: Record<string, RunGoals> = {};
    if (data) {
      data.forEach(goals => {
        goalsByUser[goals.user_id] = goals as RunGoals;
      });
    }
    
    return goalsByUser;
  } catch (error) {
    console.error('Unexpected error fetching multiple run goals:', error);
    return {};
  }
};
