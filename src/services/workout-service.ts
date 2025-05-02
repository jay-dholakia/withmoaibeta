import { supabase } from '@/integrations/supabase/client';
import { Exercise, Workout, WorkoutProgram, WorkoutWeek } from '@/types/workout';

/**
 * Fetches all clients
 */
export const fetchAllClients = async () => {
  try {
    // First, get all client users
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_type')
      .eq('user_type', 'client');

    if (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }

    // Get emails for these clients
    const userIds = data.map(client => client.id);
    const { data: emailData, error: emailError } = await supabase.rpc('get_users_email', {
      user_ids: userIds
    });

    if (emailError) {
      console.error('Error fetching client emails:', emailError);
    }

    // Get client profiles data
    const { data: profilesData, error: profilesError } = await supabase
      .from('client_profiles')
      .select('id, first_name, last_name')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching client profile data:', profilesError);
    }

    // Merge all data together
    const clientsWithEmail = data.map(client => {
      const emailInfo = emailData?.find(e => e.id === client.id);
      const profileData = profilesData?.find(p => p.id === client.id) || { first_name: null, last_name: null };
      
      return {
        id: client.id,
        email: emailInfo?.email || 'No email',
        user_type: client.user_type,
        first_name: profileData.first_name || null,
        last_name: profileData.last_name || null
      };
    });

    return clientsWithEmail;
  } catch (error) {
    console.error('Error in fetchAllClients:', error);
    throw error;
  }
};

/**
 * Assigns a program to a user
 */
export const assignProgramToUser = async (data: {
  program_id: string;
  user_id: string;
  assigned_by: string;
  start_date: string;
  end_date: string | null;
}) => {
  try {
    const { data: result, error } = await supabase
      .from('program_assignments')
      .insert([data])
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return result;
  } catch (error) {
    console.error('Error assigning program to user:', error);
    throw error;
  }
};

/**
 * Fetches assigned users for a program
 */
export const fetchAssignedUsers = async (programId: string) => {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .select(`
        id,
        user_id,
        program_id,
        start_date,
        end_date
      `)
      .eq('program_id', programId)
      .order('start_date', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching assigned users:', error);
    throw error;
  }
};

/**
 * Deletes a program assignment
 */
export const deleteProgramAssignment = async (assignmentId: string) => {
  try {
    const { error } = await supabase
      .from('program_assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting program assignment:', error);
    throw error;
  }
};

/**
 * Fetches workout programs
 */
export const fetchWorkoutPrograms = async (coachId?: string, fetchAllPrograms: boolean = false) => {
  try {
    let query = supabase
      .from('workout_programs')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Only filter by coach ID if fetchAllPrograms is false
    if (coachId && !fetchAllPrograms) {
      query = query.eq('coach_id', coachId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout programs:', error);
    throw error;
  }
};

/**
 * Fetches a specific workout program
 */
export const fetchWorkoutProgram = async (programId: string) => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('id', programId)
      .maybeSingle();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching workout program:', error);
    throw error;
  }
};

/**
 * Creates a workout program
 */
export const createWorkoutProgram = async (programData: {
  title: string;
  description?: string | null;
  coach_id: string;
  program_type: string;
  weeks: number;
}) => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .insert([programData])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating workout program:', error);
    throw error;
  }
};

/**
 * Updates a workout program
 */
export const updateWorkoutProgram = async (programId: string, programData: {
  title?: string;
  description?: string | null;
  program_type?: string;
  weeks?: number;
}) => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .update(programData)
      .eq('id', programId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating workout program:', error);
    throw error;
  }
};

/**
 * Deletes a workout program
 */
export const deleteWorkoutProgram = async (programId: string) => {
  try {
    const { error } = await supabase
      .from('workout_programs')
      .delete()
      .eq('id', programId);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting workout program:', error);
    throw error;
  }
};

/**
 * Fetches workout weeks for a program
 */
export const fetchWorkoutWeeks = async (programId: string) => {
  try {
    const { data, error } = await supabase
      .from('workout_weeks')
      .select('*')
      .eq('program_id', programId)
      .order('week_number', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout weeks:', error);
    throw error;
  }
};

/**
 * Fetches a specific workout week
 */
export const fetchWorkoutWeek = async (weekId: string) => {
  try {
    const { data, error } = await supabase
      .from('workout_weeks')
      .select('*')
      .eq('id', weekId)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching workout week:', error);
    throw error;
  }
};

/**
 * Creates a workout week
 */
export const createWorkoutWeek = async (weekData: {
  program_id: string;
  week_number: number;
  title: string;
  description?: string | null;
}) => {
  try {
    const { data, error } = await supabase
      .from('workout_weeks')
      .insert([weekData])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating workout week:', error);
    throw error;
  }
};

/**
 * Updates a workout week
 */
export const updateWorkoutWeek = async (weekId: string, weekData: {
  title?: string;
  description?: string | null;
  target_miles_run?: number;
  target_cardio_minutes?: number;
  target_strength_workouts?: number;
  target_strength_mobility_workouts?: number;
}) => {
  try {
    const { data, error } = await supabase
      .from('workout_weeks')
      .update(weekData)
      .eq('id', weekId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating workout week:', error);
    throw error;
  }
};

/**
 * Fetches workouts for a specific week
 */
export const fetchWorkoutsForWeek = async (weekId: string) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('week_id', weekId)
      .order('priority', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workouts for week:', error);
    throw error;
  }
};

/**
 * Fetches all workouts for a program
 */
export const fetchWorkouts = async (weekId: string) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('week_id', weekId)
      .order('priority', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workouts:', error);
    throw error;
  }
};

/**
 * Fetches a specific workout
 */
export const fetchWorkout = async (workoutId: string) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .single();
    
    if (error) {
      console.error('Error fetching workout:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching workout:', error);
    throw error;
  }
};

/**
 * Creates a workout
 */
export const createWorkout = async (data: {
  week_id: string;
  title: string;
  description?: string | null;
  workout_type?: "strength" | "cardio" | "flexibility" | "mobility";
  priority?: number;
}): Promise<Workout> => {
  try {
    const { data: createdWorkout, error } = await supabase
      .from('workouts')
      .insert({
        week_id: data.week_id,
        title: data.title,
        description: data.description || null,
        workout_type: data.workout_type,
        priority: data.priority || 0
      })
      .select('*')
      .single();
      
    if (error) throw error;
    
    return createdWorkout;
  } catch (error) {
    console.error('Error creating workout:', error);
    throw error;
  }
};

/**
 * Creates a workout from a template
 */
