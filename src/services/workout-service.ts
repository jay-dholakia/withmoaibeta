import { supabase } from "@/integrations/supabase/client";
import { ProgramAssignment, WorkoutProgram, WorkoutType } from "@/types/workout";

/**
 * Fetches a workout program by ID.
 */
export const fetchWorkoutProgram = async (programId: string): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('id', programId)
      .single();
    
    if (error) {
      console.error('Error fetching workout program:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching workout program:", error);
    return null;
  }
};

/**
 * Fetches all workout programs.
 */
export const fetchAllWorkoutPrograms = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .select('*');
    
    if (error) {
      console.error('Error fetching all workout programs:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching all workout programs:", error);
    return [];
  }
};

/**
 * Fetches all workout programs for a coach.
 */
export const fetchWorkoutPrograms = async (coachId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching coach workout programs:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching coach workout programs:", error);
    return [];
  }
};

/**
 * Fetches all users assigned to a specific workout program.
 */
export const fetchAssignedUsers = async (programId: string): Promise<ProgramAssignment[]> => {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .select('*')
      .eq('program_id', programId);
    
    if (error) {
      console.error('Error fetching assigned users:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching assigned users:", error);
    return [];
  }
};

/**
 * Assigns a workout program to a user.
 */
export const assignProgramToUser = async (assignmentData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .insert([assignmentData])
      .select()
      .single();
    
    if (error) {
      console.error('Error assigning program to user:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error assigning program to user:", error);
    throw error;
  }
};

/**
 * Fetches all clients.
 */
export const fetchAllClients = async (): Promise<any[]> => {
  try {
    // First get all profiles with user_type = 'client'
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'client');
    
    if (profilesError) {
      console.error('Error fetching client profiles:', profilesError);
      return [];
    }
    
    // Then for each profile, fetch the client_profile data to get first_name and last_name
    const clientsWithDetails = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { data: clientProfile, error: clientError } = await supabase
          .from('client_profiles')
          .select('first_name, last_name')
          .eq('id', profile.id)
          .single();
        
        if (clientError && clientError.code !== 'PGRST116') { 
          // PGRST116 means not found, which is ok - some clients might not have profiles yet
          console.error(`Error fetching client profile for ${profile.id}:`, clientError);
        }
        
        return {
          ...profile,
          first_name: clientProfile?.first_name || null,
          last_name: clientProfile?.last_name || null
        };
      })
    );
    
    console.log('Clients with details:', clientsWithDetails);
    return clientsWithDetails || [];
  } catch (error) {
    console.error("Error fetching all clients:", error);
    return [];
  }
};

/**
 * Deletes a program assignment
 */
export const deleteProgramAssignment = async (assignmentId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('program_assignments')
      .delete()
      .eq('id', assignmentId);
    
    if (error) {
      console.error('Error deleting program assignment:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to delete program assignment:', error);
    return false;
  }
};

/**
 * Creates a new workout program
 */
