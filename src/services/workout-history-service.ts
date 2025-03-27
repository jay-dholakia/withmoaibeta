
import { supabase } from "@/integrations/supabase/client";
import { WorkoutBasic, WorkoutHistoryItem, WorkoutExercise, Exercise } from "@/types/workout";

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
          workout_id,
          exercise_id,
          sets,
          reps,
          rest_seconds,
          notes,
          order_index,
          created_at,
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
    const result = programWorkouts.map(workout => {
      const completion = completionsMap.get(workout.id);
      
      // Adapt exercise objects to match WorkoutExercise type
      const adaptedExercises: WorkoutExercise[] = workout.workout_exercises.map(ex => ({
        id: ex.id,
        workout_id: ex.workout_id,
        exercise_id: ex.exercise_id,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest_seconds,
        notes: ex.notes,
        order_index: ex.order_index,
        created_at: ex.created_at,
        exercise: ex.exercise ? {
          id: ex.exercise.id,
          name: ex.exercise.name,
          description: ex.exercise.description,
          category: ex.exercise.category,
          created_at: '' // Add missing property with empty string to satisfy type
        } : undefined,
        workout: undefined // Add missing property with undefined to satisfy type
      }));
      
      // Ensure that workout_exercises have all the required properties
      const adaptedWorkout: WorkoutBasic = {
        id: workout.id,
        title: workout.title,
        description: workout.description || undefined,
        day_of_week: workout.day_of_week,
        week_id: workout.week_id,
        week: workout.week ? {
          week_number: workout.week.week_number,
          program: workout.week.program_id ? {
            id: workout.week.program_id,
            title: 'Program' // Default value since we don't have this in the query
          } : undefined
        } : null,
        workout_exercises: adaptedExercises
      };
      
      const workoutHistoryItem: WorkoutHistoryItem = {
        id: completion ? completion.id : workout.id,
        workout_id: workout.id,
        completed_at: completion ? completion.completed_at : null,
        notes: completion ? completion.notes : null,
        rating: completion ? completion.rating : null,
        user_id: userId,
        workout: adaptedWorkout,
        life_happens_pass: false,
        rest_day: false
      };
      
      return workoutHistoryItem;
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

/**
 * Creates a one-off workout completion for a user
 */
export const createOneOffWorkoutCompletion = async (
  workoutData: {
    title: string;
    description?: string;
    notes?: string;
    rating?: number;
  }
): Promise<{ success: boolean; error?: string; id?: string }> => {
  try {
    // Get the current user ID
    const { data: authData } = await supabase.auth.getUser();
    if (!authData || !authData.user) {
      return { success: false, error: "User not authenticated" };
    }
    
    const userId = authData.user.id;
    
    // First check if custom_title column exists
    const { error: columnCheckError } = await supabase
      .from('workout_completions')
      .select('custom_title')
      .limit(1);
    
    if (columnCheckError && columnCheckError.message.includes("column 'custom_title' does not exist")) {
      console.log("custom_title column does not exist, using basic completion");
      
      // Insert a basic workout completion
      const { data, error } = await supabase
        .from('workout_completions')
        .insert({
          user_id: userId,
          workout_id: null,
          notes: workoutData.notes ? `${workoutData.title}: ${workoutData.notes}` : workoutData.title,
          rating: workoutData.rating || null,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error creating one-off workout:", error);
        return { success: false, error: error.message };
      }
      
      return { success: true, id: data.id };
    } else {
      // Insert a custom workout completion with title and description
      const { data, error } = await supabase
        .from('workout_completions')
        .insert({
          user_id: userId,
          workout_id: null,
          notes: workoutData.notes || null,
          rating: workoutData.rating || null,
          completed_at: new Date().toISOString(),
          custom_title: workoutData.title,
          custom_description: workoutData.description || null
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error creating one-off workout:", error);
        return { success: false, error: error.message };
      }
      
      return { success: true, id: data.id };
    }
  } catch (error) {
    console.error("Error in createOneOffWorkoutCompletion:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
};

/**
 * Fetches client workout history
 */
export const fetchClientWorkoutHistory = async (clientId: string): Promise<WorkoutHistoryItem[]> => {
  try {
    // First, get the basic completion data
    const { data: completions, error: completionsError } = await supabase
      .from('workout_completions')
      .select('id, completed_at, notes, rating, user_id, workout_id, life_happens_pass, rest_day')
      .eq('user_id', clientId)
      .order('completed_at', { ascending: false });
    
    if (completionsError) {
      console.error("Error fetching workout completions:", completionsError);
      throw completionsError;
    }
    
    if (!completions || completions.length === 0) {
      return [];
    }
    
    // Filter out any completions without a workout_id, these are custom or rest day workouts
    const workoutCompletions = completions.filter(c => c.workout_id !== null);
    
    // Create a set of unique workout IDs
    const workoutIds = [...new Set(workoutCompletions.map(c => c.workout_id).filter(id => id !== null))];
    
    // Create a map to store workout details
    const workoutMap = new Map<string, WorkoutBasic>();
    
    // If there are workout IDs to fetch
    if (workoutIds.length > 0) {
      // Fetch workout details separately
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select(`
          id, 
          title, 
          description, 
          day_of_week, 
          week_id,
          week:week_id (
            week_number,
            program:program_id (
              id,
              title
            )
          )
        `)
        .in('id', workoutIds);
      
      if (workoutsError) {
        console.error("Error fetching workouts:", workoutsError);
        throw workoutsError;
      }
      
      if (workouts) {
        // Create workout objects
        workouts.forEach(workout => {
          workoutMap.set(workout.id, {
            id: workout.id,
            title: workout.title,
            description: workout.description || undefined,
            day_of_week: workout.day_of_week,
            week_id: workout.week_id,
            week: workout.week ? {
              week_number: workout.week.week_number,
              program: workout.week.program ? {
                id: workout.week.program.id,
                title: workout.week.program.title
              } : undefined
            } : null
          });
        });
      }
    }
    
    // Combine the data
    return completions.map(completion => {
      const workoutDetails = completion.workout_id ? workoutMap.get(completion.workout_id) : null;
      
      // For custom workouts (one-off workouts or rest days)
      if (!workoutDetails) {
        // Create a basic default workout object
        const customWorkout: WorkoutBasic = {
          id: 'custom-' + completion.id,
          title: completion.notes || (completion.rest_day ? 'Rest Day' : 'Custom Workout'),
          description: undefined,
          day_of_week: new Date(completion.completed_at).getDay(),
          week_id: '',
          week: null
        };
        
        return {
          ...completion,
          workout: customWorkout
        };
      }
      
      return {
        ...completion,
        workout: workoutDetails
      };
    });
  } catch (error) {
    console.error("Error in fetchClientWorkoutHistory:", error);
    return [];
  }
};

/**
 * Gets the weekly assigned workouts count for a user
 */
export const getWeeklyAssignedWorkoutsCount = async (userId: string): Promise<number> => {
  try {
    // Get the current program assignment
    const { data: programAssignment, error: assignmentError } = await supabase
      .from('program_assignments')
      .select('program_id, start_date')
      .eq('user_id', userId)
      .order('start_date', { ascending: false })
      .limit(1);
      
    if (assignmentError || !programAssignment || programAssignment.length === 0) {
      console.error("Error fetching program assignment:", assignmentError);
      return 0;
    }
    
    const programId = programAssignment[0].program_id;
    
    // Calculate current week number based on start date
    const startDate = new Date(programAssignment[0].start_date);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const currentWeekNumber = Math.ceil(diffDays / 7);
    
    // Get assigned workouts for the current week
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id, week:week_id!inner(week_number, program_id)')
      .eq('week.program_id', programId)
      .eq('week.week_number', currentWeekNumber);
      
    if (workoutsError) {
      console.error("Error fetching workouts for week:", workoutsError);
      return 0;
    }
    
    return workouts?.length || 0;
  } catch (error) {
    console.error("Error in getWeeklyAssignedWorkoutsCount:", error);
    return 0;
  }
};

/**
 * Gets the user ID by email
 */
export const getUserIdByEmail = async (email: string): Promise<string | null> => {
  try {
    // Use the profiles table or another accessible table to get user ID
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();
    
    if (error) {
      console.error("Error fetching user ID by email:", error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error("Error in getUserIdByEmail:", error);
    return null;
  }
};

/**
 * Gets the assigned workouts count for a specific user and week
 */
export const getAssignedWorkoutsCountForWeek = async (userId: string, weekNumber: number): Promise<number> => {
  try {
    // Get the current program assignment
    const { data: programAssignment, error: assignmentError } = await supabase
      .from('program_assignments')
      .select('program_id')
      .eq('user_id', userId)
      .order('start_date', { ascending: false })
      .limit(1);
      
    if (assignmentError || !programAssignment || programAssignment.length === 0) {
      console.error("Error fetching program assignment:", assignmentError);
      return 0;
    }
    
    const programId = programAssignment[0].program_id;
    
    // Get assigned workouts for the specified week
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id, week:week_id!inner(week_number, program_id)')
      .eq('week.program_id', programId)
      .eq('week.week_number', weekNumber);
      
    if (workoutsError) {
      console.error("Error fetching workouts for week:", workoutsError);
      return 0;
    }
    
    return workouts?.length || 0;
  } catch (error) {
    console.error("Error in getAssignedWorkoutsCountForWeek:", error);
    return 0;
  }
};

/**
 * Creates multiple workout exercises for a standalone workout
 */
export const createMultipleStandaloneWorkoutExercises = async (
  workoutId: string,
  exercises: Array<{
    exercise_id: string;
    sets: number;
    reps: string;
    rest_seconds?: number;
    notes?: string;
    order_index: number;
  }>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('standalone_workout_exercises')
      .insert(
        exercises.map(exercise => ({
          workout_id: workoutId,
          exercise_id: exercise.exercise_id,
          sets: exercise.sets,
          reps: exercise.reps,
          rest_seconds: exercise.rest_seconds || null,
          notes: exercise.notes || null,
          order_index: exercise.order_index
        }))
      );
    
    if (error) {
      console.error('Error creating standalone workout exercises:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in createMultipleStandaloneWorkoutExercises:', error);
    return false;
  }
};

/**
 * Creates multiple workout exercises for a program workout
 */
export const createMultipleWorkoutExercises = async (
  workoutId: string,
  exercises: Array<{
    exercise_id: string;
    sets: number;
    reps: string;
    rest_seconds?: number;
    notes?: string;
    order_index: number;
  }>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_exercises')
      .insert(
        exercises.map(exercise => ({
          workout_id: workoutId,
          exercise_id: exercise.exercise_id,
          sets: exercise.sets,
          reps: exercise.reps,
          rest_seconds: exercise.rest_seconds || null,
          notes: exercise.notes || null,
          order_index: exercise.order_index
        }))
      );
    
    if (error) {
      console.error('Error creating workout exercises:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in createMultipleWorkoutExercises:', error);
    return false;
  }
};
