import { supabase } from '@/integrations/supabase/client';
import { WorkoutHistoryItem } from '@/types/workout';

/**
 * Gets the user ID for a given email address
 */
export const getUserIdByEmail = async (email: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();
    
    if (error) throw error;
    
    return data?.id || null;
  } catch (error) {
    console.error('Error getting user ID by email:', error);
    return null;
  }
};

/**
 * Gets the count of assigned workouts for a user in a specific week
 */
export const getAssignedWorkoutsCountForWeek = async (
  userId: string,
  weekNumber: number
): Promise<number> => {
  try {
    // This is a placeholder implementation
    // In a real app, you would query your database for the actual count
    // based on the user's assigned program and the week number
    return 5; // Assuming 5 workouts per week as a default
  } catch (error) {
    console.error('Error getting assigned workouts count:', error);
    return 0;
  }
};

/**
 * Gets information about how many workouts are assigned to a user for a specific week
 */
export const getWorkoutAssignmentInfoByEmail = async (
  email: string,
  weekNumber: number
): Promise<WorkoutAssignmentInfo> => {
  try {
    console.log(`Looking up workouts for ${email} in week ${weekNumber}`);
    
    // First, get the user ID from the email
    const userId = await getUserIdByEmail(email);
    
    if (!userId) {
      return {
        userId: null,
        email,
        weekNumber,
        workoutsCount: 0,
        error: 'User not found'
      };
    }
    
    console.log(`Found user ID: ${userId}`);
    
    // Then, get the workouts count for that user and week
    const workoutsCount = await getAssignedWorkoutsCountForWeek(userId, weekNumber);
    
    return {
      userId,
      email,
      weekNumber,
      workoutsCount
    };
  } catch (error) {
    console.error(`Error getting workout assignment info for ${email}:`, error);
    return {
      userId: null,
      email,
      weekNumber,
      workoutsCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

interface WorkoutAssignmentInfo {
  userId: string | null;
  email: string;
  weekNumber: number;
  workoutsCount: number;
  error?: string;
}

/**
 * Logs a rest day for the current user on the specified date
 */
export const logRestDay = async (date: Date = new Date()) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { error } = await supabase
      .from('workout_completions')
      .insert({
        user_id: user.id,
        completed_at: date.toISOString(),
        rest_day: true,
        notes: 'Rest day'
      });
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error logging rest day:', error);
    throw error;
  }
};

/**
 * Creates a one-off workout completion
 */
export const createOneOffWorkoutCompletion = async (workoutData: {
  title: string;
  description?: string;
  notes?: string;
  workout_type: string;
  completed_at: string;
  distance?: string;
  duration?: string;
  location?: string;
}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { error } = await supabase
      .from('workout_completions')
      .insert({
        user_id: user.id,
        completed_at: workoutData.completed_at,
        notes: workoutData.notes,
        title: workoutData.title,
        description: workoutData.description,
        workout_type: workoutData.workout_type,
        distance: workoutData.distance,
        duration: workoutData.duration,
        location: workoutData.location
      });
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error creating one-off workout completion:', error);
    throw error;
  }
};

/**
 * Fetches the workout history for a client
 */
export const fetchClientWorkoutHistory = async (userId: string): Promise<WorkoutHistoryItem[]> => {
  try {
    const { data, error } = await supabase
      .from('workout_completions')
      .select(`
        *,
        workout:workout_id (
          id,
          title,
          description,
          day_of_week,
          week_id,
          workout_type,
          week:week_id (
            week_number,
            program:program_id (
              id,
              title
            )
          )
        ),
        workout_set_completions (*)
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });
    
    if (error) throw error;
    
    return data as WorkoutHistoryItem[];
  } catch (error) {
    console.error('Error fetching client workout history:', error);
    return [];
  }
};
