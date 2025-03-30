
import { supabase } from "@/integrations/supabase/client";
import { Exercise } from "@/types/workout";

export const createWorkoutExercise = async (data: {
  workout_id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  rest_seconds: number | null;
  notes: string | null;
  order_index: number;
}) => {
  const { data: workoutExercise, error } = await supabase
    .from('workout_exercises')
    .insert(data)
    .select('*')
    .single();

  if (error) {
    console.error('Error creating workout exercise:', error);
    throw error;
  }

  return workoutExercise;
};

export const fetchWorkoutExercises = async (workoutId: string) => {
  const { data: workoutExercises, error } = await supabase
    .from('workout_exercises')
    .select(`
      *,
      exercise:exercise_id (*)
    `)
    .eq('workout_id', workoutId)
    .order('order_index');

  if (error) {
    console.error('Error fetching workout exercises:', error);
    throw error;
  }

  return workoutExercises;
};

export const updateWorkoutExercise = async (exerciseId: string, data: {
  sets?: number;
  reps?: string;
  rest_seconds?: number | null;
  notes?: string | null;
  order_index?: number;
}) => {
  const { data: workoutExercise, error } = await supabase
    .from('workout_exercises')
    .update(data)
    .eq('id', exerciseId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating workout exercise:', error);
    throw error;
  }

  return workoutExercise;
};

export const moveWorkoutExerciseUp = async (exerciseId: string, workoutId: string) => {
  // Fetch all exercises to get the current order
  const exercises = await fetchWorkoutExercises(workoutId);
  
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
  await updateWorkoutExercise(currentExercise.id, { order_index: previousExercise.order_index });
  await updateWorkoutExercise(previousExercise.id, { order_index: currentExercise.order_index });
  
  // Return the updated list
  return await fetchWorkoutExercises(workoutId);
};

export const moveWorkoutExerciseDown = async (exerciseId: string, workoutId: string) => {
  // Fetch all exercises to get the current order
  const exercises = await fetchWorkoutExercises(workoutId);
  
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
  await updateWorkoutExercise(currentExercise.id, { order_index: nextExercise.order_index });
  await updateWorkoutExercise(nextExercise.id, { order_index: currentExercise.order_index });
  
  // Return the updated list
  return await fetchWorkoutExercises(workoutId);
};

export const deleteWorkoutExercise = async (exerciseId: string) => {
  const { error } = await supabase
    .from('workout_exercises')
    .delete()
    .eq('id', exerciseId);

  if (error) {
    console.error('Error deleting workout exercise:', error);
    throw error;
  }
};

export const fetchExercises = async () => {
  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching exercises:', error);
    throw error;
  }

  return exercises;
};

export const fetchExercise = async (exerciseId: string) => {
  const { data: exercise, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', exerciseId)
    .single();

  if (error) {
    console.error('Error fetching exercise:', error);
    throw error;
  }

  return exercise;
};

export const fetchExercisesByCategory = async () => {
  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching exercises by category:', error);
    throw error;
  }

  const exercisesByCategory: Record<string, Exercise[]> = {};
  
  exercisesByCategory['All'] = exercises as Exercise[];
  
  exercises.forEach(exercise => {
    if (!exercisesByCategory[exercise.category]) {
      exercisesByCategory[exercise.category] = [];
    }
    exercisesByCategory[exercise.category].push(exercise as Exercise);
  });

  return exercisesByCategory;
};