export const createWorkoutFromTemplate = async (workoutData: {
  week_id: string;
  priority?: number;
  template_id: string;
}) => {
  try {
    // First fetch the template details
    const { data: template, error: templateError } = await supabase
      .from('standalone_workouts')
      .select('*')
      .eq('id', workoutData.template_id)
      .single();
    
    if (templateError) {
      throw templateError;
    }
    
    // Map template workout_type to a valid workout_type for the workout table
    let workoutType: 'cardio' | 'strength' | 'mobility' | 'flexibility' = 'strength';
    
    if (template.workout_type === 'cardio') {
      workoutType = 'cardio';
    } else if (template.workout_type === 'mobility' || template.workout_type === 'flexibility') {
      workoutType = template.workout_type;
    }
    
    // Create the workout with template reference
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .insert({
        week_id: workoutData.week_id,
        title: template.title,
        description: template.description,
        workout_type: workoutType,
        priority: workoutData.priority || 0,
        template_id: workoutData.template_id
      })
      .select()
      .single();
    
    if (workoutError) {
      throw workoutError;
    }
    
    // Get template exercises
    const { data: templateExercises, error: exercisesError } = await supabase
      .from('standalone_workout_exercises')
      .select('*')
      .eq('workout_id', template.id)
      .order('order_index', { ascending: true });
    
    if (exercisesError) {
      throw exercisesError;
    }
    
    if (templateExercises && templateExercises.length > 0) {
      // Create workout exercises from template
      const workoutExercises = templateExercises.map((ex, index) => ({
        workout_id: workout.id,
        exercise_id: ex.exercise_id,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest_seconds,
        notes: ex.notes,
        order_index: index,
        superset_group_id: ex.superset_group_id,
        superset_order: ex.superset_order
      }));
      
      const { error: insertError } = await supabase
        .from('workout_exercises')
        .insert(workoutExercises);
      
      if (insertError) {
        throw insertError;
      }
    }
    
    return workout;
  } catch (error) {
    console.error('Error creating workout from template:', error);
    throw error;
  }
};

/**
 * Updates a workout
 */
export const updateWorkout = async (
  workoutId: string,
  data: {
    title?: string;
    description?: string | null;
    workout_type?: "strength" | "cardio" | "flexibility" | "mobility";
    priority?: number;
  }
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('workouts')
      .update({
        title: data.title,
        description: data.description,
        workout_type: data.workout_type,
        priority: data.priority
      })
      .eq('id', workoutId);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error updating workout:', error);
    throw error;
  }
};

/**
 * Fetches exercises for a specific workout
 */
export const fetchWorkoutExercises = async (workoutId: string) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select(`
        *,
        exercise:exercise_id(*)
      `)
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises:', error);
    throw error;
  }
};

/**
 * Creates a workout exercise
 */
export const createWorkoutExercise = async (exerciseData: {
  workout_id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  rest_seconds?: number;
  notes?: string;
  order_index: number;
}) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .insert([exerciseData])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating workout exercise:', error);
    throw error;
  }
};

/**
 * Updates a workout exercise
 */
export const updateWorkoutExercise = async (exerciseId: string, exerciseData: {
  sets?: number;
  reps?: string;
  rest_seconds?: number;
  notes?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .update(exerciseData)
      .eq('id', exerciseId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating workout exercise:', error);
    throw error;
  }
};

/**
 * Deletes a workout exercise
 */
export const deleteWorkoutExercise = async (exerciseId: string) => {
  try {
    const { error } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('id', exerciseId);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting workout exercise:', error);
    throw error;
  }
};

/**
 * Moves a workout exercise up in order
 */
export const moveWorkoutExerciseUp = async (exerciseId: string, workoutId: string) => {
  try {
    console.log("Service: Moving exercise up", { exerciseId, workoutId });
    
    // First, get all exercises for the workout to find the current exercise and its position
    const { data: exercises, error: exerciseError } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });
    
    if (exerciseError || !exercises || exercises.length === 0) {
      console.error("Error fetching exercises:", exerciseError);
      throw new Error("Could not fetch exercises");
    }
    
    // Find the current exercise
    const currentExercise = exercises.find(ex => ex.id === exerciseId);
    if (!currentExercise) {
      throw new Error("Could not find current exercise in the list");
    }
    
    const currentIndex = exercises.findIndex(ex => ex.id === exerciseId);
    
    // If it's already at the top (index 0), do nothing
    if (currentIndex === 0) {
      console.log("Exercise already at the top, cannot move up further");
      return exercises;
    }
    
    // Find the exercise above it in the sorted list
    const aboveExercise = exercises[currentIndex - 1];
    
    // Swap their order_index values
    const currentOrderIndex = currentExercise.order_index;
    const aboveOrderIndex = aboveExercise.order_index;
    
    // Update the current exercise's order_index
    const { error: updateCurrentError } = await supabase
      .from('workout_exercises')
      .update({ order_index: aboveOrderIndex })
      .eq('id', exerciseId);
    
    if (updateCurrentError) {
      console.error("Error updating current exercise:", updateCurrentError);
      throw new Error("Failed to update current exercise");
    }
    
    // Update the above exercise's order_index
    const { error: updateAboveError } = await supabase
      .from('workout_exercises')
      .update({ order_index: currentOrderIndex })
      .eq('id', aboveExercise.id);
    
    if (updateAboveError) {
      console.error("Error updating exercise above:", updateAboveError);
      throw new Error("Failed to update exercise above");
    }
    
    // Get updated exercises
    const { data: updatedExercises, error: fetchError } = await supabase
      .from('workout_exercises')
      .select(`
        *,
        exercise:exercise_id(*)
      `)
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });
      
    if (fetchError) {
      console.error("Error fetching updated exercises:", fetchError);
      throw new Error("Failed to fetch updated exercises");
    }
    
    console.log("Successfully moved exercise up");
    return updatedExercises || [];
  } catch (error) {
    console.error("Error in moveWorkoutExerciseUp:", error);
    throw error;
  }
};

/**
 * Moves a workout exercise down in order
 */
export const moveWorkoutExerciseDown = async (exerciseId: string, workoutId: string) => {
  try {
    console.log("Service: Moving exercise down", { exerciseId, workoutId });
    
    // Get all exercises for the workout to find the current exercise and its position
    const { data: exercises, error: exerciseError } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });
    
    if (exerciseError || !exercises || exercises.length === 0) {
      console.error("Error fetching exercises:", exerciseError);
      throw new Error("Could not fetch exercises");
    }
    
    // Find the current exercise in the sorted array
    const currentIndex = exercises.findIndex(ex => ex.id === exerciseId);
    if (currentIndex === -1) {
      throw new Error("Could not find current exercise in the list");
    }
    
    // If it's already at the bottom, do nothing
    if (currentIndex === exercises.length - 1) {
      console.log("Exercise already at the bottom, cannot move down further");
      return exercises;
    }
    
    // Get the current exercise and the one below it
    const currentExercise = exercises[currentIndex];
    const belowExercise = exercises[currentIndex + 1];
    
    // Swap their order_index values
    const currentOrderIndex = currentExercise.order_index;
    const belowOrderIndex = belowExercise.order_index;
    
    // Update the current exercise's order_index
    const { error: updateCurrentError } = await supabase
      .from('workout_exercises')
      .update({ order_index: belowOrderIndex })
      .eq('id', exerciseId);
    
    if (updateCurrentError) {
      console.error("Error updating current exercise:", updateCurrentError);
      throw new Error("Failed to update current exercise");
    }
    
    // Update the below exercise's order_index
    const { error: updateBelowError } = await supabase
      .from('workout_exercises')
      .update({ order_index: currentOrderIndex })
      .eq('id', belowExercise.id);
    
    if (updateBelowError) {
      console.error("Error updating exercise below:", updateBelowError);
      throw new Error("Failed to update exercise below");
    }
    
    // Get updated exercises
    const { data: updatedExercises, error: fetchError } = await supabase
      .from('workout_exercises')
      .select(`
        *,
        exercise:exercise_id(*)
      `)
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });
      
    if (fetchError) {
      console.error("Error fetching updated exercises:", fetchError);
      throw new Error("Failed to fetch updated exercises");
    }
    
    console.log("Successfully moved exercise down");
    return updatedExercises || [];
  } catch (error) {
    console.error("Error in moveWorkoutExerciseDown:", error);
    throw error;
  }
};