export const createWorkoutProgram = async (programData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .insert([programData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating workout program:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error creating workout program:", error);
    throw error;
  }
};

/**
 * Updates an existing workout program
 */
export const updateWorkoutProgram = async (programId: string, programData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .update(programData)
      .eq('id', programId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating workout program:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error updating workout program:", error);
    throw error;
  }
};

/**
 * Deletes a workout program
 */
export const deleteWorkoutProgram = async (programId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_programs')
      .delete()
      .eq('id', programId);
    
    if (error) {
      console.error('Error deleting workout program:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to delete workout program:', error);
    return false;
  }
};

/**
 * Fetches workout weeks for a program
 */
export const fetchWorkoutWeeks = async (programId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('workout_weeks')
      .select('*')
      .eq('program_id', programId)
      .order('week_number', { ascending: true });
    
    if (error) {
      console.error('Error fetching workout weeks:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching workout weeks:", error);
    return [];
  }
};

/**
 * Creates a new workout week
 */
export const createWorkoutWeek = async (weekData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('workout_weeks')
      .insert([weekData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating workout week:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error creating workout week:", error);
    throw error;
  }
};

/**
 * Updates an existing workout week
 */
export const updateWorkoutWeek = async (weekId: string, weekData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('workout_weeks')
      .update(weekData)
      .eq('id', weekId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating workout week:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error updating workout week:", error);
    throw error;
  }
};

/**
 * Deletes a workout week
 */
export const deleteWorkoutWeek = async (weekId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_weeks')
      .delete()
      .eq('id', weekId);
    
    if (error) {
      console.error('Error deleting workout week:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to delete workout week:', error);
    return false;
  }
};

/**
 * Fetches workouts for a week
 */
export const fetchWorkouts = async (weekId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('week_id', weekId)
      .order('day_of_week', { ascending: true });
    
    if (error) {
      console.error('Error fetching workouts:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching workouts:", error);
    return [];
  }
};

/**
 * Creates a new workout
 */
export const createWorkout = async (workoutData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .insert([workoutData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating workout:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error creating workout:", error);
    throw error;
  }
};

/**
 * Updates an existing workout
 */
export const updateWorkout = async (workoutId: string, workoutData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .update(workoutData)
      .eq('id', workoutId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating workout:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error updating workout:", error);
    throw error;
  }
};

/**
 * Deletes a workout
 */
export const deleteWorkout = async (workoutId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', workoutId);
    
    if (error) {
      console.error('Error deleting workout:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to delete workout:', error);
    return false;
  }
};

/**
 * Adds a standalone workout to a week
 */
export const addWorkoutToWeek = async (workoutId: string, weekId: string, dayOfWeek: number): Promise<any> => {
  try {
    // First, fetch the standalone workout details
    const { data: standaloneWorkout, error: fetchError } = await supabase
      .from('standalone_workouts')
      .select('*')
      .eq('id', workoutId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching standalone workout:', fetchError);
      throw fetchError;
    }
    
    // Create a new workout in the week
    const workoutData = {
      week_id: weekId,
      day_of_week: dayOfWeek,
      title: standaloneWorkout.title,
      description: standaloneWorkout.description,
      workout_type: standaloneWorkout.workout_type || 'strength' // Include workout_type when adding to week
    };
    
    const { data: newWorkout, error: createError } = await supabase
      .from('workouts')
      .insert([workoutData])
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating workout from standalone:', createError);
      throw createError;
    }
    
    // Now, fetch all exercises from the standalone workout
    const { data: exercises, error: exError } = await supabase
      .from('standalone_workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });
    
    if (exError) {
      console.error('Error fetching standalone workout exercises:', exError);
      throw exError;
    }
    
    // Add all exercises to the new workout
    if (exercises && exercises.length > 0) {
      const exerciseData = exercises.map(ex => ({
        workout_id: newWorkout.id,
        exercise_id: ex.exercise_id,
        sets: ex.sets || 1, // Default to 1 if null
        reps: ex.reps || '10', // Default to '10' if null
        rest_seconds: ex.rest_seconds || 60, // Default to 60 seconds if null
        notes: ex.notes,
        order_index: ex.order_index
      }));
      
      const { error: insertError } = await supabase
        .from('workout_exercises')
        .insert(exerciseData);
      
      if (insertError) {
        console.error('Error adding exercises to new workout:', insertError);
        throw insertError;
      }
    }
    
    return newWorkout;
  } catch (error) {
    console.error("Error adding workout to week:", error);
    throw error;
  }
};

/**
 * Fetches exercises for a workout
 */
export const fetchWorkoutExercises = async (workoutId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select(`
        *,
        exercise:exercise_id (*),
        workout:workout_id (*)
      `)
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });
    
    if (error) {
      console.error('Error fetching workout exercises:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching workout exercises:", error);
    return [];
  }
};

/**
 * Creates a new workout exercise
 */
export const createWorkoutExercise = async (exerciseData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .insert([exerciseData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating workout exercise:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error creating workout exercise:", error);
    throw error;
  }
};

/**
 * Updates an existing workout exercise
 */
export const updateWorkoutExercise = async (exerciseId: string, exerciseData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .update(exerciseData)
      .eq('id', exerciseId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating workout exercise:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error updating workout exercise:", error);
    throw error;
  }
};

/**
 * Deletes a workout exercise
 */
export const deleteWorkoutExercise = async (exerciseId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('id', exerciseId);
    
    if (error) {
      console.error('Error deleting workout exercise:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to delete workout exercise:', error);
    return false;
  }
};

/**
 * Fetches exercises by category
 */
export const fetchExercisesByCategory = async (): Promise<Record<string, any[]>> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching exercises:', error);
      return {};
    }
    
    // Group exercises by category
    const exercisesByCategory = (data || []).reduce((acc, exercise) => {
      if (!acc[exercise.category]) {
        acc[exercise.category] = [];
      }
      acc[exercise.category].push(exercise);
      return acc;
    }, {} as Record<string, any[]>);
    
    return exercisesByCategory;
  } catch (error) {
    console.error("Error fetching exercises by category:", error);
    return {};
  }
};

/**
 * Fetches standalone workouts for a coach
 */
export const fetchStandaloneWorkouts = async (coachId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('standalone_workouts')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching standalone workouts:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching standalone workouts:", error);
    return [];
  }
};

/**
 * Creates a new standalone workout
 */
export const createStandaloneWorkout = async (workoutData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('standalone_workouts')
      .insert([workoutData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating standalone workout:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error creating standalone workout:", error);
    throw error;
  }
};

/**
 * Updates an existing standalone workout
 */
export const updateStandaloneWorkout = async (workoutId: string, workoutData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('standalone_workouts')
      .update(workoutData)
      .eq('id', workoutId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating standalone workout:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error updating standalone workout:", error);
    throw error;
  }
};

/**
 * Deletes a standalone workout
 */
export const deleteStandaloneWorkout = async (workoutId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('standalone_workouts')
      .delete()
      .eq('id', workoutId);
    
    if (error) {
      console.error('Error deleting standalone workout:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to delete standalone workout:', error);
    return false;
  }
};

/**
 * Fetches exercises for a standalone workout
 */
export const fetchStandaloneWorkoutExercises = async (workoutId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('standalone_workout_exercises')
      .select(`
        *,
        exercise:exercise_id (*)
      `)
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });
    
    if (error) {
      console.error('Error fetching standalone workout exercises:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching standalone workout exercises:", error);
    return [];
  }
};

/**
 * Creates a new standalone workout exercise
 */
export const createStandaloneWorkoutExercise = async (exerciseData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('standalone_workout_exercises')
      .insert([exerciseData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating standalone workout exercise:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error creating standalone workout exercise:", error);
    throw error;
  }
};

/**
 * Updates an existing standalone workout exercise
 */
export const updateStandaloneWorkoutExercise = async (exerciseId: string, exerciseData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('standalone_workout_exercises')
      .update(exerciseData)
      .eq('id', exerciseId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating standalone workout exercise:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error updating standalone workout exercise:", error);
    throw error;
  }
};

/**
 * Deletes a standalone workout exercise
 */
export const deleteStandaloneWorkoutExercise = async (exerciseId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('standalone_workout_exercises')
      .delete()
      .eq('id', exerciseId);
    
    if (error) {
      console.error('Error deleting standalone workout exercise:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to delete standalone workout exercise:', error);
    return false;
  }
};

/**
 * Gets the count of program assignments
 */
export const getWorkoutProgramAssignmentCount = async (programId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('program_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', programId);
    
    if (error) {
      console.error('Error getting program assignment count:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error("Error getting program assignment count:", error);
    return 0;
  }
};
