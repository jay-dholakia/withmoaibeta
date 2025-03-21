import { supabase } from "@/integrations/supabase/client";
import { 
  Exercise, 
  WorkoutProgram, 
  WorkoutWeek, 
  Workout, 
  WorkoutExercise,
  ProgramAssignment
} from "@/types/workout";

// Exercise related functions
export const fetchExercises = async (): Promise<Exercise[]> => {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching exercises:', error);
    throw error;
  }

  return data as Exercise[];
};

export const fetchExercisesByCategory = async (): Promise<Record<string, Exercise[]>> => {
  const exercises = await fetchExercises();
  
  return exercises.reduce((acc, exercise) => {
    if (!acc[exercise.category]) {
      acc[exercise.category] = [];
    }
    acc[exercise.category].push(exercise);
    return acc;
  }, {} as Record<string, Exercise[]>);
};

// Workout Program related functions
export const createWorkoutProgram = async (program: Omit<WorkoutProgram, 'id' | 'created_at' | 'updated_at'>): Promise<WorkoutProgram> => {
  const { data, error } = await supabase
    .from('workout_programs')
    .insert(program)
    .select()
    .single();

  if (error) {
    console.error('Error creating workout program:', error);
    throw error;
  }

  return data as WorkoutProgram;
};

export const fetchWorkoutPrograms = async (coachId: string): Promise<WorkoutProgram[]> => {
  const { data, error } = await supabase
    .from('workout_programs')
    .select('*')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching workout programs:', error);
    throw error;
  }

  return data as WorkoutProgram[];
};

export const fetchWorkoutProgram = async (programId: string): Promise<WorkoutProgram> => {
  const { data, error } = await supabase
    .from('workout_programs')
    .select('*')
    .eq('id', programId)
    .single();

  if (error) {
    console.error(`Error fetching workout program with ID ${programId}:`, error);
    throw error;
  }

  return data as WorkoutProgram;
};

export const deleteWorkoutProgram = async (programId: string): Promise<void> => {
  // First, fetch all weeks for this program
  const weeks = await fetchWorkoutWeeks(programId);
  
  // Delete all weeks (which will cascade to delete workouts and exercises)
  for (const week of weeks) {
    await deleteWorkoutWeek(week.id);
  }
  
  // Finally, delete the program itself
  const { error } = await supabase
    .from('workout_programs')
    .delete()
    .eq('id', programId);

  if (error) {
    console.error(`Error deleting workout program ${programId}:`, error);
    throw error;
  }
};

// Workout Week related functions
export const createWorkoutWeek = async (week: Omit<WorkoutWeek, 'id' | 'created_at'>): Promise<WorkoutWeek> => {
  const { data, error } = await supabase
    .from('workout_weeks')
    .insert(week)
    .select()
    .single();

  if (error) {
    console.error('Error creating workout week:', error);
    throw error;
  }

  return data as WorkoutWeek;
};

export const updateWorkoutWeek = async (
  weekId: string,
  updates: Partial<Omit<WorkoutWeek, 'id' | 'created_at' | 'program_id'>>
): Promise<WorkoutWeek> => {
  const { data, error } = await supabase
    .from('workout_weeks')
    .update(updates)
    .eq('id', weekId)
    .select()
    .single();

  if (error) {
    console.error(`Error updating workout week ${weekId}:`, error);
    throw error;
  }

  return data as WorkoutWeek;
};

export const fetchWorkoutWeeks = async (programId: string): Promise<WorkoutWeek[]> => {
  const { data, error } = await supabase
    .from('workout_weeks')
    .select('*')
    .eq('program_id', programId)
    .order('week_number');

  if (error) {
    console.error(`Error fetching workout weeks for program ${programId}:`, error);
    throw error;
  }

  return data as WorkoutWeek[];
};

export const deleteWorkoutWeek = async (weekId: string): Promise<void> => {
  // First, fetch all workouts for this week
  const workouts = await fetchWorkouts(weekId);
  
  // Delete all workouts (which will cascade to delete workout exercises)
  for (const workout of workouts) {
    await deleteWorkout(workout.id);
  }
  
  // Finally, delete the week itself
  const { error } = await supabase
    .from('workout_weeks')
    .delete()
    .eq('id', weekId);

  if (error) {
    console.error(`Error deleting workout week ${weekId}:`, error);
    throw error;
  }
};

// Workout (daily) related functions
export const createWorkout = async (workout: Omit<Workout, 'id' | 'created_at'>): Promise<Workout> => {
  const { data, error } = await supabase
    .from('workouts')
    .insert(workout)
    .select()
    .single();

  if (error) {
    console.error('Error creating workout:', error);
    throw error;
  }

  return data as Workout;
};

export const updateWorkout = async (workoutId: string, updates: Partial<Omit<Workout, 'id' | 'created_at'>>): Promise<Workout> => {
  const { data, error } = await supabase
    .from('workouts')
    .update(updates)
    .eq('id', workoutId)
    .select()
    .single();

  if (error) {
    console.error(`Error updating workout ${workoutId}:`, error);
    throw error;
  }

  return data as Workout;
};

