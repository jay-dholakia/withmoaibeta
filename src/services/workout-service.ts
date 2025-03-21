
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

export const fetchWorkoutExercises = async (workoutId: string): Promise<WorkoutExercise[]> => {
  const { data, error } = await supabase
    .from('workout_exercises')
    .select(`
      *,
      exercise:exercise_id (*)
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
  const { data, error } = await supabase
    .from('profiles')
    .select('id, auth.users!id(email)')
    .eq('user_type', 'client');

  if (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }

  // Transform the data to extract emails
  return data.map(profile => ({
    id: profile.id,
    email: profile.users?.email || 'Unknown email'
  }));
};