/**
 * Fetches standalone workouts
 */
export const fetchStandaloneWorkouts = async (coachId?: string) => {
  try {
    let query = supabase
      .from('standalone_workouts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (coachId) {
      query = query.eq('coach_id', coachId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching standalone workouts:', error);
    throw error;
  }
};

/**
 * Fetches a specific standalone workout
 */
export const fetchStandaloneWorkout = async (workoutId: string) => {
  try {
    const { data, error } = await supabase
      .from('standalone_workouts')
      .select(`
        *,
        workout_exercises:standalone_workout_exercises(
          *,
          exercise:exercise_id(*)
        )
      `)
      .eq('id', workoutId)
      .maybeSingle();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching standalone workout:', error);
    throw error;
  }
};

/**
 * Creates a standalone workout
 */
export const createStandaloneWorkout = async (workoutData: {
  title: string;
  description?: string | null;
  coach_id: string;
  category?: string;
  workout_type?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('standalone_workouts')
      .insert([workoutData])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating standalone workout:', error);
    throw error;
  }
};

/**
 * Updates a standalone workout
 */
export const updateStandaloneWorkout = async (workoutId: string, workoutData: {
  title?: string;
  description?: string | null;
  category?: string | null;
  workout_type?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('standalone_workouts')
      .update(workoutData)
      .eq('id', workoutId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating standalone workout:', error);
    throw error;
  }
};

/**
 * Deletes a standalone workout
 */
export const deleteStandaloneWorkout = async (workoutId: string) => {
  try {
    const { error } = await supabase
      .from('standalone_workouts')
      .delete()
      .eq('id', workoutId);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting standalone workout:', error);
    throw error;
  }
};

/**
 * Fetches exercises for a specific standalone workout
 */
export const fetchStandaloneWorkoutExercises = async (workoutId: string) => {
  try {
    const { data, error } = await supabase
      .from('standalone_workout_exercises')
      .select(`
        *,
        exercise:exercise_id(*)
      `)
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching standalone workout exercises:', error);
    throw error;
  }
};

/**
 * Creates a standalone workout exercise
 */
export const createStandaloneWorkoutExercise = async (exerciseData: {
  workout_id: string;
  exercise_id: string;
  sets?: number;
  reps?: string;
  rest_seconds?: number;
  notes?: string;
  order_index: number;
}) => {
  try {
    const { data, error } = await supabase
      .from('standalone_workout_exercises')
      .insert([exerciseData])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating standalone workout exercise:', error);
    throw error;
  }
};

/**
 * Updates a standalone workout exercise
 */
export const updateStandaloneWorkoutExercise = async (exerciseId: string, exerciseData: {
  sets?: number;
  reps?: string;
  rest_seconds?: number;
  notes?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('standalone_workout_exercises')
      .update(exerciseData)
      .eq('id', exerciseId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating standalone workout exercise:', error);
    throw error;
  }
};

/**
 * Deletes a standalone workout exercise
 */
export const deleteStandaloneWorkoutExercise = async (exerciseId: string) => {
  try {
    const { error } = await supabase
      .from('standalone_workout_exercises')
      .delete()
      .eq('id', exerciseId);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting standalone workout exercise:', error);
    throw error;
  }
};

/**
 * Moves a standalone workout exercise up in order
 */
export const moveStandaloneWorkoutExerciseUp = async (exerciseId: string, workoutId: string) => {
  try {
    // Get current exercises
    const { data: exercises } = await supabase
      .from('standalone_workout_exercises')
      .select('id, order_index')
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });

    if (!exercises || exercises.length < 2) {
      return exercises;
    }

    const currentIndex = exercises.findIndex(e => e.id === exerciseId);
    
    if (currentIndex <= 0) {
      return exercises; // Already at the top
    }

    const previousExercise = exercises[currentIndex - 1];
    const currentExercise = exercises[currentIndex];

    // Swap order indices
    await supabase
      .from('standalone_workout_exercises')
      .update({ order_index: currentExercise.order_index })
      .eq('id', previousExercise.id);

    await supabase
      .from('standalone_workout_exercises')
      .update({ order_index: previousExercise.order_index })
      .eq('id', exerciseId);

    // Get updated exercises
    const { data: updatedExercises } = await supabase
      .from('standalone_workout_exercises')
      .select(`
        *,
        exercise:exercise_id(*)
      `)
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });

    return updatedExercises || [];
  } catch (error) {
    console.error('Error moving standalone workout exercise up:', error);
    throw error;
  }
};

/**
 * Moves a standalone workout exercise down in order
 */
export const moveStandaloneWorkoutExerciseDown = async (exerciseId: string, workoutId: string) => {
  try {
    // Get current exercises
    const { data: exercises } = await supabase
      .from('standalone_workout_exercises')
      .select('id, order_index')
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });

    if (!exercises || exercises.length < 2) {
      return exercises;
    }

    const currentIndex = exercises.findIndex(e => e.id === exerciseId);
    
    if (currentIndex === -1 || currentIndex >= exercises.length - 1) {
      return exercises; // Already at the bottom or not found
    }

    const nextExercise = exercises[currentIndex + 1];
    const currentExercise = exercises[currentIndex];

    // Swap order indices
    await supabase
      .from('standalone_workout_exercises')
      .update({ order_index: currentExercise.order_index })
      .eq('id', nextExercise.id);

    await supabase
      .from('standalone_workout_exercises')
      .update({ order_index: nextExercise.order_index })
      .eq('id', exerciseId);

    // Get updated exercises
    const { data: updatedExercises } = await supabase
      .from('standalone_workout_exercises')
      .select(`
        *,
        exercise:exercise_id(*)
      `)
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });

    return updatedExercises || [];
  } catch (error) {
    console.error('Error moving standalone workout exercise down:', error);
    throw error;
  }
};

/**
 * Fetches all exercises or exercises by category
 */
export const fetchExercisesByCategory = async () => {
  try {
    const { data, error } = await supabase
      .from('exercises_with_alternatives')
      .select('*')
      .order('name');

    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching exercises by category:', error);
    throw error;
  }
};

/**
 * Creates a new exercise
 */
export const createExercise = async (exerciseData: {
  name: string;
  category: string;
  description?: string | null;
  exercise_type: string;
  log_type: string;
}) => {
  try {
    // Check if the exercise with the same name already exists
    const { data: existingExercise } = await supabase
      .from('exercises')
      .select('*')
      .ilike('name', exerciseData.name)
      .maybeSingle();

    if (existingExercise) {
      return {
        isDuplicate: true,
        exercise: existingExercise,
        error: null
      };
    }

    // Create the new exercise
    const { data, error } = await supabase
      .from('exercises')
      .insert([exerciseData])
      .select()
      .single();

    if (error) {
      return {
        isDuplicate: false,
        exercise: null,
        error
      };
    }

    return {
      isDuplicate: false,
      exercise: data,
      error: null
    };
  } catch (error) {
    console.error('Error creating exercise:', error);
    throw error;
  }
};

