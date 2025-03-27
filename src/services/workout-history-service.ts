
import { supabase } from "@/integrations/supabase/client";
import { WorkoutBasic, WorkoutHistoryItem } from "@/types/workout";

/**
 * Fetches assigned workouts for the current user, including both completed and pending workouts
 */
export const fetchAssignedWorkouts = async (userId: string): Promise<WorkoutHistoryItem[]> => {
  try {
    console.log("Fetching assigned workouts for user:", userId);
    
    // Get all workouts from the user's current program assignment
    const { data: programAssignments, error: programError } = await supabase
      .from('program_assignments')
      .select(`
        program_id,
        workout_programs:program_id (
          id,
          title,
          description,
          weeks
        )
      `)
      .eq('user_id', userId)
      .order('start_date', { ascending: false })
      .limit(1);
      
    if (programError) {
      console.error("Error fetching program assignments:", programError);
      return [];
    }
    
    if (!programAssignments || programAssignments.length === 0) {
      console.log("No program assignments found for user");
      return [];
    }
    
    const currentProgramId = programAssignments[0].program_id;
    console.log("Current program ID:", currentProgramId);
    
    // Fetch all workouts in the program
    const { data: programWorkouts, error: workoutsError } = await supabase
      .from('workouts')
      .select(`
        id,
        title,
        description,
        day_of_week,
        week_id,
        week:week_id (
          week_number,
          program_id
        ),
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
            category
          )
        )
      `)
      .eq('week.program_id', currentProgramId)
      .order('day_of_week', { ascending: true });
    
    if (workoutsError) {
      console.error("Error fetching program workouts:", workoutsError);
      return [];
    }
    
    if (!programWorkouts || programWorkouts.length === 0) {
      console.log("No workouts found in program");
      return [];
    }
    
    console.log(`Found ${programWorkouts.length} workouts in program`);
    
    // Create a map of workouts for quick lookup
    const workoutMap = new Map();
    programWorkouts.forEach(workout => {
      workoutMap.set(workout.id, workout);
    });
    
    // Get all workout completions for this user
    const { data: completions, error: completionsError } = await supabase
      .from('workout_completions')
      .select('id, workout_id, completed_at, notes, rating')
      .eq('user_id', userId)
      .is('life_happens_pass', false)
      .is('rest_day', false);
    
    if (completionsError) {
      console.error("Error fetching workout completions:", completionsError);
      // Continue with empty completions
    }
    
    // Create a map of completions by workout_id
    const completionsMap = new Map();
    if (completions) {
      completions.forEach(completion => {
        completionsMap.set(completion.workout_id, completion);
      });
    }
    
    // Combine workouts with completion status
    const result: WorkoutHistoryItem[] = programWorkouts.map(workout => {
      const completion = completionsMap.get(workout.id);
      
      return {
        id: completion ? completion.id : workout.id,
        workout_id: workout.id,
        completed_at: completion ? completion.completed_at : null,
        notes: completion ? completion.notes : null,
        rating: completion ? completion.rating : null,
        user_id: userId,
        workout: workout
      };
    });
    
    return result;
  } catch (error) {
    console.error("Error in fetchAssignedWorkouts:", error);
    return [];
  }
};

/**
 * Logs a rest day for the current user
 */
export const logRestDay = async (): Promise<boolean> => {
  try {
    // Get the current user ID
    const { data: authData } = await supabase.auth.getUser();
    if (!authData || !authData.user) {
      console.error("Cannot log rest day: Not authenticated");
      return false;
    }
    
    const userId = authData.user.id;
    
    // Insert a workout completion with rest_day=true
    const { data, error } = await supabase
      .from('workout_completions')
      .insert({
        user_id: userId,
        workout_id: null,
        rest_day: true,
        completed_at: new Date().toISOString()
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
