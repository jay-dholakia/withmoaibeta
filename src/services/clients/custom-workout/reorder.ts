
import { supabase } from '@/integrations/supabase/client';
import { CustomWorkoutExercise } from './types';
import { fetchCustomWorkoutExercises } from './exercises';
import { updateCustomWorkoutExercise } from './exercises';

/**
 * Move a custom workout exercise up in the order
 */
export const moveCustomWorkoutExerciseUp = async (exerciseId: string, workoutId: string): Promise<CustomWorkoutExercise[]> => {
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

/**
 * Move a custom workout exercise down in the order
 */
export const moveCustomWorkoutExerciseDown = async (exerciseId: string, workoutId: string): Promise<CustomWorkoutExercise[]> => {
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
