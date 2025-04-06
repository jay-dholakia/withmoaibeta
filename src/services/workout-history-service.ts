import { supabase } from "@/integrations/supabase/client";
import { WorkoutHistoryItem } from "@/types/workout";
import { getWeekDateRange } from './workout-week-service';

/**
 * Fetches all workout completions for a user
 */
export const fetchAllWorkoutCompletions = async (userId: string): Promise<WorkoutHistoryItem[]> => {
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
          week:week_id (
            program:program_id (*),
            week_number
          ),
          workout_exercises (
            *,
            exercise:exercise_id (*)
          ),
          workout_type
        )
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error("Error fetching workout completions:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchAllWorkoutCompletions:", error);
    return [];
  }
};

/**
 * Fetches all assigned workouts for a user
 */
export const fetchAssignedWorkouts = async (userId: string): Promise<WorkoutHistoryItem[]> => {
  try {
    const { data, error } = await supabase
      .from('workout_assignments')
      .select(`
        id,
        assigned_by,
        assigned_at,
        workout:workout_id (
          id,
          title,
          description,
          day_of_week,
          week_id,
          week:week_id (
            program:program_id (*),
            week_number
          ),
          workout_exercises (
            *,
            exercise:exercise_id (*)
          ),
          workout_type
        ),
        workout_completions (
          completed_at,
          notes,
          rest_day
        )
      `)
      .eq('user_id', userId)
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error("Error fetching assigned workouts:", error);
      return [];
    }

    // Transform the data to match the WorkoutHistoryItem structure
    const assignedWorkouts: WorkoutHistoryItem[] = data.map(assignment => {
      const completion = assignment.workout_completions[0] || {};
      return {
        id: assignment.id,
        workout_id: assignment.workout_id,
        user_id: assignment.user_id,
        assigned_by: assignment.assigned_by,
        assigned_at: assignment.assigned_at,
        completed_at: completion.completed_at || null,
        notes: completion.notes || null,
        rest_day: completion.rest_day || false,
        workout: assignment.workout
      };
    });

    return assignedWorkouts;
  } catch (error) {
    console.error("Error in fetchAssignedWorkouts:", error);
    return [];
  }
};

/**
 * Gets the user ID from the email
 */
export const getUserIdByEmail = async (email: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (error) {
      console.error("Error fetching user ID by email:", error);
      return null;
    }

    return data ? data.id : null;
  } catch (error) {
    console.error("Error in getUserIdByEmail:", error);
    return null;
  }
};

/**
 * Gets the number of assigned workouts for a specific week
 */
export const getAssignedWorkoutsCountForWeek = async (userId: string, weekNumber: number): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('workout_assignments')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('week_number', weekNumber);

    if (error) {
      console.error("Error fetching assigned workouts count for week:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Error in getAssignedWorkoutsCountForWeek:", error);
    return 0;
  }
};

/**
 * Logs a rest day for the user
 */
export const logRestDay = async (date: Date): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found when logging rest day");
      return false;
    }
    
    const formattedDate = date.toISOString();
    
    const { error } = await supabase
      .from('workout_completions')
      .insert({
        user_id: user.id,
        rest_day: true,
        completed_at: formattedDate,
        notes: "Rest Day"
      });
      
    if (error) {
      console.error("Error logging rest day:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in logRestDay:", error);
    return false;
  }
};

/**
 * Gets workouts for a specific week based on program start date
 */
export const getWorkoutsForWeek = async (
  userId: string, 
  programStartDate: string,
  weekNumber: number
): Promise<WorkoutHistoryItem[]> => {
  try {
    if (!userId || !programStartDate) {
      console.error("Missing required parameters:", { userId, programStartDate, weekNumber });
      return [];
    }
    
    const { start, end } = getWeekDateRange(programStartDate, weekNumber);
    
    const startDate = start.toISOString();
    const endDate = end.toISOString();
    
    console.log(`Fetching workouts for week ${weekNumber}: ${startDate} to ${endDate}`);
    
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
          week:week_id (
            program:program_id (*),
            week_number
          ),
          workout_exercises (
            *,
            exercise:exercise_id (*)
          ),
          workout_type
        )
      `)
      .eq('user_id', userId)
      .gte('completed_at', startDate)
      .lte('completed_at', endDate)
      .order('completed_at', { ascending: false });
      
    if (error) {
      console.error(`Error fetching workouts for week ${weekNumber}:`, error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error(`Error in getWorkoutsForWeek:`, error);
    return [];
  }
};
