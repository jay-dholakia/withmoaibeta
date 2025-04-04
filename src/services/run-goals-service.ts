
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
    // Use type assertion to tell TypeScript that this is a valid table
    const { data, error } = await supabase
      .from('run_goals')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.warn('Run goals not found, returning default');
      return {
        id: '',
        user_id: userId,
        ...defaultRunGoals,
        created_at: '',
        updated_at: ''
      };
    }

    // Use type assertions to ensure TypeScript doesn't complain
    return {
      id: (data as any).id ?? '',
      user_id: (data as any).user_id ?? userId,
      miles_goal: (data as any).miles_goal ?? 0,
      exercises_goal: (data as any).exercises_goal ?? 0,
      cardio_minutes_goal: (data as any).cardio_minutes_goal ?? 0,
      created_at: (data as any).created_at ?? '',
      updated_at: (data as any).updated_at ?? ''
    };
  } catch (error) {
    console.error('Unexpected error fetching run goals:', error);
    return {
      id: '',
      user_id: userId,
      ...defaultRunGoals,
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
    const { data: existingGoals } = await supabase
      .from('run_goals')
      .select('id')
      .eq('user_id', userId)
      .single();

    let result;

    if (existingGoals) {
      result = await supabase
        .from('run_goals')
        .update(goals)
        .eq('user_id', userId)
        .select()
        .single();
    } else {
      result = await supabase
        .from('run_goals')
        .insert({
          user_id: userId,
          ...goals
        })
        .select()
        .single();
    }

    if (result.error || !result.data) {
      console.error('Error setting run goals:', result.error);
      return { 
        success: false, 
        error: result.error ?? 'Unknown error' 
      };
    }

    // Use type assertions for the result data
    const resultData = result.data as any;
    
    return { 
      success: true, 
      data: {
        id: resultData.id ?? '',
        user_id: resultData.user_id ?? userId,
        miles_goal: resultData.miles_goal ?? 0,
        exercises_goal: resultData.exercises_goal ?? 0,
        cardio_minutes_goal: resultData.cardio_minutes_goal ?? 0,
        created_at: resultData.created_at ?? '',
        updated_at: resultData.updated_at ?? ''
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
      .from('run_goals')
      .select('*')
      .in('user_id', userIds);

    if (error || !data) {
      console.error('Error fetching run goals for multiple users:', error);
      return {};
    }

    const goalsByUser: Record<string, RunGoals> = {};

    data.forEach(goalItem => {
      if (
        goalItem &&
        typeof goalItem === 'object'
      ) {
        // Use type assertion for goal item
        const typedGoalItem = goalItem as any;
        const userId = typedGoalItem.user_id ?? '';
        
        if (userId) {
          goalsByUser[userId] = {
            id: typedGoalItem.id ?? '',
            user_id: userId,
            miles_goal: typedGoalItem.miles_goal ?? 0,
            exercises_goal: typedGoalItem.exercises_goal ?? 0,
            cardio_minutes_goal: typedGoalItem.cardio_minutes_goal ?? 0,
            created_at: typedGoalItem.created_at ?? '',
            updated_at: typedGoalItem.updated_at ?? ''
          };
        }
      }
    });

    return goalsByUser;
  } catch (error) {
    console.error('Unexpected error fetching multiple run goals:', error);
    return {};
  }
};

/**
 * Log a run activity for a user
 */
export const logRunActivity = async (
  userId: string,
  distance: number,
  runType: 'steady' | 'tempo' | 'long' | 'speed' | 'hill',
  notes?: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error } = await supabase
      .from('run_activities')
      .insert({
        user_id: userId,
        distance,
        run_type: runType,
        notes,
        completed_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging run activity:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error logging run activity:', error);
    return { success: false, error };
  }
};

/**
 * Log a cardio activity for a user
 */
export const logCardioActivity = async (
  userId: string,
  minutes: number,
  activityType: string,
  notes?: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error } = await supabase
      .from('cardio_activities')
      .insert({
        user_id: userId,
        minutes,
        activity_type: activityType,
        notes,
        completed_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging cardio activity:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error logging cardio activity:', error);
    return { success: false, error };
  }
};
