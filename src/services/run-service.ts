
import { supabase } from "@/integrations/supabase/client";
import { RunGoals, RunActivity, CardioActivity, WeeklyRunProgress } from "@/types/workout";

// Fetch user's run goals
export const fetchRunGoals = async (userId: string): Promise<RunGoals | null> => {
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
    console.error('Exception in fetchRunGoals:', error);
    return null;
  }
};

// Create or update run goals
export const upsertRunGoals = async (goals: Partial<RunGoals>): Promise<boolean> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return false;
    }
    
    const goalData = {
      ...goals,
      user_id: goals.user_id || user.id,
      created_by: goals.created_by || user.id
    };
    
    const { error } = await supabase
      .from('run_goals')
      .upsert(goalData, { onConflict: 'user_id' });
    
    if (error) {
      console.error('Error upserting run goals:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception in upsertRunGoals:', error);
    return false;
  }
};

// Log a run activity
export const logRunActivity = async (activity: Omit<RunActivity, 'id' | 'created_at'>): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('run_activities')
      .insert(activity)
      .select('id')
      .single();
    
    if (error) {
      console.error('Error logging run activity:', error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error('Exception in logRunActivity:', error);
    return null;
  }
};

// Log a cardio activity
export const logCardioActivity = async (activity: Omit<CardioActivity, 'id' | 'created_at'>): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('cardio_activities')
      .insert(activity)
      .select('id')
      .single();
    
    if (error) {
      console.error('Error logging cardio activity:', error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error('Exception in logCardioActivity:', error);
    return null;
  }
};

// Fetch weekly run progress
export const fetchWeeklyRunProgress = async (userId: string): Promise<WeeklyRunProgress | null> => {
  try {
    const { data, error } = await supabase
      .rpc('get_weekly_run_progress', { user_id_param: userId });
    
    if (error) {
      console.error('Error fetching weekly run progress:', error);
      return null;
    }
    
    if (!data || data.length === 0) {
      return {
        miles_completed: 0,
        exercises_completed: 0,
        cardio_minutes_completed: 0
      };
    }
    
    return data[0] as WeeklyRunProgress;
  } catch (error) {
    console.error('Exception in fetchWeeklyRunProgress:', error);
    return null;
  }
};

// Fetch recent run activities
export const fetchRecentRunActivities = async (userId: string, limit = 5): Promise<RunActivity[]> => {
  try {
    const { data, error } = await supabase
      .from('run_activities')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching recent run activities:', error);
      return [];
    }
    
    return data as RunActivity[];
  } catch (error) {
    console.error('Exception in fetchRecentRunActivities:', error);
    return [];
  }
};

// Fetch recent cardio activities
export const fetchRecentCardioActivities = async (userId: string, limit = 5): Promise<CardioActivity[]> => {
  try {
    const { data, error } = await supabase
      .from('cardio_activities')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching recent cardio activities:', error);
      return [];
    }
    
    return data as CardioActivity[];
  } catch (error) {
    console.error('Exception in fetchRecentCardioActivities:', error);
    return [];
  }
};
