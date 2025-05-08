
import { supabase } from "@/integrations/supabase/client";

export interface CustomWorkout {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
  workout_type: string;
  workout_date: string | null;
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
  exercise?: {
    id: string;
    name: string;
    category: string;
    description: string | null;
  };
}

export interface CreateCustomWorkoutExerciseParams {
  workout_id: string;
  exercise_id?: string | null;
  custom_exercise_name?: string | null;
  sets?: number | null;
  reps?: string | null;
  rest_seconds?: number | null;
  notes?: string | null;
  order_index: number;
}

export const fetchCustomWorkouts = async (): Promise<CustomWorkout[]> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from('client_custom_workouts')
    .select('*')
    .eq('user_id', user.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching custom workouts:', error);
    throw error;
  }

  return data as CustomWorkout[];
};

export const createCustomWorkout = async (data: {
  title: string;
  description?: string | null;
  duration_minutes?: number | null;
  workout_type?: string;
}): Promise<CustomWorkout> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data: workout, error } = await supabase
    .from('client_custom_workouts')
    .insert({
      user_id: user.user.id,
      title: data.title,
      description: data.description || null,
      duration_minutes: data.duration_minutes || null,
      workout_type: data.workout_type || 'custom'
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating custom workout:', error);
    throw error;
  }

  return workout as CustomWorkout;
};

export const updateCustomWorkout = async (
  workoutId: string,
  data: {
    title?: string;
    description?: string | null;
    duration_minutes?: number | null;
    workout_type?: string;
  }
): Promise<CustomWorkout> => {
  const { data: workout, error } = await supabase
    .from('client_custom_workouts')
    .update(data)
    .eq('id', workoutId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating custom workout:', error);
    throw error;
  }

  return workout as CustomWorkout;
};

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

export const createCustomWorkoutExercise = async (params: CreateCustomWorkoutExerciseParams): Promise<CustomWorkoutExercise> => {
  // Get the current count of exercises to set the order_index
  const { data: existingExercises } = await supabase
    .from('client_custom_workout_exercises')
    .select('id')
    .eq('workout_id', params.workout_id);

  const orderIndex = params.order_index !== undefined ? params.order_index : (existingExercises?.length || 0);

  const { data: exercise, error } = await supabase
    .from('client_custom_workout_exercises')
    .insert({
      workout_id: params.workout_id,
      exercise_id: params.exercise_id || null,
      custom_exercise_name: params.custom_exercise_name || null,
      sets: params.sets || null,
      reps: params.reps || null,
      rest_seconds: params.rest_seconds || null,
      notes: params.notes || null,
      order_index: orderIndex
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error adding custom workout exercise:', error);
    throw error;
  }

  return exercise as CustomWorkoutExercise;
};

export const updateCustomWorkoutExercise = async (
  exerciseId: string,
  data: {
    exercise_id?: string | null;
    custom_exercise_name?: string | null;
    sets?: number | null;
    reps?: string | null;
    rest_seconds?: number | null;
    notes?: string | null;
    order_index?: number;
  }
): Promise<CustomWorkoutExercise> => {
  const { data: exercise, error } = await supabase
    .from('client_custom_workout_exercises')
    .update(data)
    .eq('id', exerciseId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating custom workout exercise:', error);
    throw error;
  }

  return exercise as CustomWorkoutExercise;
};

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

export const moveCustomWorkoutExerciseUp = async (exerciseId: string, workoutId: string) => {
  // Fetch all exercises to get the current order
  const exercises = await fetchCustomWorkoutExercises(workoutId);
  
  // Find the current exercise
  const currentExercise = exercises.find(ex => ex.id === exerciseId);
  if (!currentExercise) {
    throw new Error('Exercise not found');
  }
  
  // If it's already at the top, do nothing
  if (currentExercise.order_index === 0) {
    return exercises;
  }
  
  // Find the exercise above it
  const previousExercise = exercises.find(ex => ex.order_index === currentExercise.order_index - 1);
  if (!previousExercise) {
    throw new Error('Previous exercise not found');
  }
  
  // Swap their order indices
  await updateCustomWorkoutExercise(currentExercise.id, { order_index: previousExercise.order_index });
  await updateCustomWorkoutExercise(previousExercise.id, { order_index: currentExercise.order_index });
  
  // Return the updated list
  return await fetchCustomWorkoutExercises(workoutId);
};

export const moveCustomWorkoutExerciseDown = async (exerciseId: string, workoutId: string) => {
  // Fetch all exercises to get the current order
  const exercises = await fetchCustomWorkoutExercises(workoutId);
  
  // Find the current exercise
  const currentExercise = exercises.find(ex => ex.id === exerciseId);
  if (!currentExercise) {
    throw new Error('Exercise not found');
  }
  
  // If it's already at the bottom, do nothing
  if (currentExercise.order_index === exercises.length - 1) {
    return exercises;
  }
  
  // Find the exercise below it
  const nextExercise = exercises.find(ex => ex.order_index === currentExercise.order_index + 1);
  if (!nextExercise) {
    throw new Error('Next exercise not found');
  }
  
  // Swap their order indices
  await updateCustomWorkoutExercise(currentExercise.id, { order_index: nextExercise.order_index });
  await updateCustomWorkoutExercise(nextExercise.id, { order_index: currentExercise.order_index });
  
  // Return the updated list
  return await fetchCustomWorkoutExercises(workoutId);
};
