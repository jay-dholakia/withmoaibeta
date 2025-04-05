
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

export interface ProgramWeekGoals {
  week_number: number;
  miles_goal: number;
  exercises_goal: number;
  cardio_minutes_goal: number;
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
    const { data, error } = await supabase
      .from('run_goals')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

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

    // Type assertion to ensure TypeScript recognizes the properties
    const typedData = data as unknown as {
      id: string;
      user_id: string;
      miles_goal: number;
      exercises_goal: number;
      cardio_minutes_goal: number;
      created_at: string;
      updated_at: string;
    };

    return {
      id: typedData.id || '',
      user_id: typedData.user_id || userId,
      miles_goal: typedData.miles_goal || 0,
      exercises_goal: typedData.exercises_goal || 0,
      cardio_minutes_goal: typedData.cardio_minutes_goal || 0,
      created_at: typedData.created_at || '',
      updated_at: typedData.updated_at || ''
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
      .maybeSingle();

    let result;

    if (existingGoals) {
      // Update existing goals
      result = await supabase
        .from('run_goals')
        .update(goals)
        .eq('user_id', userId)
        .select();
    } else {
      // Insert new goals
      result = await supabase
        .from('run_goals')
        .insert({
          user_id: userId,
          ...goals
        })
        .select();
    }

    if (result.error || !result.data || result.data.length === 0) {
      console.error('Error setting run goals:', result.error);
      return { 
        success: false, 
        error: result.error ?? 'Unknown error' 
      };
    }

    const resultData = result.data[0] as unknown as RunGoals;
    
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
      if (goalItem && typeof goalItem === 'object') {
        const typedGoalItem = goalItem as unknown as {
          id?: string;
          user_id?: string;
          miles_goal?: number;
          exercises_goal?: number;
          cardio_minutes_goal?: number;
          created_at?: string;
          updated_at?: string;
        };
        
        const userId = typedGoalItem.user_id || '';
        
        if (userId) {
          goalsByUser[userId] = {
            id: typedGoalItem.id || '',
            user_id: userId,
            miles_goal: typedGoalItem.miles_goal || 0,
            exercises_goal: typedGoalItem.exercises_goal || 0,
            cardio_minutes_goal: typedGoalItem.cardio_minutes_goal || 0,
            created_at: typedGoalItem.created_at || '',
            updated_at: typedGoalItem.updated_at || ''
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
 * Get program week goals for a specific program
 */
export const getProgramWeekGoals = async (programId: string): Promise<ProgramWeekGoals[]> => {
  try {
    const { data, error } = await supabase
      .from('program_week_goals')
      .select('*')
      .eq('program_id', programId)
      .order('week_number', { ascending: true });

    if (error || !data) {
      console.warn('Program week goals not found, returning empty array');
      return [];
    }

    return data.map(weekGoal => ({
      week_number: weekGoal.week_number,
      miles_goal: weekGoal.miles_goal || 0,
      exercises_goal: weekGoal.exercises_goal || 0,
      cardio_minutes_goal: weekGoal.cardio_minutes_goal || 0
    }));
  } catch (error) {
    console.error('Unexpected error fetching program week goals:', error);
    return [];
  }
};

/**
 * Set program week goals
 */
export const setProgramWeekGoals = async (
  programId: string,
  weekGoals: ProgramWeekGoals[]
): Promise<{ success: boolean; error?: any }> => {
  try {
    // Delete existing goals for this program
    await supabase
      .from('program_week_goals')
      .delete()
      .eq('program_id', programId);
    
    // Insert new goals
    if (weekGoals.length > 0) {
      const goalsToInsert = weekGoals.map(goal => ({
        program_id: programId,
        week_number: goal.week_number,
        miles_goal: goal.miles_goal,
        exercises_goal: goal.exercises_goal,
        cardio_minutes_goal: goal.cardio_minutes_goal
      }));

      const { error } = await supabase
        .from('program_week_goals')
        .insert(goalsToInsert);

      if (error) {
        console.error('Error setting program week goals:', error);
        return { success: false, error };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error setting program week goals:', error);
    return { success: false, error };
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
