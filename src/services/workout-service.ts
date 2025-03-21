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
  // We'll query a view that joins profiles with auth.users email info,
  // which has been set up by the database administrator
  const { data, error } = await supabase
    .from('profiles')
    .select('id, user_type')
    .eq('user_type', 'client');

  if (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }

  // For now, we'll return client IDs with placeholder emails
  // In a production app, this would need to be implemented differently,
  // perhaps with a database view, function, or edge function
  return data.map(profile => ({
    id: profile.id,
    email: `client_${profile.id.slice(0, 6)}@example.com` 
  }));
};