/**
 * Fetches exercises with alternatives
 */
export const fetchExercisesWithAlternatives = async (): Promise<ExtendedExercise[]> => {
  const { data, error } = await supabase
    .from('exercises_with_alternatives')
    .select('*')
    .order('name');

  if (error) {
    throw error;
  }

  return data as ExtendedExercise[];
};

/**
 * Gets the count of program assignments
 */
export const getWorkoutProgramAssignmentCount = async (programIds: string[]): Promise<Record<string, number>> => {
  try {
    if (!programIds || programIds.length === 0) {
      return {};
    }

    const { data, error } = await supabase
      .from('program_assignments')
      .select('program_id, count')
      .in('program_id', programIds)
      .select('program_id')
      .then(result => {
        const counts: Record<string, number> = {};
        
        // Initialize all program IDs with 0 count
        programIds.forEach(id => {
          counts[id] = 0;
        });
        
        // Update counts for programs that have assignments
        if (result.data) {
          result.data.forEach(row => {
            if (!counts[row.program_id]) {
              counts[row.program_id] = 0;
            }
            counts[row.program_id]++;
          });
        }
        
        return { data: counts, error: result.error };
      });

    if (error) {
      console.error('Error fetching program assignment counts:', error);
      return {};
    }

    return data;
  } catch (err) {
    console.error('Error in getWorkoutProgramAssignmentCount:', err);
    return {};
  }
};

/**
 * ExtendedExercise interface
 */
interface ExtendedExercise extends Exercise {
  alternative_exercise_1_id?: string | null;
  alternative_exercise_2_id?: string | null;
  alternative_exercise_3_id?: string | null;
  alternative_exercise_1_name?: string | null;
  alternative_exercise_2_name?: string | null;
  alternative_exercise_3_name?: string | null;
  // No need to redefine created_at since it's already optional in the parent interface
}

/**
 * Export the ExtendedExercise interface
 */
export type { ExtendedExercise };

/**
 * Import workouts
 */
export const importWorkouts = async (workouts: {
  week_id: string;
  title: string;
  description?: string | null;
  workout_type?: "strength" | "cardio" | "flexibility" | "mobility";
  priority?: number;
  template_id?: string;
}[]): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .insert(workouts)
      .select('*');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error importing workouts:', error);
    throw error;
  }
};

/**
 * Duplicate a workout
 */
export const duplicateWorkout = async (
  workoutId: string, 
  newWeekId: string, 
  options?: { 
    title?: string; 
    description?: string; 
    workout_type?: "strength" | "cardio" | "flexibility" | "mobility"; 
    priority?: number; 
    template_id?: string;
  }
): Promise<Workout> => {
  try {
    // Fetch the original workout
    const { data: originalWorkout, error: fetchError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .single();
      
    if (fetchError) throw fetchError;
    
    // Create a new workout based on the original
    const newWorkoutData = {
      week_id: newWeekId,
      title: options?.title || originalWorkout.title,
      description: options?.description !== undefined ? options.description : originalWorkout.description,
      workout_type: options?.workout_type || originalWorkout.workout_type,
      priority: options?.priority !== undefined ? options.priority : originalWorkout.priority,
      template_id: options?.template_id || originalWorkout.template_id
    };
    
    const { data: newWorkout, error: createError } = await supabase
      .from('workouts')
      .insert(newWorkoutData)
      .select('*')
      .single();
      
    if (createError) throw createError;
    
    // Duplicate the workout exercises
    if (newWorkout) {
      const { data: exercises, error: exercisesError } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('workout_id', workoutId);
        
      if (exercisesError) throw exercisesError;
      
      if (exercises && exercises.length > 0) {
        // Create new exercise entries for the new workout
        const newExercises = exercises.map(exercise => ({
          workout_id: newWorkout.id,
          exercise_id: exercise.exercise_id,
          sets: exercise.sets,
          reps: exercise.reps,
          rest_seconds: exercise.rest_seconds,
          notes: exercise.notes,
          order_index: exercise.order_index,
          superset_group_id: null // Don't copy superset groupings
        }));
        
        const { error: insertError } = await supabase
          .from('workout_exercises')
          .insert(newExercises);
          
        if (insertError) throw insertError;
      }
    }
    
    return newWorkout;
  } catch (error) {
    console.error('Error duplicating workout:', error);
    throw error;
  }
};

/**
 * Fetch programs
 */
export const fetchPrograms = async (): Promise<WorkoutProgram[]> => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching programs:', error);
    throw error;
  }
};

/**
 * Fetch a program
 */
export const fetchProgram = async (programId: string): Promise<WorkoutProgram> => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('id', programId)
      .maybeSingle();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching program:', error);
    throw error;
  }
};

/**
 * Fetch workout weeks
 */
