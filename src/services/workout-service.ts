import { supabase } from '@/integrations/supabase/client';
import { WorkoutProgram, WorkoutWeek, Workout, Exercise, StandaloneWorkout } from '@/types/workout';

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
export const fetchWorkoutPrograms = async (coachId?: string) => {
  try {
    let query = supabase
      .from('workout_programs')
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
      .single();
    
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
      .order('day_of_week', { ascending: true });
    
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
      .order('day_of_week', { ascending: true });
    
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
export const createWorkout = async (workoutData: {
  week_id: string;
  title: string;
  description?: string | null;
  day_of_week: number;
  workout_type?: "cardio" | "strength" | "mobility" | "flexibility";
  priority?: number;
}) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .insert([workoutData])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating workout:', error);
    throw error;
  }
};

/**
 * Updates a workout
 */
export const updateWorkout = async (workoutId: string, workoutData: {
  title?: string;
  description?: string | null;
  day_of_week?: number;
  workout_type?: "cardio" | "strength" | "mobility" | "flexibility";
  priority?: number;
}) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .update(workoutData)
      .eq('id', workoutId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
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
    // Get current exercises
    const { data: exercises } = await supabase
      .from('workout_exercises')
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
      .from('workout_exercises')
      .update({ order_index: currentExercise.order_index })
      .eq('id', previousExercise.id);

    await supabase
      .from('workout_exercises')
      .update({ order_index: previousExercise.order_index })
      .eq('id', exerciseId);

    // Get updated exercises
    const { data: updatedExercises } = await supabase
      .from('workout_exercises')
      .select(`
        *,
        exercise:exercise_id(*)
      `)
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });

    return updatedExercises || [];
  } catch (error) {
    console.error('Error moving workout exercise up:', error);
    throw error;
  }
};

/**
 * Moves a workout exercise down in order
 */
export const moveWorkoutExerciseDown = async (exerciseId: string, workoutId: string) => {
  try {
    // Get current exercises
    const { data: exercises } = await supabase
      .from('workout_exercises')
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
      .from('workout_exercises')
      .update({ order_index: currentExercise.order_index })
      .eq('id', nextExercise.id);

    await supabase
      .from('workout_exercises')
      .update({ order_index: nextExercise.order_index })
      .eq('id', exerciseId);

    // Get updated exercises
    const { data: updatedExercises } = await supabase
      .from('workout_exercises')
      .select(`
        *,
        exercise:exercise_id(*)
      `)
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });

    return updatedExercises || [];
  } catch (error) {
    console.error('Error moving workout exercise down:', error);
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
export const fetchExercisesByCategory = async (category?: string) => {
  try {
    let query = supabase
      .from('exercises')
      .select('*')
      .order('name', { ascending: true });
    
    if (category && category !== 'All') {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching exercises:', error);
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
