import { supabase } from "@/integrations/supabase/client";
import { ProgramAssignment, WorkoutExercise, WorkoutProgram, WorkoutWeek } from "@/types/workout";

/**
 * Fetches all workout programs
 */
export const fetchWorkoutPrograms = async (coachId?: string): Promise<any[]> => {
  try {
    let query = supabase
      .from('workout_programs')
      .select('*');
    
    if (coachId) {
      query = query.eq('coach_id', coachId);
    }
    
    const { data, error } = await query;
    
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
export const updateWorkoutWeek = async (
  weekId: string,
  data: {
    title?: string;
    description?: string | null;
    target_miles_run?: number;
    target_cardio_minutes?: number;
    target_strength_workouts?: number;
    target_strength_mobility_workouts?: number;
  }
): Promise<any> => {
  try {
    const { data: updatedWeek, error } = await supabase
      .from('workout_weeks')
      .update(data)
      .eq('id', weekId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating workout week:', error);
      throw error;
    }

    return updatedWeek;
  } catch (error) {
    console.error('Failed to update workout week:', error);
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
 * Fetches all workouts for a program
 */
export const fetchWorkouts = async (weekId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('week_id', weekId)
      .order('day_of_week', { ascending: true });
    
    if (error) {
      console.error("Error fetching workouts:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching workouts:", error);
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
 * Fetches exercises by category
 */
export const fetchExercisesByCategory = async (): Promise<Record<string, any[]>> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name');
    
    if (error) {
      console.error("Error fetching exercises by category:", error);
      return {};
    }
    
    const exercisesByCategory: Record<string, any[]> = { 'All': data || [] };
    
    if (data) {
      data.forEach(exercise => {
        const category = exercise.category || 'Uncategorized';
        
        if (!exercisesByCategory[category]) {
          exercisesByCategory[category] = [];
        }
        
        exercisesByCategory[category].push(exercise);
      });
    }
    
    return exercisesByCategory;
  } catch (error) {
    console.error("Error fetching exercises by category:", error);
    return { 'All': [] };
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
      .order('order_index', { ascending: true });
    
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
export const fetchAllClients = async () => {
  try {
    // Define an interface for the client profiles data structure
    interface ClientProfileData {
      first_name: string | null;
      last_name: string | null;
    }

    interface ClientQueryResult {
      id: string;
      user_type: string;
      client_profiles: ClientProfileData[] | null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        user_type,
        client_profiles (
          first_name,
          last_name
        )
      `)
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

    // Merge profile data with emails
    const clientsWithEmail = data.map(client => {
      const typedClient = client as unknown as ClientQueryResult;
      const emailInfo = emailData?.find(e => e.id === typedClient.id);
      const profileData = typedClient.client_profiles?.[0] || { first_name: null, last_name: null };
      
      return {
        id: typedClient.id,
        email: emailInfo?.email || 'No email',
        user_type: typedClient.user_type,
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
      console.error("Error deleting program assignment:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting program assignment:", error);
    return false;
  }
};

/**
 * Gets the count of assignments for each workout program
 */
export const getWorkoutProgramAssignmentCount = async (programId: string | string[]): Promise<Record<string, number>> => {
  try {
    const programIds = Array.isArray(programId) ? programId : [programId];
    
    if (!programIds.length) return {};
    
    const { data, error } = await supabase
      .from('program_assignments')
      .select('program_id')
      .in('program_id', programIds);
    
    if (error) {
      console.error("Error getting assignment counts:", error);
      return {};
    }
    
    const counts: Record<string, number> = {};
    programIds.forEach(id => counts[id] = 0);
    
    if (data) {
      data.forEach(assignment => {
        const programId = assignment.program_id;
        counts[programId] = (counts[programId] || 0) + 1;
      });
    }
    
    return counts;
  } catch (error) {
    console.error("Error getting assignment counts:", error);
    return {};
  }
};

/**
 * Functions for standalone workouts
 */
export const fetchStandaloneWorkouts = async (coachId?: string): Promise<any[]> => {
  try {
    let query = supabase
      .from('standalone_workouts')
      .select('*');
    
    if (coachId) {
      query = query.eq('coach_id', coachId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching standalone workouts:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching standalone workouts:", error);
    return [];
  }
};

export const createStandaloneWorkout = async (workoutData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('standalone_workouts')
      .insert([workoutData])
      .select()
      .single();
    
    if (error) {
      console.error("Error creating standalone workout:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error creating standalone workout:", error);
    throw error;
  }
};

export const updateStandaloneWorkout = async (id: string, workoutData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('standalone_workouts')
      .update(workoutData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating standalone workout:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error updating standalone workout:", error);
    throw error;
  }
};

export const deleteStandaloneWorkout = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('standalone_workouts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error("Error deleting standalone workout:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting standalone workout:", error);
    return false;
  }
};

export const fetchStandaloneWorkout = async (id: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('standalone_workouts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error("Error fetching standalone workout:", error);
      return null;
    }
    
    return data || null;
  } catch (error) {
    console.error("Error fetching standalone workout:", error);
    return null;
  }
};

export const createStandaloneWorkoutExercise = async (exerciseData: any): Promise<any> => {
  return createWorkoutExercise(exerciseData);
};

export const fetchStandaloneWorkoutExercises = async (workoutId: string): Promise<any[]> => {
  return fetchWorkoutExercises(workoutId);
};

export const updateStandaloneWorkoutExercise = async (id: string, exerciseData: any): Promise<any> => {
  return updateWorkoutExercise(id, exerciseData);
};

export const deleteStandaloneWorkoutExercise = async (id: string): Promise<boolean> => {
  return deleteWorkoutExercise(id);
};

// Functions for moving workout exercises up and down
export const moveWorkoutExerciseUp = async (exerciseId: string, workoutId: string): Promise<any[]> => {
  try {
    // First, get all exercises for this workout
    const exercises = await fetchWorkoutExercises(workoutId);
    
    // Find the exercise we want to move and its index
    const index = exercises.findIndex(e => e.id === exerciseId);
    
    // If it's already at the top or not found, do nothing
    if (index <= 0) return exercises;
    
    // Get the exercise above it
    const currentExercise = exercises[index];
    const previousExercise = exercises[index - 1];
    
    // Swap their order_index values
    await Promise.all([
      updateWorkoutExercise(currentExercise.id, { order_index: previousExercise.order_index }),
      updateWorkoutExercise(previousExercise.id, { order_index: currentExercise.order_index })
    ]);
    
    // Fetch and return the updated list
    return fetchWorkoutExercises(workoutId);
  } catch (error) {
    console.error("Error moving exercise up:", error);
    throw error;
  }
};

export const moveWorkoutExerciseDown = async (exerciseId: string, workoutId: string): Promise<any[]> => {
  try {
    // First, get all exercises for this workout
    const exercises = await fetchWorkoutExercises(workoutId);
    
    // Find the exercise we want to move and its index
    const index = exercises.findIndex(e => e.id === exerciseId);
    
    // If it's already at the bottom or not found, do nothing
    if (index === -1 || index >= exercises.length - 1) return exercises;
    
    // Get the exercise below it
    const currentExercise = exercises[index];
    const nextExercise = exercises[index + 1];
    
    // Swap their order_index values
    await Promise.all([
      updateWorkoutExercise(currentExercise.id, { order_index: nextExercise.order_index }),
      updateWorkoutExercise(nextExercise.id, { order_index: currentExercise.order_index })
    ]);
    
    // Fetch and return the updated list
    return fetchWorkoutExercises(workoutId);
  } catch (error) {
    console.error("Error moving exercise down:", error);
    throw error;
  }
};

// Same functions but for standalone workouts
export const moveStandaloneWorkoutExerciseUp = moveWorkoutExerciseUp;
export const moveStandaloneWorkoutExerciseDown = moveWorkoutExerciseDown;

/**
 * Functions for adding workouts to weeks
 */
export const addWorkoutToWeek = async (weekId: string, workoutData: any): Promise<any> => {
  return createWorkout({
    ...workoutData,
    week_id: weekId
  });
};

export const copyTemplateWorkoutToWeek = async (templateId: string, weekId: string): Promise<any> => {
  try {
    // First, get the template workout
    const template = await fetchStandaloneWorkout(templateId);
    if (!template) {
      throw new Error("Template workout not found");
    }
    
    // Create a new workout in the week based on the template
    const newWorkout = await createWorkout({
      week_id: weekId,
      title: template.title,
      description: template.description,
      workout_type: template.workout_type,
      day_of_week: 0, // Default to first day, user can change
      priority: 0 // Default priority
    });
    
    // Get all exercises from the template
    const templateExercises = await fetchWorkoutExercises(templateId);
    
    // Add all exercises to the new workout
    for (let i = 0; i < templateExercises.length; i++) {
      const exercise = templateExercises[i];
      await createWorkoutExercise({
        workout_id: newWorkout.id,
        exercise_id: exercise.exercise_id,
        sets: exercise.sets,
        reps: exercise.reps,
        rest_seconds: exercise.rest_seconds,
        notes: exercise.notes,
        order_index: i
      });
    }
    
    return newWorkout;
  } catch (error) {
    console.error("Error copying template workout:", error);
    throw error;
  }
};

export const copyWorkoutToWeek = async (sourceWorkoutId: string, targetWeekId: string): Promise<any> => {
  try {
    // First, get the source workout
    const sourceWorkout = await fetchWorkout(sourceWorkoutId);
    if (!sourceWorkout) {
      throw new Error("Source workout not found");
    }
    
    // Create a new workout in the target week based on the source
    const newWorkout = await createWorkout({
      week_id: targetWeekId,
      title: sourceWorkout.title,
      description: sourceWorkout.description,
      workout_type: sourceWorkout.workout_type,
      day_of_week: sourceWorkout.day_of_week,
      priority: sourceWorkout.priority
    });
    
    // Get all exercises from the source workout
    const sourceExercises = await fetchWorkoutExercises(sourceWorkoutId);
    
    // Add all exercises to the new workout
    for (let i = 0; i < sourceExercises.length; i++) {
      const exercise = sourceExercises[i];
      await createWorkoutExercise({
        workout_id: newWorkout.id,
        exercise_id: exercise.exercise_id,
        sets: exercise.sets,
        reps: exercise.reps,
        rest_seconds: exercise.rest_seconds,
        notes: exercise.notes,
        order_index: i
      });
    }
    
    return newWorkout;
  } catch (error) {
    console.error("Error copying workout:", error);
    throw error;
  }
};
