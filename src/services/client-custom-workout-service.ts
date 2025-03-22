
import { supabase } from "@/integrations/supabase/client";

export interface CreateCustomWorkoutParams {
  title: string;
  description?: string;
  duration_minutes?: number;
  user_id?: string;
}

export interface CreateCustomWorkoutExerciseParams {
  workout_id: string;
  exercise_id?: string;
  custom_exercise_name?: string | null;
  sets?: number | null;
  reps?: string | null;
  rest_seconds?: number | null;
  notes?: string | null;
  order_index: number;
}

export const createCustomWorkout = async (params: CreateCustomWorkoutParams) => {
  // Get current user if user_id not provided
  if (!params.user_id) {
    const { data: { user } } = await supabase.auth.getUser();
    params.user_id = user?.id;

    if (!params.user_id) {
      throw new Error('User not authenticated');
    }
  }

  const { data, error } = await supabase
    .from('client_custom_workouts')
    .insert({
      title: params.title,
      description: params.description || null,
      duration_minutes: params.duration_minutes || null,
      user_id: params.user_id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating custom workout:', error);
    throw error;
  }

  return data;
};

export const createCustomWorkoutExercise = async (params: CreateCustomWorkoutExerciseParams) => {
  const { data, error } = await supabase
    .from('client_custom_workout_exercises')
    .insert({
      workout_id: params.workout_id,
      exercise_id: params.exercise_id || null,
      custom_exercise_name: params.custom_exercise_name || null,
      sets: params.sets,
      reps: params.reps,
      rest_seconds: params.rest_seconds,
      notes: params.notes,
      order_index: params.order_index
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating custom workout exercise:', error);
    throw error;
  }

  return data;
};

export const fetchCustomWorkout = async (workoutId: string) => {
  const { data, error } = await supabase
    .from('client_custom_workouts')
    .select(`
      *,
      client_custom_workout_exercises (
        *,
        exercise:exercise_id (*)
      )
    `)
    .eq('id', workoutId)
    .single();

  if (error) {
    console.error('Error fetching custom workout:', error);
    throw error;
  }

  return data;
};

export const startCustomWorkout = async (workoutId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('workout_completions')
    .insert({
      user_id: user.id,
      workout_id: workoutId,
      status: 'in_progress'
    })
    .select()
    .single();

  if (error) {
    console.error('Error starting workout:', error);
    throw error;
  }

  return data;
};

export const trackCustomWorkoutSet = async (
  workoutCompletionId: string,
  exerciseId: string,
  setNumber: number,
  weight?: number | null,
  reps?: number | null
) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('workout_set_completions')
    .upsert({
      workout_completion_id: workoutCompletionId,
      workout_exercise_id: exerciseId,
      user_id: user.id,
      set_number: setNumber,
      weight: weight || null,
      reps_completed: reps || null,
      completed: true
    })
    .select()
    .single();

  if (error) {
    console.error('Error tracking workout set:', error);
    throw error;
  }

  return data;
};

export const completeCustomWorkout = async (
  workoutCompletionId: string,
  rating?: number | null,
  notes?: string
) => {
  const { data, error } = await supabase
    .from('workout_completions')
    .update({
      completed_at: new Date().toISOString(),
      status: 'completed',
      rating: rating || null,
      notes: notes || null
    })
    .eq('id', workoutCompletionId)
    .select()
    .single();

  if (error) {
    console.error('Error completing workout:', error);
    throw error;
  }

  return data;
};