export const fetchWorkouts = async (weekId: string): Promise<Workout[]> => {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('week_id', weekId)
    .order('day_of_week');

  if (error) {
    console.error(`Error fetching workouts for week ${weekId}:`, error);
    throw error;
  }

  return data as Workout[];
};

export const fetchWorkout = async (workoutId: string): Promise<Workout> => {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', workoutId)
    .single();

  if (error) {
    console.error(`Error fetching workout ${workoutId}:`, error);
    throw error;
  }

  return data as Workout;
};

export const deleteWorkout = async (workoutId: string): Promise<void> => {
  // First, delete all workout exercises for this workout
  const { error: exercisesError } = await supabase
    .from('workout_exercises')
    .delete()
    .eq('workout_id', workoutId);

  if (exercisesError) {
    console.error(`Error deleting workout exercises for workout ${workoutId}:`, exercisesError);
    throw exercisesError;
  }
  
  // Then delete the workout itself
  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', workoutId);

  if (error) {
    console.error(`Error deleting workout ${workoutId}:`, error);
    throw error;
  }
};

// Workout Exercise related functions
export const createWorkoutExercise = async (workoutExercise: Omit<WorkoutExercise, 'id' | 'created_at'>): Promise<WorkoutExercise> => {
  const { data, error } = await supabase
    .from('workout_exercises')
    .insert(workoutExercise)
    .select()
    .single();

  if (error) {
    console.error('Error creating workout exercise:', error);
    throw error;
  }

  return data as WorkoutExercise;
};

export const updateWorkoutExercise = async (
  exerciseId: string, 
  updates: Partial<Omit<WorkoutExercise, 'id' | 'created_at' | 'workout_id' | 'exercise_id'>>
): Promise<WorkoutExercise> => {
  const { data, error } = await supabase
    .from('workout_exercises')
    .update(updates)
    .eq('id', exerciseId)
    .select()
    .single();

  if (error) {
    console.error(`Error updating workout exercise ${exerciseId}:`, error);
    throw error;
  }

  return data as WorkoutExercise;
};

export const deleteWorkoutExercise = async (exerciseId: string): Promise<void> => {
  const { error } = await supabase
    .from('workout_exercises')
    .delete()
    .eq('id', exerciseId);

  if (error) {
    console.error(`Error deleting workout exercise ${exerciseId}:`, error);
    throw error;
  }
};

export const fetchWorkoutExercises = async (workoutId: string): Promise<WorkoutExercise[]> => {
  const { data, error } = await supabase
    .from('workout_exercises')
    .select(`
      *,
      exercise:exercise_id (*),
      workout:workout_id (*)
    `)
    .eq('workout_id', workoutId)
    .order('order_index');

  if (error) {
    console.error(`Error fetching workout exercises for workout ${workoutId}:`, error);
    throw error;
  }

  return data as WorkoutExercise[];
};

// Program Assignment related functions
export const assignProgramToUser = async (assignment: Omit<ProgramAssignment, 'id' | 'created_at'>): Promise<ProgramAssignment> => {
  const { data, error } = await supabase
    .from('program_assignments')
    .insert(assignment)
    .select()
    .single();

  if (error) {
    console.error('Error assigning program to user:', error);
    throw error;
  }

  return data as ProgramAssignment;
};

export const fetchAssignedUsers = async (programId: string): Promise<ProgramAssignment[]> => {
  const { data, error } = await supabase
    .from('program_assignments')
    .select('*')
    .eq('program_id', programId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching assigned users for program ${programId}:`, error);
    throw error;
  }

  return data as ProgramAssignment[];
};

export const fetchAllClients = async (): Promise<{ id: string; email: string }[]> => {
  try {
    // Query to get all users with user_type = 'client'
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_type', 'client');

    if (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }

    if (!profiles || profiles.length === 0) {
      return [];
    }

    // Load more detailed client information - fetch from client_profiles if available
    const clientsWithDetails = [];
    for (const profile of profiles) {
      try {
        const { data: clientProfile } = await supabase
          .from('client_profiles')
          .select('id, first_name, last_name')
          .eq('id', profile.id)
          .maybeSingle();
          
        // Create a display name using whatever info we have
        let displayName = `Client ${profile.id.slice(0, 6)}`;
        if (clientProfile && (clientProfile.first_name || clientProfile.last_name)) {
          displayName = [clientProfile.first_name, clientProfile.last_name]
            .filter(Boolean)
            .join(' ') || displayName;
        }
        
        clientsWithDetails.push({
          id: profile.id,
          email: displayName
        });
      } catch (detailError) {
        console.error('Error fetching client details:', detailError);
        // Still include the client even if details fetch fails
        clientsWithDetails.push({
          id: profile.id,
          email: `Client ${profile.id.slice(0, 6)}`
        });
      }
    }

    console.log('Processed clients with details:', clientsWithDetails);
    return clientsWithDetails;
  } catch (error) {
    console.error('Error in fetchAllClients:', error);
    throw error;
  }
};

