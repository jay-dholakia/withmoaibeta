
import { supabase } from "@/integrations/supabase/client";

export const logRunActivity = async (
  userId: string, 
  distance: number, 
  runType: 'steady' | 'tempo' | 'long' | 'speed' | 'hill', 
  notes?: string,
  completedAt: Date = new Date()
): Promise<{ success: boolean }> => {
  try {
    const { error } = await supabase
      .from('run_activities')
      .insert({
        user_id: userId,
        distance,
        run_type: runType,
        notes,
        completed_at: completedAt.toISOString()
      });
      
    if (error) {
      console.error('Error logging run activity:', error);
      return { success: false };
    }
    
    return { success: true };
  } catch (err) {
    console.error('Exception logging run activity:', err);
    return { success: false };
  }
};

export const logCardioActivity = async (
  userId: string,
  minutes: number,
  activityType: string,
  notes?: string,
  completedAt: Date = new Date()
): Promise<{ success: boolean }> => {
  try {
    const { error } = await supabase
      .from('cardio_activities')
      .insert({
        user_id: userId,
        minutes,
        activity_type: activityType,
        notes,
        completed_at: completedAt.toISOString()
      });
      
    if (error) {
      console.error('Error logging cardio activity:', error);
      return { success: false };
    }
    
    return { success: true };
  } catch (err) {
    console.error('Exception logging cardio activity:', err);
    return { success: false };
  }
};

export const getWeeklyRunProgress = async (userId: string) => {
  try {
    // Get start of the current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const startOfWeek = new Date(now);
    
    // Adjust to get Monday (start of week)
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get user's run activities for this week
    const { data: runActivities, error: runError } = await supabase
      .from('run_activities')
      .select('distance, run_type')
      .eq('user_id', userId)
      .gte('completed_at', startOfWeek.toISOString());
    
    if (runError) {
      console.error('Error fetching run activities:', runError);
      throw new Error('Failed to fetch run activities');
    }
    
    // Get user's cardio activities for this week
    const { data: cardioActivities, error: cardioError } = await supabase
      .from('cardio_activities')
      .select('minutes, activity_type')
      .eq('user_id', userId)
      .gte('completed_at', startOfWeek.toISOString());
    
    if (cardioError) {
      console.error('Error fetching cardio activities:', cardioError);
      throw new Error('Failed to fetch cardio activities');
    }
    
    // Get user's strength/mobility exercise completions for this week
    const { data: exerciseCompletions, error: exerciseError } = await supabase
      .from('workout_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('workout_type', 'strength')
      .gte('completed_at', startOfWeek.toISOString());
    
    if (exerciseError) {
      console.error('Error fetching exercise completions:', exerciseError);
      throw new Error('Failed to fetch exercise completions');
    }
    
    // Get user's goals
    const { data: userGoals, error: goalsError } = await supabase
      .from('run_goals')
      .select('miles_goal, exercises_goal, cardio_minutes_goal')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (goalsError) {
      console.error('Error fetching user goals:', goalsError);
      throw new Error('Failed to fetch user goals');
    }
    
    // Calculate total miles run
    const totalMiles = runActivities?.reduce((sum, activity) => sum + (activity.distance || 0), 0) || 0;
    
    // Count unique strength/mobility workouts
    const uniqueExerciseCount = exerciseCompletions?.length || 0;
    
    // Calculate total cardio minutes
    const totalCardioMinutes = cardioActivities?.reduce((sum, activity) => sum + (activity.minutes || 0), 0) || 0;
    
    // Return the progress data
    return {
      miles: {
        completed: parseFloat(totalMiles.toFixed(1)),
        goal: userGoals?.miles_goal || 0
      },
      exercises: {
        completed: uniqueExerciseCount,
        goal: userGoals?.exercises_goal || 0
      },
      cardio: {
        completed: totalCardioMinutes,
        goal: userGoals?.cardio_minutes_goal || 0
      }
    };
  } catch (error) {
    console.error('Error in getWeeklyRunProgress:', error);
    return {
      miles: { completed: 0, goal: 0 },
      exercises: { completed: 0, goal: 0 },
      cardio: { completed: 0, goal: 0 }
    };
  }
};

export const setUserRunGoals = async (
  userId: string,
  goals: {
    miles_goal?: number;
    exercises_goal?: number;
    cardio_minutes_goal?: number;
  }
): Promise<{ success: boolean }> => {
  try {
    // Check if the user already has goals set
    const { data: existingGoals, error: checkError } = await supabase
      .from('run_goals')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking existing goals:', checkError);
      return { success: false };
    }
    
    // If goals exist, update them; otherwise, insert new goals
    if (existingGoals) {
      const { error: updateError } = await supabase
        .from('run_goals')
        .update(goals)
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('Error updating user goals:', updateError);
        return { success: false };
      }
    } else {
      const { error: insertError } = await supabase
        .from('run_goals')
        .insert({
          user_id: userId,
          ...goals
        });
      
      if (insertError) {
        console.error('Error inserting user goals:', insertError);
        return { success: false };
      }
    }
    
    return { success: true };
  } catch (err) {
    console.error('Exception setting user run goals:', err);
    return { success: false };
  }
};
