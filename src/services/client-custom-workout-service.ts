import { supabase } from "@/integrations/supabase/client";
import { Exercise } from "@/types/workout";
import { WorkoutType } from "@/components/client/WorkoutTypeIcon";

export interface CustomWorkout {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  workout_type: WorkoutType;
  created_at: string;
  updated_at: string;
}

export interface CustomWorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string | null;
  custom_exercise_name: string | null;
  sets: number | null;
  reps: string | null;
  rest_seconds: number | null;
  notes: string | null;
  order_index: number;
  created_at: string;
  exercise?: Exercise;
}

export interface CreateCustomWorkoutParams {
  title: string;
  description?: string;
  duration_minutes?: number;
  workout_type?: WorkoutType;
}

export interface CreateCustomWorkoutExerciseParams {
  workout_id: string;
  exercise_id?: string;
  custom_exercise_name?: string;
  sets?: number;
  reps?: string;
  rest_seconds?: number;
  notes?: string;
  order_index: number;
}

// Create a new custom workout
export const createCustomWorkout = async (params: CreateCustomWorkoutParams): Promise<CustomWorkout> => {
  const { data, error } = await supabase
    .from('client_custom_workouts')
    .insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      title: params.title,
      description: params.description || null,
      duration_minutes: params.duration_minutes || null,
      workout_type: params.workout_type || 'custom',
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating custom workout:', error);
    throw error;
  }

  return data as CustomWorkout;
};

// Create a custom workout exercise
export const createCustomWorkoutExercise = async (params: CreateCustomWorkoutExerciseParams): Promise<CustomWorkoutExercise> => {
  const { data, error } = await supabase
    .from('client_custom_workout_exercises')
    .insert({
      workout_id: params.workout_id,
      exercise_id: params.exercise_id || null,
      custom_exercise_name: params.custom_exercise_name || null,
      sets: params.sets || null,
      reps: params.reps || null,
      rest_seconds: params.rest_seconds || null,
      notes: params.notes || null,
      order_index: params.order_index,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating custom workout exercise:', error);
    throw error;
  }

  return data as CustomWorkoutExercise;
};

// Fetch custom workouts for the current user
export const fetchCustomWorkouts = async (): Promise<CustomWorkout[]> => {
  const { data, error } = await supabase
    .from('client_custom_workouts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching custom workouts:', error);
    throw error;
  }

  return data as CustomWorkout[];
};

// Fetch exercises for a custom workout
export const fetchCustomWorkoutExercises = async (workoutId: string): Promise<CustomWorkoutExercise[]> => {
  const { data, error } = await supabase
    .from('client_custom_workout_exercises')
    .select(`
      *,
      exercise:exercise_id (*)
    `)
    .eq('workout_id', workoutId)
    .order('order_index');

  if (error) {
    console.error('Error fetching custom workout exercises:', error);
    throw error;
  }

  return data as CustomWorkoutExercise[];
};

// Delete a custom workout
export const deleteCustomWorkout = async (workoutId: string): Promise<void> => {
  const { error } = await supabase
    .from('client_custom_workouts')
    .delete()
    .eq('id', workoutId);

  if (error) {
    console.error('Error deleting custom workout:', error);
    throw error;
  }
};

// Delete a custom workout exercise
export const deleteCustomWorkoutExercise = async (exerciseId: string): Promise<void> => {
  const { error } = await supabase
    .from('client_custom_workout_exercises')
    .delete()
    .eq('id', exerciseId);

  if (error) {
    console.error('Error deleting custom workout exercise:', error);
    throw error;
  }
};
