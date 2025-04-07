import { supabase } from "@/integrations/supabase/client";
import { ProgramAssignment, WorkoutExercise, WorkoutProgram, WorkoutWeek } from "@/types/workout";

/**
 * Fetches all workout programs
 */
export const fetchWorkoutPrograms = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .select('*');
    
    if (error) {
      console.error("Error fetching workout programs:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching workout programs:", error);
    return [];
  }
};

/**
 * Fetches a single workout program by ID
 */
export const fetchWorkoutProgram = async (id: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error("Error fetching workout program:", error);
      return null;
    }
    
    return data || null;
  } catch (error) {
    console.error("Error fetching workout program:", error);
    return null;
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
      console.error("Error creating workout program:", error);
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
export const updateWorkoutProgram = async (id: string, programData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .update(programData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating workout program:", error);
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
export const deleteWorkoutProgram = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_programs')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error("Error deleting workout program:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting workout program:", error);
    return false;
  }
};

/**
 * Fetches all workout weeks for a program
 */
export const fetchWorkoutWeeks = async (programId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('workout_weeks')
      .select('*')
      .eq('program_id', programId)
      .order('week_number', { ascending: true });
    
    if (error) {
      console.error("Error fetching workout weeks:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching workout weeks:", error);
    return [];
  }
};

/**
 * Fetches a single workout week by ID
 */
export const fetchWorkoutWeek = async (id: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('workout_weeks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error("Error fetching workout week:", error);
      return null;
    }
    
    return data || null;
  } catch (error) {
    console.error("Error fetching workout week:", error);
    return null;
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
      console.error("Error creating workout week:", error);
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
export const updateWorkoutWeek = async (id: string, weekData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('workout_weeks')
      .update(weekData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating workout week:", error);
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
export const deleteWorkoutWeek = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_weeks')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error("Error deleting workout week:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting workout week:", error);
    return false;
  }
};

/**
 * Fetches all workouts for a week
 */
export const fetchWorkoutsForWeek = async (weekId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('week_id', weekId)
      .order('day_of_week', { ascending: true });
    
    if (error) {
      console.error("Error fetching workouts for week:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching workouts for week:", error);
    return [];
  }
};

/**
 * Fetches a single workout by ID
 */
export const fetchWorkout = async (id: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error("Error fetching workout:", error);
      return null;
    }
    
    return data || null;
  } catch (error) {
    console.error("Error fetching workout:", error);
    return null;
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
      console.error("Error creating workout:", error);
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
export const updateWorkout = async (id: string, workoutData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .update(workoutData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating workout:", error);
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
export const deleteWorkout = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error("Error deleting workout:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting workout:", error);
    return false;
  }
};

/**
 * Fetches all exercises
 */
export const fetchExercises = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*');
    
    if (error) {
      console.error("Error fetching exercises:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching exercises:", error);
    return [];
  }
};

/**
 * Fetches a single exercise by ID
 */
export const fetchExercise = async (id: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error("Error fetching exercise:", error);
      return null;
    }
    
    return data || null;
  } catch (error) {
    console.error("Error fetching exercise:", error);
    return null;
  }
};

/**
 * Creates a new exercise
 */
export const createExercise = async (exerciseData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .insert([exerciseData])
      .select()
      .single();
    
    if (error) {
      console.error("Error creating exercise:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error creating exercise:", error);
    throw error;
  }
};

/**
 * Updates an existing exercise
 */
export const updateExercise = async (id: string, exerciseData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .update(exerciseData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating exercise:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error updating exercise:", error);
    throw error;
  }
};

/**
 * Deletes an exercise
 */
export const deleteExercise = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error("Error deleting exercise:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting exercise:", error);
    return false;
  }
};

/**
 * Fetches all workout exercises for a workout
 */
export const fetchWorkoutExercises = async (workoutId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select(`
        *,
        exercise:exercise_id (*)
      `)
      .eq('workout_id', workoutId)
      .order('order', { ascending: true });
    
    if (error) {
      console.error("Error fetching workout exercises:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching workout exercises:", error);
    return [];
  }
};

/**
 * Fetches a single workout exercise by ID
 */
export const fetchWorkoutExercise = async (id: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select(`
        *,
        exercise:exercise_id (*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error("Error fetching workout exercise:", error);
      return null;
    }
    
    return data || null;
  } catch (error) {
    console.error("Error fetching workout exercise:", error);
    return null;
  }
};

/**
 * Creates a new workout exercise
 */
export const createWorkoutExercise = async (workoutExerciseData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .insert([workoutExerciseData])
      .select()
      .single();
    
    if (error) {
      console.error("Error creating workout exercise:", error);
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
export const updateWorkoutExercise = async (id: string, workoutExerciseData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .update(workoutExerciseData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating workout exercise:", error);
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
export const deleteWorkoutExercise = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error("Error deleting workout exercise:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting workout exercise:", error);
    return false;
  }
};

/**
 * Fetches all clients
 */
export const fetchAllClients = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'client');
    
    if (error) {
      console.error("Error fetching clients:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
};

/**
 * Fetches all assigned users for a program
 */
export const fetchAssignedUsers = async (programId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .select('*')
      .eq('program_id', programId);
    
    if (error) {
      console.error("Error fetching assigned users:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching assigned users:", error);
    return [];
  }
};

/**
 * Assigns a workout program to a user
 */
export const assignProgramToUser = async (assignmentData: {
  program_id: string;
  user_id: string;
  assigned_by: string;
  start_date: string;
  end_date: string | null;
}) => {
  try {
    const { data, error } = await supabase.functions.invoke('assign_program_to_client', {
      body: {
        program_id: assignmentData.program_id,
        client_id: assignmentData.user_id,
        start_date: assignmentData.start_date
      }
    });

    if (error) {
      console.error('Error assigning program:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in assignProgramToUser:', error);
    throw error;
  }
};
