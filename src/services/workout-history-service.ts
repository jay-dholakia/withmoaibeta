
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

/**
 * Fetches assigned workouts for a client
 */
export const fetchAssignedWorkouts = async (userId: string): Promise<WorkoutHistoryItem[]> => {
  try {
    // Query for workouts assigned to this user through program assignments
    const { data: programAssignment, error: programError } = await supabase
      .from('program_assignments')
      .select('program_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (programError) {
      console.error('Error fetching program assignment:', programError);
      return [];
    }
    
    if (!programAssignment || programAssignment.length === 0) {
      return [];
    }
    
    const programId = programAssignment[0].program_id;
    
    // Get workouts for this program
    const { data: workoutWeeks, error: weeksError } = await supabase
      .from('workout_weeks')
      .select(`
        id,
        week_number,
        program_id,
        workouts (
          id,
          title,
          description,
          day_of_week,
          workout_type,
          week_id,
          workout_exercises (
            id,
            sets,
            reps,
            rest_seconds,
            notes,
            order_index,
            exercise:exercise_id (
              id,
              name,
              description,
              category,
              exercise_type
            )
          )
        )
      `)
      .eq('program_id', programId);
    
    if (weeksError) {
      console.error('Error fetching workout weeks:', weeksError);
      return [];
    }
    
    // Transform the data to match WorkoutHistoryItem structure
    const assignedWorkouts: WorkoutHistoryItem[] = [];
    
    // Create workout history items from the weeks and workouts
    workoutWeeks?.forEach(week => {
      week.workouts?.forEach(workout => {
        assignedWorkouts.push({
          id: workout.id,
          user_id: userId,
          workout_id: workout.id,
          completed_at: '', // Not completed yet
          workout: {
            id: workout.id,
            title: workout.title,
            description: workout.description,
            day_of_week: workout.day_of_week,
            week_id: workout.week_id,
            workout_type: workout.workout_type,
            workout_exercises: workout.workout_exercises,
            week: {
              week_number: week.week_number,
              program: {
                id: programId,
                title: 'Current Program' // We don't have this info in the current query
              }
            }
          }
        });
      });
    });
    
    return assignedWorkouts;
  } catch (error) {
    console.error('Error fetching assigned workouts:', error);
    return [];
  }
};

/**
 * Gets the count of assigned workouts for the current week
 */
export const getWeeklyAssignedWorkoutsCount = async (userId: string): Promise<number> => {
  try {
    const { data: programAssignment, error: programError } = await supabase
      .from('program_assignments')
      .select('program_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (programError) {
      console.error('Error fetching program assignment:', programError);
      return 6; // Default fallback
    }
    
    if (!programAssignment?.program_id) {
      return 6; // Default fallback if no program assigned
    }
    
    // Get current week number from program
    // This is simplified - in a real app you'd calculate current week
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id')
      .eq('week_id', programAssignment.program_id);
    
    if (workoutsError) {
      console.error('Error fetching workouts:', workoutsError);
      return 6; // Default fallback
    }
    
    const workoutCount = workouts?.length || 0;
    return workoutCount > 0 ? workoutCount : 6; // Return count or default
  } catch (error) {
    console.error('Error getting weekly assigned workouts count:', error);
    return 6; // Default fallback
  }
};

/**
 * Counts completed workouts for a specific week
 */
export const countCompletedWorkoutsForWeek = async (
  userId: string, 
  weekStartDate: Date
): Promise<number> => {
  try {
    // Calculate the end date (7 days after start date)
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 7);
    
    const { count, error } = await supabase
      .from('workout_completions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('completed_at', weekStartDate.toISOString())
      .lt('completed_at', weekEndDate.toISOString());
    
    if (error) throw error;
    
    return count || 0;
  } catch (error) {
    console.error('Error counting completed workouts for week:', error);
    return 0;
  }
};