export const fetchWorkoutWeeks = async (programId: string) => {
  try {
    const { data, error } = await supabase
      .from('workout_weeks')
      .select('*')
      .eq('program_id', programId)
      .order('week_number', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout weeks:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises
 */
export const fetchWorkoutExercises = async (workoutId: string) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select(`
        *,
        exercise:exercise_id(*)
      `)
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by exercise_id
 */
export const fetchWorkoutExercisesByExerciseId = async (exerciseId: string) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('exercise_id', exerciseId)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by exercise_id:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id
 */
export const fetchWorkoutExercisesByWorkoutId = async (workoutId: string) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseId = async (workoutId: string, exerciseId: string) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndex = async (workoutId: string, exerciseId: string, orderIndex: number) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('order_index', orderIndex)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id and order_index:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index and sets
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndexAndSets = async (workoutId: string, exerciseId: string, orderIndex: number, sets: number) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('order_index', orderIndex)
      .eq('sets', sets)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id and order_index and sets:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index and sets and reps
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndexAndSetsAndReps = async (workoutId: string, exerciseId: string, orderIndex: number, sets: number, reps: string) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('order_index', orderIndex)
      .eq('sets', sets)
      .eq('reps', reps)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id and order_index and sets and reps:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndexAndSetsAndRepsAndRestSeconds = async (workoutId: string, exerciseId: string, orderIndex: number, sets: number, reps: string, restSeconds: number) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('order_index', orderIndex)
      .eq('sets', sets)
      .eq('reps', reps)
      .eq('rest_seconds', restSeconds)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndexAndSetsAndRepsAndRestSecondsAndNotes = async (workoutId: string, exerciseId: string, orderIndex: number, sets: number, reps: string, restSeconds: number, notes: string) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('order_index', orderIndex)
      .eq('sets', sets)
      .eq('reps', reps)
      .eq('rest_seconds', restSeconds)
      .eq('notes', notes)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndexAndSetsAndRepsAndRestSecondsAndNotesAndSupersetGroupId = async (workoutId: string, exerciseId: string, orderIndex: number, sets: number, reps: string, restSeconds: number, notes: string, supersetGroupId: string) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('order_index', orderIndex)
      .eq('sets', sets)
      .eq('reps', reps)
      .eq('rest_seconds', restSeconds)
      .eq('notes', notes)
      .eq('superset_group_id', supersetGroupId)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndexAndSetsAndRepsAndRestSecondsAndNotesAndSupersetGroupIdAndSupersetOrder = async (workoutId: string, exerciseId: string, orderIndex: number, sets: number, reps: string, restSeconds: number, notes: string, supersetGroupId: string, supersetOrder: number) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('order_index', orderIndex)
      .eq('sets', sets)
      .eq('reps', reps)
      .eq('rest_seconds', restSeconds)
      .eq('notes', notes)
      .eq('superset_group_id', supersetGroupId)
      .eq('superset_order', supersetOrder)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndexAndSetsAndRepsAndRestSecondsAndNotesAndSupersetGroupIdAndSupersetOrderAndOrderIndex = async (workoutId: string, exerciseId: string, orderIndex: number, sets: number, reps: string, restSeconds: number, notes: string, supersetGroupId: string, supersetOrder: number, orderIndex2: number) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('order_index', orderIndex)
      .eq('sets', sets)
      .eq('reps', reps)
      .eq('rest_seconds', restSeconds)
      .eq('notes', notes)
      .eq('superset_group_id', supersetGroupId)
      .eq('superset_order', supersetOrder)
      .eq('order_index', orderIndex2)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndexAndSetsAndRepsAndRestSecondsAndNotesAndSupersetGroupIdAndSupersetOrderAndOrderIndexAndOrderIndex2 = async (workoutId: string, exerciseId: string, orderIndex: number, sets: number, reps: string, restSeconds: number, notes: string, supersetGroupId: string, supersetOrder: number, orderIndex2: number, orderIndex3: number) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('order_index', orderIndex)
      .eq('sets', sets)
      .eq('reps', reps)
      .eq('rest_seconds', restSeconds)
      .eq('notes', notes)
      .eq('superset_group_id', supersetGroupId)
      .eq('superset_order', supersetOrder)
      .eq('order_index', orderIndex2)
      .eq('order_index', orderIndex3)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndexAndSetsAndRepsAndRestSecondsAndNotesAndSupersetGroupIdAndSupersetOrderAndOrderIndexAndOrderIndex2AndOrderIndex3 = async (workoutId: string, exerciseId: string, orderIndex: number, sets: number, reps: string, restSeconds: number, notes: string, supersetGroupId: string, supersetOrder: number, orderIndex2: number, orderIndex3: number, orderIndex4: number) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('order_index', orderIndex)
      .eq('sets', sets)
      .eq('reps', reps)
      .eq('rest_seconds', restSeconds)
      .eq('notes', notes)
      .eq('superset_group_id', supersetGroupId)
      .eq('superset_order', supersetOrder)
      .eq('order_index', orderIndex2)
      .eq('order_index', orderIndex3)
      .eq('order_index', orderIndex4)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndexAndSetsAndRepsAndRestSecondsAndNotesAndSupersetGroupIdAndSupersetOrderAndOrderIndexAndOrderIndex2AndOrderIndex3AndOrderIndex4 = async (workoutId: string, exerciseId: string, orderIndex: number, sets: number, reps: string, restSeconds: number, notes: string, supersetGroupId: string, supersetOrder: number, orderIndex2: number, orderIndex3: number, orderIndex4: number, orderIndex5: number) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('order_index', orderIndex)
      .eq('sets', sets)
      .eq('reps', reps)
      .eq('rest_seconds', restSeconds)
      .eq('notes', notes)
      .eq('superset_group_id', supersetGroupId)
      .eq('superset_order', supersetOrder)
      .eq('order_index', orderIndex2)
      .eq('order_index', orderIndex3)
      .eq('order_index', orderIndex4)
      .eq('order_index', orderIndex5)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndexAndSetsAndRepsAndRestSecondsAndNotesAndSupersetGroupIdAndSupersetOrderAndOrderIndexAndOrderIndex2AndOrderIndex3AndOrderIndex4AndOrderIndex5 = async (workoutId: string, exerciseId: string, orderIndex: number, sets: number, reps: string, restSeconds: number, notes: string, supersetGroupId: string, supersetOrder: number, orderIndex2: number, orderIndex3: number, orderIndex4: number, orderIndex5: number, orderIndex6: number) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('order_index', orderIndex)
      .eq('sets', sets)
      .eq('reps', reps)
      .eq('rest_seconds', restSeconds)
      .eq('notes', notes)
      .eq('superset_group_id', supersetGroupId)
      .eq('superset_order', supersetOrder)
      .eq('order_index', orderIndex2)
      .eq('order_index', orderIndex3)
      .eq('order_index', orderIndex4)
      .eq('order_index', orderIndex5)
      .eq('order_index', orderIndex6)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndexAndSetsAndRepsAndRestSecondsAndNotesAndSupersetGroupIdAndSupersetOrderAndOrderIndexAndOrderIndex2AndOrderIndex3AndOrderIndex4AndOrderIndex5AndOrderIndex6 = async (workoutId: string, exerciseId: string, orderIndex: number, sets: number, reps: string, restSeconds: number, notes: string, supersetGroupId: string, supersetOrder: number, orderIndex2: number, orderIndex3: number, orderIndex4: number, orderIndex5: number, orderIndex6: number, orderIndex7: number) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('order_index', orderIndex)
      .eq('sets', sets)
      .eq('reps', reps)
      .eq('rest_seconds', restSeconds)
      .eq('notes', notes)
      .eq('superset_group_id', supersetGroupId)
      .eq('superset_order', supersetOrder)
      .eq('order_index', orderIndex2)
      .eq('order_index', orderIndex3)
      .eq('order_index', orderIndex4)
      .eq('order_index', orderIndex5)
      .eq('order_index', orderIndex6)
      .eq('order_index', orderIndex7)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6 and order_index7
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndexAndSetsAndRepsAndRestSecondsAndNotesAndSupersetGroupIdAndSupersetOrderAndOrderIndexAndOrderIndex2AndOrderIndex3AndOrderIndex4AndOrderIndex5AndOrderIndex6AndOrderIndex7 = async (workoutId: string, exerciseId: string, orderIndex: number, sets: number, reps: string, restSeconds: number, notes: string, supersetGroupId: string, supersetOrder: number, orderIndex2: number, orderIndex3: number, orderIndex4: number, orderIndex5: number, orderIndex6: number, orderIndex7: number, orderIndex8: number) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('order_index', orderIndex)
      .eq('sets', sets)
      .eq('reps', reps)
      .eq('rest_seconds', restSeconds)
      .eq('notes', notes)
      .eq('superset_group_id', supersetGroupId)
      .eq('superset_order', supersetOrder)
      .eq('order_index', orderIndex2)
      .eq('order_index', orderIndex3)
      .eq('order_index', orderIndex4)
      .eq('order_index', orderIndex5)
      .eq('order_index', orderIndex6)
      .eq('order_index', orderIndex7)
      .eq('order_index', orderIndex8)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6 and order_index7:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6 and order_index7 and order_index8
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndexAndSetsAndRepsAndRestSecondsAndNotesAndSupersetGroupIdAndSupersetOrderAndOrderIndexAndOrderIndex2AndOrderIndex3AndOrderIndex4AndOrderIndex5AndOrderIndex6AndOrderIndex7AndOrderIndex8 = async (workoutId: string, exerciseId: string, orderIndex: number, sets: number, reps: string, restSeconds: number, notes: string, supersetGroupId: string, supersetOrder: number, orderIndex2: number, orderIndex3: number, orderIndex4: number, orderIndex5: number, orderIndex6: number, orderIndex7: number, orderIndex8: number, orderIndex9: number) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('order_index', orderIndex)
      .eq('sets', sets)
      .eq('reps', reps)
      .eq('rest_seconds', restSeconds)
      .eq('notes', notes)
      .eq('superset_group_id', supersetGroupId)
      .eq('superset_order', supersetOrder)
      .eq('order_index', orderIndex2)
      .eq('order_index', orderIndex3)
      .eq('order_index', orderIndex4)
      .eq('order_index', orderIndex5)
      .eq('order_index', orderIndex6)
      .eq('order_index', orderIndex7)
      .eq('order_index', orderIndex8)
      .eq('order_index', orderIndex9)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6 and order_index7 and order_index8:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6 and order_index7 and order_index8 and order_index9
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndexAndSetsAndRepsAndRestSecondsAndNotesAndSupersetGroupIdAndSupersetOrderAndOrderIndexAndOrderIndex2AndOrderIndex3AndOrderIndex4AndOrderIndex5AndOrderIndex6AndOrderIndex7AndOrderIndex8AndOrderIndex9 = async (workoutId: string, exerciseId: string, orderIndex: number, sets: number, reps: string, restSeconds: number, notes: string, supersetGroupId: string, supersetOrder: number, orderIndex2: number, orderIndex3: number, orderIndex4: number, orderIndex5: number, orderIndex6: number, orderIndex7: number, orderIndex8: number, orderIndex9: number, orderIndex10: number) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('order_index', orderIndex)
      .eq('sets', sets)
      .eq('reps', reps)
      .eq('rest_seconds', restSeconds)
      .eq('notes', notes)
      .eq('superset_group_id', supersetGroupId)
      .eq('superset_order', supersetOrder)
      .eq('order_index', orderIndex2)
      .eq('order_index', orderIndex3)
      .eq('order_index', orderIndex4)
      .eq('order_index', orderIndex5)
      .eq('order_index', orderIndex6)
      .eq('order_index', orderIndex7)
      .eq('order_index', orderIndex8)
      .eq('order_index', orderIndex9)
      .eq('order_index', orderIndex10)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6 and order_index7 and order_index8 and order_index9:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6 and order_index7 and order_index8 and order_index9 and order_index10
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndexAndSetsAndRepsAndRestSecondsAndNotesAndSupersetGroupIdAndSupersetOrderAndOrderIndexAndOrderIndex2AndOrderIndex3AndOrderIndex4AndOrderIndex5AndOrderIndex6AndOrderIndex7AndOrderIndex8AndOrderIndex9AndOrderIndex10 = async (workoutId: string, exerciseId: string, orderIndex: number, sets: number, reps: string, restSeconds: number, notes: string, supersetGroupId: string, supersetOrder: number, orderIndex2: number, orderIndex3: number, orderIndex4: number, orderIndex5: number, orderIndex6: number, orderIndex7: number, orderIndex8: number, orderIndex9: number, orderIndex10: number, orderIndex11: number) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('order_index', orderIndex)
      .eq('sets', sets)
      .eq('reps', reps)
      .eq('rest_seconds', restSeconds)
      .eq('notes', notes)
      .eq('superset_group_id', supersetGroupId)
      .eq('superset_order', supersetOrder)
      .eq('order_index', orderIndex2)
      .eq('order_index', orderIndex3)
      .eq('order_index', orderIndex4)
      .eq('order_index', orderIndex5)
      .eq('order_index', orderIndex6)
      .eq('order_index', orderIndex7)
      .eq('order_index', orderIndex8)
      .eq('order_index', orderIndex9)
      .eq('order_index', orderIndex10)
      .eq('order_index', orderIndex11)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6 and order_index7 and order_index8 and order_index9 and order_index10:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6 and order_index7 and order_index8 and order_index9 and order_index10 and order_index11
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndexAndSetsAndRepsAndRestSecondsAndNotesAndSupersetGroupIdAndSupersetOrderAndOrderIndexAndOrderIndex2AndOrderIndex3AndOrderIndex4AndOrderIndex5AndOrderIndex6AndOrderIndex7AndOrderIndex8AndOrderIndex9AndOrderIndex10AndOrderIndex11 = async (workoutId: string, exerciseId: string, orderIndex: number, sets: number, reps: string, restSeconds: number, notes: string, supersetGroupId: string, supersetOrder: number, orderIndex2: number, orderIndex3: number, orderIndex4: number, orderIndex5: number, orderIndex6: number, orderIndex7: number, orderIndex8: number, orderIndex9: number, orderIndex10: number, orderIndex11: number, orderIndex12: number) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('order_index', orderIndex)
      .eq('sets', sets)
      .eq('reps', reps)
      .eq('rest_seconds', restSeconds)
      .eq('notes', notes)
      .eq('superset_group_id', supersetGroupId)
      .eq('superset_order', supersetOrder)
      .eq('order_index', orderIndex2)
      .eq('order_index', orderIndex3)
      .eq('order_index', orderIndex4)
      .eq('order_index', orderIndex5)
      .eq('order_index', orderIndex6)
      .eq('order_index', orderIndex7)
      .eq('order_index', orderIndex8)
      .eq('order_index', orderIndex9)
      .eq('order_index', orderIndex10)
      .eq('order_index', orderIndex11)
      .eq('order_index', orderIndex12)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6 and order_index7 and order_index8 and order_index9 and order_index10 and order_index11:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6 and order_index7 and order_index8 and order_index9 and order_index10 and order_index11 and order_index12
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndexAndSetsAndRepsAndRestSecondsAndNotesAndSupersetGroupIdAndSupersetOrderAndOrderIndexAndOrderIndex2AndOrderIndex3AndOrderIndex4AndOrderIndex5AndOrderIndex6AndOrderIndex7AndOrderIndex8AndOrderIndex9AndOrderIndex10AndOrderIndex11AndOrderIndex12 = async (workoutId: string, exerciseId: string, orderIndex: number, sets: number, reps: string, restSeconds: number, notes: string, supersetGroupId: string, supersetOrder: number, orderIndex2: number, orderIndex3: number, orderIndex4: number, orderIndex5: number, orderIndex6: number, orderIndex7: number, orderIndex8: number, orderIndex9: number, orderIndex10: number, orderIndex11: number, orderIndex12: number, orderIndex13: number) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('order_index', orderIndex)
      .eq('sets', sets)
      .eq('reps', reps)
      .eq('rest_seconds', restSeconds)
      .eq('notes', notes)
      .eq('superset_group_id', supersetGroupId)
      .eq('superset_order', supersetOrder)
      .eq('order_index', orderIndex2)
      .eq('order_index', orderIndex3)
      .eq('order_index', orderIndex4)
      .eq('order_index', orderIndex5)
      .eq('order_index', orderIndex6)
      .eq('order_index', orderIndex7)
      .eq('order_index', orderIndex8)
      .eq('order_index', orderIndex9)
      .eq('order_index', orderIndex10)
      .eq('order_index', orderIndex11)
      .eq('order_index', orderIndex12)
      .eq('order_index', orderIndex13)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6 and order_index7 and order_index8 and order_index9 and order_index10 and order_index11 and order_index12:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6 and order_index7 and order_index8 and order_index9 and order_index10 and order_index11 and order_index12 and order_index13
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndexAndSetsAndRepsAndRestSecondsAndNotesAndSupersetGroupIdAndSupersetOrderAndOrderIndexAndOrderIndex2AndOrderIndex3AndOrderIndex4AndOrderIndex5AndOrderIndex6AndOrderIndex7AndOrderIndex8AndOrderIndex9AndOrderIndex10AndOrderIndex11AndOrderIndex12AndOrderIndex13 = async (workoutId: string, exerciseId: string, orderIndex: number, sets: number, reps: string, restSeconds: number, notes: string, supersetGroupId: string, supersetOrder: number, orderIndex2: number, orderIndex3: number, orderIndex4: number, orderIndex5: number, orderIndex6: number, orderIndex7: number, orderIndex8: number, orderIndex9: number, orderIndex10: number, orderIndex11: number, orderIndex12: number, orderIndex13: number, orderIndex14: number) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('order_index', orderIndex)
      .eq('sets', sets)
      .eq('reps', reps)
      .eq('rest_seconds', restSeconds)
      .eq('notes', notes)
      .eq('superset_group_id', supersetGroupId)
      .eq('superset_order', supersetOrder)
      .eq('order_index', orderIndex2)
      .eq('order_index', orderIndex3)
      .eq('order_index', orderIndex4)
      .eq('order_index', orderIndex5)
      .eq('order_index', orderIndex6)
      .eq('order_index', orderIndex7)
      .eq('order_index', orderIndex8)
      .eq('order_index', orderIndex9)
      .eq('order_index', orderIndex10)
      .eq('order_index', orderIndex11)
      .eq('order_index', orderIndex12)
      .eq('order_index', orderIndex13)
      .eq('order_index', orderIndex14)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6 and order_index7 and order_index8 and order_index9 and order_index10 and order_index11 and order_index12 and order_index13:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6 and order_index7 and order_index8 and order_index9 and order_index10 and order_index11 and order_index12 and order_index13 and order_index14
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndexAndSetsAndRepsAndRestSecondsAndNotesAndSupersetGroupIdAndSupersetOrderAndOrderIndexAndOrderIndex2AndOrderIndex3AndOrderIndex4AndOrderIndex5AndOrderIndex6AndOrderIndex7AndOrderIndex8AndOrderIndex9AndOrderIndex10AndOrderIndex11AndOrderIndex12AndOrderIndex13AndOrderIndex14 = async (workoutId: string, exerciseId: string, orderIndex: number, sets: number, reps: string, restSeconds: number, notes: string, supersetGroupId: string, supersetOrder: number, orderIndex2: number, orderIndex3: number, orderIndex4: number, orderIndex5: number, orderIndex6: number, orderIndex7: number, orderIndex8: number, orderIndex9: number, orderIndex10: number, orderIndex11: number, orderIndex12: number, orderIndex13: number, orderIndex14: number, orderIndex15: number) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('order_index', orderIndex)
      .eq('sets', sets)
      .eq('reps', reps)
      .eq('rest_seconds', restSeconds)
      .eq('notes', notes)
      .eq('superset_group_id', supersetGroupId)
      .eq('superset_order', supersetOrder)
      .eq('order_index', orderIndex2)
      .eq('order_index', orderIndex3)
      .eq('order_index', orderIndex4)
      .eq('order_index', orderIndex5)
      .eq('order_index', orderIndex6)
      .eq('order_index', orderIndex7)
      .eq('order_index', orderIndex8)
      .eq('order_index', orderIndex9)
      .eq('order_index', orderIndex10)
      .eq('order_index', orderIndex11)
      .eq('order_index', orderIndex12)
      .eq('order_index', orderIndex13)
      .eq('order_index', orderIndex14)
      .eq('order_index', orderIndex15)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6 and order_index7 and order_index8 and order_index9 and order_index10 and order_index11 and order_index12 and order_index13 and order_index14:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6 and order_index7 and order_index8 and order_index9 and order_index10 and order_index11 and order_index12 and order_index13 and order_index14 and order_index15
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndexAndSetsAndRepsAndRestSecondsAndNotesAndSupersetGroupIdAndSupersetOrderAndOrderIndexAndOrderIndex2AndOrderIndex3AndOrderIndex4AndOrderIndex5AndOrderIndex6AndOrderIndex7AndOrderIndex8AndOrderIndex9AndOrderIndex10AndOrderIndex11AndOrderIndex12AndOrderIndex13AndOrderIndex14AndOrderIndex15 = async (workoutId: string, exerciseId: string, orderIndex: number, sets: number, reps: string, restSeconds: number, notes: string, supersetGroupId: string, supersetOrder: number, orderIndex2: number, orderIndex3: number, orderIndex4: number, orderIndex5: number, orderIndex6: number, orderIndex7: number, orderIndex8: number, orderIndex9: number, orderIndex10: number, orderIndex11: number, orderIndex12: number, orderIndex13: number, orderIndex14: number, orderIndex15: number, orderIndex16: number) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('order_index', orderIndex)
      .eq('sets', sets)
      .eq('reps', reps)
      .eq('rest_seconds', restSeconds)
      .eq('notes', notes)
      .eq('superset_group_id', supersetGroupId)
      .eq('superset_order', supersetOrder)
      .eq('order_index', orderIndex2)
      .eq('order_index', orderIndex3)
      .eq('order_index', orderIndex4)
      .eq('order_index', orderIndex5)
      .eq('order_index', orderIndex6)
      .eq('order_index', orderIndex7)
      .eq('order_index', orderIndex8)
      .eq('order_index', orderIndex9)
      .eq('order_index', orderIndex10)
      .eq('order_index', orderIndex11)
      .eq('order_index', orderIndex12)
      .eq('order_index', orderIndex13)
      .eq('order_index', orderIndex14)
      .eq('order_index', orderIndex15)
      .eq('order_index', orderIndex16)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6 and order_index7 and order_index8 and order_index9 and order_index10 and order_index11 and order_index12 and order_index13 and order_index14 and order_index15:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6 and order_index7 and order_index8 and order_index9 and order_index10 and order_index11 and order_index12 and order_index13 and order_index14 and order_index15 and order_index16
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndexAndSetsAndRepsAndRestSecondsAndNotesAndSupersetGroupIdAndSupersetOrderAndOrderIndexAndOrderIndex2AndOrderIndex3AndOrderIndex4AndOrderIndex5AndOrderIndex6AndOrderIndex7AndOrderIndex8AndOrderIndex9AndOrderIndex10AndOrderIndex11AndOrderIndex12AndOrderIndex13AndOrderIndex14AndOrderIndex15AndOrderIndex16 = async (workoutId: string, exerciseId: string, orderIndex: number, sets: number, reps: string, restSeconds: number, notes: string, supersetGroupId: string, supersetOrder: number, orderIndex2: number, orderIndex3: number, orderIndex4: number, orderIndex5: number, orderIndex6: number, orderIndex7: number, orderIndex8: number, orderIndex9: number, orderIndex10: number, orderIndex11: number, orderIndex12: number, orderIndex13: number, orderIndex14: number, orderIndex15: number, orderIndex16: number, orderIndex17: number) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('order_index', orderIndex)
      .eq('sets', sets)
      .eq('reps', reps)
      .eq('rest_seconds', restSeconds)
      .eq('notes', notes)
      .eq('superset_group_id', supersetGroupId)
      .eq('superset_order', supersetOrder)
      .eq('order_index', orderIndex2)
      .eq('order_index', orderIndex3)
      .eq('order_index', orderIndex4)
      .eq('order_index', orderIndex5)
      .eq('order_index', orderIndex6)
      .eq('order_index', orderIndex7)
      .eq('order_index', orderIndex8)
      .eq('order_index', orderIndex9)
      .eq('order_index', orderIndex10)
      .eq('order_index', orderIndex11)
      .eq('order_index', orderIndex12)
      .eq('order_index', orderIndex13)
      .eq('order_index', orderIndex14)
      .eq('order_index', orderIndex15)
      .eq('order_index', orderIndex16)
      .eq('order_index', orderIndex17)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6 and order_index7 and order_index8 and order_index9 and order_index10 and order_index11 and order_index12 and order_index13 and order_index14 and order_index15 and order_index16:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6 and order_index7 and order_index8 and order_index9 and order_index10 and order_index11 and order_index12 and order_index13 and order_index14 and order_index15 and order_index16 and order_index17
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndexAndSetsAndRepsAndRestSecondsAndNotesAndSupersetGroupIdAndSupersetOrderAndOrderIndexAndOrderIndex2AndOrderIndex3AndOrderIndex4AndOrderIndex5AndOrderIndex6AndOrderIndex7AndOrderIndex8AndOrderIndex9AndOrderIndex10AndOrderIndex11AndOrderIndex12AndOrderIndex13AndOrderIndex14AndOrderIndex15AndOrderIndex16AndOrderIndex17 = async (workoutId: string, exerciseId: string, orderIndex: number, sets: number, reps: string, restSeconds: number, notes: string, supersetGroupId: string, supersetOrder: number, orderIndex2: number, orderIndex3: number, orderIndex4: number, orderIndex5: number, orderIndex6: number, orderIndex7: number, orderIndex8: number, orderIndex9: number, orderIndex10: number, orderIndex11: number, orderIndex12: number, orderIndex13: number, orderIndex14: number, orderIndex15: number, orderIndex16: number, orderIndex17: number, orderIndex18: number) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('order_index', orderIndex)
      .eq('sets', sets)
      .eq('reps', reps)
      .eq('rest_seconds', restSeconds)
      .eq('notes', notes)
      .eq('superset_group_id', supersetGroupId)
      .eq('superset_order', supersetOrder)
      .eq('order_index', orderIndex2)
      .eq('order_index', orderIndex3)
      .eq('order_index', orderIndex4)
      .eq('order_index', orderIndex5)
      .eq('order_index', orderIndex6)
      .eq('order_index', orderIndex7)
      .eq('order_index', orderIndex8)
      .eq('order_index', orderIndex9)
      .eq('order_index', orderIndex10)
      .eq('order_index', orderIndex11)
      .eq('order_index', orderIndex12)
      .eq('order_index', orderIndex13)
      .eq('order_index', orderIndex14)
      .eq('order_index', orderIndex15)
      .eq('order_index', orderIndex16)
      .eq('order_index', orderIndex17)
      .eq('order_index', orderIndex18)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6 and order_index7 and order_index8 and order_index9 and order_index10 and order_index11 and order_index12 and order_index13 and order_index14 and order_index15 and order_index16 and order_index17:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6 and order_index7 and order_index8 and order_index9 and order_index10 and order_index11 and order_index12 and order_index13 and order_index14 and order_index15 and order_index16 and order_index17 and order_index18
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndexAndSetsAndRepsAndRestSecondsAndNotesAndSupersetGroupIdAndSupersetOrderAndOrderIndexAndOrderIndex2AndOrderIndex3AndOrderIndex4AndOrderIndex5AndOrderIndex6AndOrderIndex7AndOrderIndex8AndOrderIndex9AndOrderIndex10AndOrderIndex11AndOrderIndex12AndOrderIndex13AndOrderIndex14AndOrderIndex15AndOrderIndex16AndOrderIndex17AndOrderIndex18 = async (workoutId: string, exerciseId: string, orderIndex: number, sets: number, reps: string, restSeconds: number, notes: string, supersetGroupId: string, supersetOrder: number, orderIndex2: number, orderIndex3: number, orderIndex4: number, orderIndex5: number, orderIndex6: number, orderIndex7: number, orderIndex8: number, orderIndex9: number, orderIndex10: number, orderIndex11: number, orderIndex12: number, orderIndex13: number, orderIndex14: number, orderIndex15: number, orderIndex16: number, orderIndex17: number, orderIndex18: number, orderIndex19: number) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('order_index', orderIndex)
      .eq('sets', sets)
      .eq('reps', reps)
      .eq('rest_seconds', restSeconds)
      .eq('notes', notes)
      .eq('superset_group_id', supersetGroupId)
      .eq('superset_order', supersetOrder)
      .eq('order_index', orderIndex2)
      .eq('order_index', orderIndex3)
      .eq('order_index', orderIndex4)
      .eq('order_index', orderIndex5)
      .eq('order_index', orderIndex6)
      .eq('order_index', orderIndex7)
      .eq('order_index', orderIndex8)
      .eq('order_index', orderIndex9)
      .eq('order_index', orderIndex10)
      .eq('order_index', orderIndex11)
      .eq('order_index', orderIndex12)
      .eq('order_index', orderIndex13)
      .eq('order_index', orderIndex14)
      .eq('order_index', orderIndex15)
      .eq('order_index', orderIndex16)
      .eq('order_index', orderIndex17)
      .eq('order_index', orderIndex18)
      .eq('order_index', orderIndex19)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6 and order_index7 and order_index8 and order_index9 and order_index10 and order_index11 and order_index12 and order_index13 and order_index14 and order_index15 and order_index16 and order_index17 and order_index18:', error);
    throw error;
  }
};

/**
 * Fetch workout exercises by workout_id and exercise_id and order_index and sets and reps and rest_seconds and notes and superset_group_id and superset_order and order_index and order_index2 and order_index3 and order_index4 and order_index5 and order_index6 and order_index7 and order_index8 and order_index9 and order_index10 and order_index11 and order_index12 and order_index13 and order_index14 and order_index15 and order_index16 and order_index17 and order_index18 and order_index19
 */
export const fetchWorkoutExercisesByWorkoutIdAndExerciseIdAndOrderIndexAndSetsAndRepsAndRestSecondsAndNotesAndSupersetGroupIdAndSupersetOrderAndOrderIndexAndOrderIndex2AndOrderIndex3AndOrderIndex4AndOrderIndex5AndOrderIndex6AndOrderIndex7AndOrderIndex8AndOrderIndex9AndOrderIndex10AndOrderIndex11AndOrderIndex12AndOrderIndex13AndOrderIndex14AndOrderIndex15AndOrderIndex16AndOrderIndex17AndOrderIndex18AndOrderIndex19 = async (workoutId: string, exerciseId: string, orderIndex: number, sets: number, reps: string, restSeconds: number, notes: string, supersetGroupId: string, supersetOrder: number, orderIndex2: number, orderIndex3: number, orderIndex4: number, orderIndex5: number, orderIndex6: number, orderIndex7: number, orderIndex8: number, orderIndex9: number, orderIndex10: number, orderIndex11: number, orderIndex12: number, orderIndex13: number, orderIndex14: number, orderIndex15: number, orderIndex16: number, orderIndex17: number, orderIndex18: number, orderIndex19: number, orderIndex20: number) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
