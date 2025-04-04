
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

// Default values when no run goals are found
export const defaultRunGoals = {
  miles_goal: 0,
  exercises_goal: 0,
  cardio_minutes_goal: 0,
};

/**
 * Get run goals for a specific user
 */
export const getUserRunGoals = async (userId: string): Promise<RunGoals> => {
  try {
    // Use type assertion to handle the table type issue
    const { data, error } = await supabase
      .from('run_goals' as any)
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      console.warn('Run goals not found, returning default');
      return {
        ...defaultRunGoals,
        id: '',
        user_id: userId,
        created_at: '',
        updated_at: ''
      };
    }
    
    // Create a new object with nullish coalescing for all properties
    return {
      id: data.id ?? '',
      user_id: data.user_id ?? userId,
      miles_goal: data.miles_goal ?? 0,
      exercises_goal: data.exercises_goal ?? 0,
      cardio_minutes_goal: data.cardio_minutes_goal ?? 0,
      created_at: data.created_at ?? '',
      updated_at: data.updated_at ?? ''
    };
  } catch (error) {
    console.error('Unexpected error fetching run goals:', error);
    return {
      ...defaultRunGoals,
      id: '',
      user_id: userId,
      created_at: '',
      updated_at: ''
    };
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
    
    if (result.error || !result.data) {
      console.error('Error setting run goals:', result.error);
      return { 
        success: false, 
        error: result.error 
      };
    }
    
    // Create a new object with nullish coalescing for each property
    return { 
      success: true, 
      data: {
        id: result.data.id ?? '',
        user_id: result.data.user_id ?? userId,
        miles_goal: result.data.miles_goal ?? 0,
        exercises_goal: result.data.exercises_goal ?? 0,
        cardio_minutes_goal: result.data.cardio_minutes_goal ?? 0,
        created_at: result.data.created_at ?? '',
        updated_at: result.data.updated_at ?? ''
      } 
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
    
    if (error || !data) {
      console.error('Error fetching run goals for multiple users:', error);
      return {};
    }
    
    // Create a map of user_id to run goals
    const goalsByUser: Record<string, RunGoals> = {};
    if (Array.isArray(data)) {
      data.forEach(goalItem => {
        // Skip if goalItem is null/undefined
        if (!goalItem) return;
        
        // Make sure all properties are accessed safely
        const userId = goalItem.user_id ?? '';
        
        // Only add to results if we have a valid user_id
        if (userId) {
          goalsByUser[userId] = {
            id: goalItem.id ?? '',
            user_id: userId,
            miles_goal: goalItem.miles_goal ?? 0,
            exercises_goal: goalItem.exercises_goal ?? 0,
            cardio_minutes_goal: goalItem.cardio_minutes_goal ?? 0,
            created_at: goalItem.created_at ?? '',
            updated_at: goalItem.updated_at ?? ''
          };
        }
      });
    }
    
    return goalsByUser;
  } catch (error) {
    console.error('Unexpected error fetching multiple run goals:', error);
    return {};
  }
};
