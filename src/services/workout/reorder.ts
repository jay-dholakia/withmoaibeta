import { supabase } from '@/integrations/supabase/client';
import { CustomWorkoutExercise } from '@/services/clients/custom-workout/types';
import { fetchCustomWorkoutExercises, updateCustomWorkoutExercise } from '@/services/clients/custom-workout/exercises';
import { fetchWorkoutExercises } from '../workout-service';

/**
 * Move a custom workout exercise up in the order
 */
export const moveCustomWorkoutExerciseUp = async (exerciseId: string, workoutId: string): Promise<CustomWorkoutExercise[]> => {
  try {
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
    
    // Store the original indices
    const currentIndex = currentExercise.order_index;
    const previousIndex = previousExercise.order_index;
    
    // Update the previous exercise first (to avoid constraint conflicts)
    await updateCustomWorkoutExercise(previousExercise.id, { 
      order_index: -1 // Temporary index to avoid conflicts
    });
    
    // Update the current exercise
    await updateCustomWorkoutExercise(currentExercise.id, { 
      order_index: previousIndex 
    });
    
    // Now update the previous exercise to the current index
    await updateCustomWorkoutExercise(previousExercise.id, { 
      order_index: currentIndex 
    });
    
    // Return the updated list
    return await fetchCustomWorkoutExercises(workoutId);
  } catch (error) {
    console.error('Error moving exercise up:', error);
    throw error;
  }
};

/**
 * Move a custom workout exercise down in the order
 */
export const moveCustomWorkoutExerciseDown = async (exerciseId: string, workoutId: string): Promise<CustomWorkoutExercise[]> => {
  try {
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
    
    // Store the original indices
    const currentIndex = currentExercise.order_index;
    const nextIndex = nextExercise.order_index;
    
    // Update the next exercise first (to avoid constraint conflicts)
    await updateCustomWorkoutExercise(nextExercise.id, { 
      order_index: -1 // Temporary index to avoid conflicts
    });
    
    // Update the current exercise
    await updateCustomWorkoutExercise(currentExercise.id, { 
      order_index: nextIndex 
    });
    
    // Now update the next exercise to the current index
    await updateCustomWorkoutExercise(nextExercise.id, { 
      order_index: currentIndex 
    });
    
    // Return the updated list
    return await fetchCustomWorkoutExercises(workoutId);
  } catch (error) {
    console.error('Error moving exercise down:', error);
    throw error;
  }
};

/**
 * Interface for the reorder update input
 */
interface ReorderExerciseInput {
  id: string;
  order_index: number;
}

/**
 * Batch update the order of multiple exercises at once
 * This is more efficient for drag and drop reordering
 */
export const reorderCustomWorkoutExercises = async (
  workoutId: string, 
  exercisesOrder: ReorderExerciseInput[]
): Promise<CustomWorkoutExercise[]> => {
  try {
    // First, set all to a temporary negative number to avoid constraint conflicts
    // This approach avoids unique constraint issues during reordering
    for (let i = 0; i < exercisesOrder.length; i++) {
      await updateCustomWorkoutExercise(exercisesOrder[i].id, { 
        order_index: -1000 - i 
      });
    }

    // Then, set the actual new order
    for (const exercise of exercisesOrder) {
      await updateCustomWorkoutExercise(exercise.id, { 
        order_index: exercise.order_index 
      });
    }

    // Return the updated list
    return await fetchCustomWorkoutExercises(workoutId);
  } catch (error) {
    console.error('Error reordering exercises:', error);
    throw error;
  }
};

/**
 * Reorder workout exercises - for regular workouts, not custom workouts
 */
export const reorderWorkoutExercises = async (
  workoutId: string,
  exercisesOrder: ReorderExerciseInput[]
): Promise<any[]> => {
  try {
    console.log('Reordering workout exercises:', exercisesOrder);
    
    // First set temporary indices to avoid constraint conflicts
    for (let i = 0; i < exercisesOrder.length; i++) {
      await supabase
        .from('workout_exercises')
        .update({ order_index: -1000 - i })
        .eq('id', exercisesOrder[i].id);
    }
    
    // Then set the actual new order
    for (const exercise of exercisesOrder) {
      console.log(`Setting exercise ${exercise.id} order_index to ${exercise.order_index}`);
      await supabase
        .from('workout_exercises')
        .update({ order_index: exercise.order_index })
        .eq('id', exercise.id);
    }
    
    // Return the updated list
    return await fetchWorkoutExercises(workoutId);
  } catch (error) {
    console.error('Error reordering workout exercises:', error);
    throw error;
  }
};

/**
 * Reorder workouts within a week
 */
export const reorderWorkoutsInWeek = async (
  weekId: string,
  workoutsOrder: { id: string; priority: number }[]
): Promise<any[]> => {
  try {
    console.log('Reordering workouts in week:', workoutsOrder);
    
    // First set temporary priorities to avoid constraint conflicts
    for (let i = 0; i < workoutsOrder.length; i++) {
      await supabase
        .from('workouts')
        .update({ priority: -1000 - i })
        .eq('id', workoutsOrder[i].id);
    }
    
    // Then set the actual new priorities
    for (const workout of workoutsOrder) {
      console.log(`Setting workout ${workout.id} priority to ${workout.priority}`);
      await supabase
        .from('workouts')
        .update({ priority: workout.priority })
        .eq('id', workout.id);
    }
    
    // Return the updated list
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('week_id', weekId)
      .order('priority', { ascending: true })
      .order('day_of_week', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error reordering workouts in week:', error);
    throw error;
  }
};
