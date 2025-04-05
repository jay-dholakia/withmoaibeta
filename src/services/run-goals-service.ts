
import { supabase } from "@/integrations/supabase/client";
import { RunProgressData } from '@/components/client/RunGoalsProgressCard';

export const logRunActivity = async (
  userId: string, 
  distance: number, 
  runType: 'steady' | 'tempo' | 'long' | 'speed' | 'hill',
  notes?: string
) => {
  try {
    const { data, error } = await supabase
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

    return { success: true, data };
  } catch (err) {
    console.error('Error in logRunActivity:', err);
    return { success: false, error: err };
  }
};

export const logCardioActivity = async (
  userId: string, 
  minutes: number, 
  activityType: string,
  notes?: string
) => {
  try {
    const { data, error } = await supabase
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

    return { success: true, data };
  } catch (err) {
    console.error('Error in logCardioActivity:', err);
    return { success: false, error: err };
  }
};

export const getWeeklyRunProgress = async (userId: string): Promise<RunProgressData> => {
  try {
    console.log('Getting weekly run progress for user:', userId);
    
    // First, try to get the user's goals
    const { data: goalsData, error: goalsError } = await supabase
      .from('run_goals')
      .select('miles_goal, exercises_goal, cardio_minutes_goal')
      .eq('user_id', userId)
      .single();
    
    if (goalsError && goalsError.code !== 'PGRST116') {
      console.error('Error fetching run goals:', goalsError);
    }
    
    // Get the start of the current week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    
    // Format the dates for database query
    const startISO = startOfWeek.toISOString();
    const endISO = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59).toISOString();
    
    console.log(`Fetching progress for week: ${startISO} to ${endISO}`);
    
    // Get the total miles run this week
    const { data: runData, error: runError } = await supabase
      .from('run_activities')
      .select('distance')
      .eq('user_id', userId)
      .gte('completed_at', startISO)
      .lte('completed_at', endISO);
    
    if (runError) {
      console.error('Error fetching run activities:', runError);
    }
    
    // Calculate total miles
    const totalMiles = runData?.reduce((sum, run) => sum + (run.distance || 0), 0) || 0;
    console.log(`Total miles: ${totalMiles}`);
    
    // Get the total cardio minutes this week
    const { data: cardioData, error: cardioError } = await supabase
      .from('cardio_activities')
      .select('minutes')
      .eq('user_id', userId)
      .gte('completed_at', startISO)
      .lte('completed_at', endISO);
    
    if (cardioError) {
      console.error('Error fetching cardio activities:', cardioError);
    }
    
    // Calculate total cardio minutes
    const totalCardioMinutes = cardioData?.reduce((sum, cardio) => sum + (cardio.minutes || 0), 0) || 0;
    console.log(`Total cardio minutes: ${totalCardioMinutes}`);
    
    // Get completed workout count for strength/mobility exercises
    const { data: workoutCompletions, error: workoutError } = await supabase
      .from('workout_completions')
      .select('id, workout_type')
      .eq('user_id', userId)
      .gte('completed_at', startISO)
      .lte('completed_at', endISO)
      .not('completed_at', 'is', null);
    
    if (workoutError) {
      console.error('Error fetching workout completions:', workoutError);
    }
    
    // Count the number of strength/mobility workouts
    const strengthMobilityWorkouts = workoutCompletions?.filter(wc => 
      wc.workout_type === 'strength' || 
      wc.workout_type === 'bodyweight' || 
      wc.workout_type === 'flexibility' || 
      wc.workout_type === 'mobility'
    ).length || 0;
    
    console.log(`Total strength/mobility workouts: ${strengthMobilityWorkouts}`);

    // Use default goals if none are set for the user
    const milesGoal = goalsData?.miles_goal || 10;
    const exercisesGoal = goalsData?.exercises_goal || 2;
    const cardioGoal = goalsData?.cardio_minutes_goal || 60;
    
    return {
      miles: {
        completed: totalMiles,
        goal: milesGoal
      },
      exercises: {
        completed: strengthMobilityWorkouts,
        goal: exercisesGoal
      },
      cardio: {
        completed: totalCardioMinutes,
        goal: cardioGoal
      }
    };
  } catch (err) {
    console.error('Error in getWeeklyRunProgress:', err);
    // Return default empty data
    return {
      miles: { completed: 0, goal: 10 },
      exercises: { completed: 0, goal: 2 },
      cardio: { completed: 0, goal: 60 }
    };
  }
};

export const setUserRunGoals = async (userId: string, goals: {
  miles_goal?: number;
  exercises_goal?: number;
  cardio_minutes_goal?: number;
}) => {
  try {
    const { data, error } = await supabase
      .from('run_goals')
      .upsert({
        user_id: userId,
        miles_goal: goals.miles_goal,
        exercises_goal: goals.exercises_goal,
        cardio_minutes_goal: goals.cardio_minutes_goal,
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('Error setting run goals:', error);
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error('Error in setUserRunGoals:', err);
    throw err;
  }
};
