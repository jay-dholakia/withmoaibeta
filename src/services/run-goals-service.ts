
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
    // Use type assertion to handle the table type issue
    const { data, error } = await supabase
      .from('run_goals' as any)
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching run goals:', error);
      return null;
    }
    
    // Make sure we have a valid data object before returning it
    if (data && 
        typeof data === 'object' && 
        'id' in data && 
        'user_id' in data && 
        'miles_goal' in data && 
        'exercises_goal' in data && 
        'cardio_minutes_goal' in data) {
      return data as RunGoals;
    }
    
    return null;
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
      .from('run_goals' as any)
      .select('id')
      .eq('user_id', userId)
      .single();
    
    let result;
    
    if (existingGoals) {
      // Update existing goals
      result = await supabase
        .from('run_goals' as any)
        .update(goals as any)
        .eq('user_id', userId)
        .select()
        .single();
    } else {
      // Create new goals
      result = await supabase
        .from('run_goals' as any)
        .insert({
          user_id: userId,
          ...goals
        } as any)
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
    
    // Validate that result.data conforms to RunGoals structure
    if (result.data && 
        typeof result.data === 'object' && 
        'id' in result.data && 
        'user_id' in result.data) {
      return { 
        success: true, 
        data: result.data as RunGoals 
      };
    }
    
    return {
      success: false,
      error: 'Invalid data structure returned'
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
      .from('run_goals' as any)
      .select('*')
      .in('user_id', userIds);
    
    if (error) {
      console.error('Error fetching run goals for multiple users:', error);
      return {};
    }
    
    // Create a map of user_id to run goals
    const goalsByUser: Record<string, RunGoals> = {};
    if (data && Array.isArray(data)) {
      data.forEach(goalItem => {
        if (goalItem && 
            typeof goalItem === 'object' && 
            'user_id' in goalItem && 
            'miles_goal' in goalItem && 
            'exercises_goal' in goalItem && 
            'cardio_minutes_goal' in goalItem) {
          goalsByUser[(goalItem as any).user_id] = goalItem as RunGoals;
        }
      });
    }
    
    return goalsByUser;
  } catch (error) {
    console.error('Unexpected error fetching multiple run goals:', error);
    return {};
  }
};
