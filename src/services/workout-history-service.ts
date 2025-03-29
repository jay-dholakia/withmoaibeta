
import { fetchClientWorkoutHistory } from './client-workout-history-service';
import { fetchAssignedWorkouts } from './assigned-workouts-service';
import { supabase } from "@/integrations/supabase/client";
import { WorkoutExercise } from "@/types/workout";
import { startOfWeek, endOfWeek, isWithinInterval, format } from 'date-fns';

// Re-export workout history related functions
export {
  fetchClientWorkoutHistory,
  fetchAssignedWorkouts
};

/**
 * Creates multiple workout exercises in a single batch operation
 */
export const createMultipleWorkoutExercises = async (exercises: Array<Omit<WorkoutExercise, 'id' | 'created_at'>>): Promise<WorkoutExercise[]> => {
  const { data, error } = await supabase
    .from('workout_exercises')
    .insert(exercises)
    .select();

  if (error) {
    console.error('Error creating multiple workout exercises:', error);
    throw error;
  }

  return data as WorkoutExercise[];
};

/**
 * Creates multiple standalone workout exercises in a single batch operation
 */
export const createMultipleStandaloneWorkoutExercises = async (exercises: Array<Omit<WorkoutExercise, 'id' | 'created_at'>>): Promise<WorkoutExercise[]> => {
  const { data, error } = await supabase
    .from('standalone_workout_exercises')
    .insert(exercises)
    .select();

  if (error) {
    console.error('Error creating multiple standalone workout exercises:', error);
    throw error;
  }

  return data as WorkoutExercise[];
};

/**
 * Creates a one-off workout completion
 */
export const createOneOffWorkoutCompletion = async (params: {
  title: string;
  description?: string;
  notes?: string;
  rating?: number;
  workout_type?: string;
  distance?: string;
  duration?: string;
  location?: string;
}) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      throw new Error('User not authenticated');
    }
    
    // Create a standalone workout entry with workout type
    const { data: workoutData, error: workoutError } = await supabase
      .from('standalone_workouts')
      .insert({
        title: params.title,
        description: params.description || null,
        coach_id: user.user.id, // Using user_id as coach_id for one-off workouts created by the user
        workout_type: params.workout_type || 'one_off'
      })
      .select()
      .single();
      
    if (workoutError) throw workoutError;
    
    // Create the workout completion
    const { data, error } = await supabase
      .from('workout_completions')
      .insert({
        user_id: user.user.id,
        standalone_workout_id: workoutData.id, // Link to the standalone workout instead of regular workout
        workout_id: null, // Set workout_id to null for one-off workouts
        notes: params.notes || null,
        rating: params.rating || null,
        distance: params.distance || null,
        duration: params.duration || null,
        location: params.location || null
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error creating one-off workout completion:', error);
    throw error;
  }
};

/**
 * Log a rest day
 */
export const logRestDay = async (notes?: string) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      throw new Error('User not authenticated');
    }
    
    // Create the workout completion with rest_day flag
    const { data, error } = await supabase
      .from('workout_completions')
      .insert({
        user_id: user.user.id,
        workout_id: null, // Now this can be null since we modified the table
        notes: notes || "Taking a scheduled rest day",
        rest_day: true
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error logging rest day:', error);
    throw error;
  }
};

/**
 * Gets the total number of workouts assigned to a user in the current week
 */
export const getWeeklyAssignedWorkoutsCount = async (userId: string): Promise<number> => {
  try {
    if (!userId) {
      console.error('User not authenticated');
      return 0;
    }
    
    // Get the start and end of the current week (Monday as weekStartsOn: 1)
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    
    console.log(`[Debug] Checking workouts for week: ${format(weekStart, 'yyyy-MM-dd')} to ${format(weekEnd, 'yyyy-MM-dd')}`);
    
    // Fetch all assigned workouts
    const assignedWorkouts = await fetchAssignedWorkouts(userId);
    console.log(`[Debug] Total assigned workouts fetched: ${assignedWorkouts.length}`);
    
    if (assignedWorkouts.length === 0) {
      console.log(`[Debug] No assigned workouts found for user ${userId}`);
      return 0;
    }
    
    // Get workouts for this week based on day_of_week
    // Calculate the current week number relative to program start date
    const { data: programAssignments } = await supabase
      .from('program_assignments')
      .select('id, program_id, start_date')
      .eq('user_id', userId)
      .order('start_date', { ascending: false })
      .limit(1);
    
    let currentWeekNumber = 1;
    
    if (programAssignments && programAssignments.length > 0) {
      const startDate = new Date(programAssignments[0].start_date);
      // Calculate days difference between now and start date using Monday as week start
      const startOfProgramWeek = startOfWeek(startDate, { weekStartsOn: 1 });
      const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 });
      
      // Calculate difference in milliseconds, then convert to weeks
      const diffTime = Math.abs(startOfCurrentWeek.getTime() - startOfProgramWeek.getTime());
      const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
      
      currentWeekNumber = diffWeeks + 1; // 1-indexed week number
      console.log(`[Debug] Program started on ${format(startDate, 'yyyy-MM-dd')}, current week is ${currentWeekNumber}`);
    } else {
      console.log(`[Debug] No program assignments found, defaulting to week 1`);
    }
    
    // For SQL verification, log the current week number we're checking
    console.log(`[Debug] Looking for workouts with week_number = ${currentWeekNumber}`);
    
    // Filter workouts that belong to the current week
    const currentWeekWorkouts = assignedWorkouts.filter(workout => {
      // Check if the workout has a week and program
      if (workout.workout?.week?.week_number) {
        const matches = workout.workout.week.week_number === currentWeekNumber;
        console.log(`[Debug] Workout ${workout.id} (${workout.workout.title || 'Untitled'}): Week ${workout.workout.week.week_number}, Matches current week ${currentWeekNumber}: ${matches}`);
        return matches;
      }
      console.log(`[Debug] Workout ${workout.id}: Missing week or week number`);
      return false;
    });
    
    console.log(`[Debug] Found ${currentWeekWorkouts.length} workouts for week ${currentWeekNumber}`);
    
    if (currentWeekWorkouts.length === 0) {
      console.log(`[Debug] No workouts found for current week ${currentWeekNumber}. Detailed assigned workouts:`);
      assignedWorkouts.forEach((workout, index) => {
        console.log(`[Debug] Workout ${index + 1}:`, {
          id: workout.id,
          title: workout.workout?.title || 'Untitled',
          weekNumber: workout.workout?.week?.week_number,
          dayOfWeek: workout.workout?.day_of_week,
          program: workout.workout?.week?.program?.title || 'No Program'
        });
      });
      
      // Direct SQL query for verification
      const { data: sqlWorkouts, error } = await supabase.rpc(
        'count_workouts_for_user_and_week',
        { 
          user_id_param: userId,
          week_number_param: currentWeekNumber
        }
      );
      
      if (error) {
        console.error('[Debug] SQL verification error:', error);
      } else {
        console.log(`[Debug] SQL verification result: ${sqlWorkouts} workouts in week ${currentWeekNumber}`);
      }
    }
    
    return currentWeekWorkouts.length;
  } catch (error) {
    console.error('Error getting weekly assigned workouts count:', error);
    return 0;
  }
};

/**
 * Gets the total number of workouts assigned to a user for a specific week
 */
export const getAssignedWorkoutsCountForWeek = async (userId: string, weekNumber: number): Promise<number> => {
  try {
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    console.log(`Fetching workout count for user ${userId} in week ${weekNumber}`);
    
    // Fetch all assigned workouts
    const assignedWorkouts = await fetchAssignedWorkouts(userId);
    
    console.log(`Found ${assignedWorkouts.length} total assigned workouts`);
    
    // Filter workouts that belong to the specified week
    const weekWorkouts = assignedWorkouts.filter(workout => {
      // Check if the workout has a week and program
      if (workout.workout?.week?.week_number) {
        const matches = workout.workout.week.week_number === weekNumber;
        console.log(`Workout ${workout.workout.title}: week ${workout.workout.week.week_number}, matches week ${weekNumber}: ${matches}`);
        return matches;
      }
      console.log(`Workout ${workout.workout?.title || 'Unknown'}: No week number found`);
      return false;
    });
    
    console.log(`Found ${weekWorkouts.length} workouts for week ${weekNumber}`);
    
    return weekWorkouts.length || 0;
  } catch (error) {
    console.error(`Error getting assigned workouts count for week ${weekNumber}:`, error);
    return 0;
  }
};

/**
 * Gets user ID by email
 */
export const getUserIdByEmail = async (email: string): Promise<string | null> => {
  try {
    // Since we can't directly query auth.users with the client, we can:
    // 1. Use profiles table which should have 1-to-1 mapping with users
    // 2. Query for users that have the given email, if we have permission
    
    const { data: userData, error } = await supabase.rpc(
      'get_users_email',
      { user_ids: [] } // Empty array to check if we get any results at all
    );
    
    if (error) {
      console.error('Error checking user email lookup access:', error);
      // Fall back to manual client-side filtering of all users, which we might have access to
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id');
        
      if (!profiles || profiles.length === 0) {
        console.error('No profiles found, cannot look up user');
        return null;
      }
      
      // We have profiles, so try using the RPC function with all IDs
      const profileIds = profiles.map(profile => profile.id);
      const { data: users, error: rpcError } = await supabase.rpc(
        'get_users_email',
        { user_ids: profileIds }
      );
      
      if (rpcError) {
        console.error('Error using get_users_email with all profiles:', rpcError);
        return null;
      }
      
      if (!users || users.length === 0) {
        console.error('No users found in the response');
        return null;
      }
      
      const user = users.find(u => u.email === email);
      return user ? user.id : null;
    }
    
    // If we reach here, we have permission to call get_users_email
    // So we can try to query all users
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id');
      
    if (!allProfiles || allProfiles.length === 0) {
      console.error('No profiles found to look up user');
      return null;
    }
    
    const { data: allUsers, error: allUsersError } = await supabase.rpc(
      'get_users_email',
      { user_ids: allProfiles.map(p => p.id) }
    );
    
    if (allUsersError) {
      console.error('Error looking up all users:', allUsersError);
      return null;
    }
    
    const user = allUsers.find(u => u.email === email);
    return user ? user.id : null;
  } catch (error) {
    console.error('Error in getUserIdByEmail:', error);
    return null;
  }
};
