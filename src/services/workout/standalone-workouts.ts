import { supabase } from '@/integrations/supabase/client';
import { StandaloneWorkout, WorkoutExercise } from '@/types/workout';

/**
 * Fetches standalone workouts
 */
export const fetchStandaloneWorkouts = async (coachId?: string) => {
  try {
    let query = supabase
      .from('standalone_workouts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (coachId) {
      query = query.eq('coach_id', coachId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching standalone workouts:', error);
    throw error;
  }
};

/**
 * Fetches a specific standalone workout
 */
export const fetchStandaloneWorkout = async (workoutId: string) => {
  try {
    const { data, error } = await supabase
      .from('standalone_workouts')
      .select(`
        *,
        workout_exercises:standalone_workout_exercises(
          *,
          exercise:exercise_id(*)
        )
      `)
      .eq('id', workoutId)
      .maybeSingle();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching standalone workout:', error);
    throw error;
  }
};

/**
 * Creates a standalone workout
 */
export const createStandaloneWorkout = async (workoutData: {
  title: string;
  description?: string | null;
  coach_id: string;
  category?: string;
  workout_type?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('standalone_workouts')
      .insert([workoutData])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating standalone workout:', error);
    throw error;
  }
};

/**
 * Updates a standalone workout
 */
export const updateStandaloneWorkout = async (workoutId: string, workoutData: {
  title?: string;
  description?: string | null;
  category?: string | null;
  workout_type?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('standalone_workouts')
      .update(workoutData)
      .eq('id', workoutId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating standalone workout:', error);
    throw error;
  }
};

/**
 * Deletes a standalone workout
 */
export const deleteStandaloneWorkout = async (workoutId: string) => {
  try {
    const { error } = await supabase
      .from('standalone_workouts')
      .delete()
      .eq('id', workoutId);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting standalone workout:', error);
    throw error;
  }
};

/**
 * Fetches exercises for a specific standalone workout
 */
export const fetchStandaloneWorkoutExercises = async (workoutId: string) => {
  try {
    const { data, error } = await supabase
      .from('standalone_workout_exercises')
      .select(`
        *,
        exercise:exercise_id(*)
      `)
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching standalone workout exercises:', error);
    throw error;
  }
};

/**
 * Creates a standalone workout exercise
 */
export const createStandaloneWorkoutExercise = async (exerciseData: {
  workout_id: string;
  exercise_id: string;
  sets?: number;
  reps?: string;
  rest_seconds?: number;
  notes?: string;
  order_index: number;
}) => {
  try {
    const { data, error } = await supabase
      .from('standalone_workout_exercises')
      .insert([exerciseData])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating standalone workout exercise:', error);
    throw error;
  }
};

/**
 * Updates a standalone workout exercise
 */
export const updateStandaloneWorkoutExercise = async (exerciseId: string, exerciseData: {
  sets?: number;
  reps?: string;
  rest_seconds?: number;
  notes?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('standalone_workout_exercises')
      .update(exerciseData)
      .eq('id', exerciseId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating standalone workout exercise:', error);
    throw error;
  }
};

/**
 * Deletes a standalone workout exercise
 */
export const deleteStandaloneWorkoutExercise = async (exerciseId: string) => {
  try {
    const { error } = await supabase
      .from('standalone_workout_exercises')
      .delete()
      .eq('id', exerciseId);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting standalone workout exercise:', error);
    throw error;
  }
};

/**
 * Moves a standalone workout exercise up in order
 */
export const moveStandaloneWorkoutExerciseUp = async (exerciseId: string, workoutId: string) => {
  try {
    // Get current exercises
    const { data: exercises } = await supabase
      .from('standalone_workout_exercises')
      .select('id, order_index')
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });

    if (!exercises || exercises.length < 2) {
      return exercises;
    }

    const currentIndex = exercises.findIndex(e => e.id === exerciseId);
    
    if (currentIndex <= 0) {
      return exercises; // Already at the top
    }

    const previousExercise = exercises[currentIndex - 1];
    const currentExercise = exercises[currentIndex];

    // Swap order indices
    await supabase
      .from('standalone_workout_exercises')
      .update({ order_index: currentExercise.order_index })
      .eq('id', previousExercise.id);

    await supabase
      .from('standalone_workout_exercises')
      .update({ order_index: previousExercise.order_index })
      .eq('id', exerciseId);

    // Get updated exercises
    const { data: updatedExercises } = await supabase
      .from('standalone_workout_exercises')
      .select(`
        *,
        exercise:exercise_id(*)
      `)
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });

    return updatedExercises || [];
  } catch (error) {
    console.error('Error moving standalone workout exercise up:', error);
    throw error;
  }
};

/**
 * Moves a standalone workout exercise down in order
 */
export const moveStandaloneWorkoutExerciseDown = async (exerciseId: string, workoutId: string) => {
  try {
    // Get current exercises
    const { data: exercises } = await supabase
      .from('standalone_workout_exercises')
      .select('id, order_index')
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });

    if (!exercises || exercises.length < 2) {
      return exercises;
    }

    const currentIndex = exercises.findIndex(e => e.id === exerciseId);
    
    if (currentIndex === -1 || currentIndex >= exercises.length - 1) {
      return exercises; // Already at the bottom or not found
    }

    const nextExercise = exercises[currentIndex + 1];
    const currentExercise = exercises[currentIndex];

    // Swap order indices
    await supabase
      .from('standalone_workout_exercises')
      .update({ order_index: currentExercise.order_index })
      .eq('id', nextExercise.id);

    await supabase
      .from('standalone_workout_exercises')
      .update({ order_index: nextExercise.order_index })
      .eq('id', exerciseId);

    // Get updated exercises
    const { data: updatedExercises } = await supabase
      .from('standalone_workout_exercises')
      .select(`
        *,
        exercise:exercise_id(*)
      `)
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });

    return updatedExercises || [];
  } catch (error) {
    console.error('Error moving standalone workout exercise down:', error);
    throw error;
  }
};

/**
 * Reorders standalone workout templates
 * This function handles reordering workouts by updating their order_index values
 */
export const reorderStandaloneWorkouts = async (
  coachId: string,
  workoutsOrder: { id: string, order_index: number }[]
) => {
  try {
    // First ensure all workouts have order_index field
    await ensureWorkoutsHaveOrderIndex(coachId);
    
    // Update each workout's order_index one by one
    for (const workout of workoutsOrder) {
      await supabase
        .from('standalone_workouts')
        .update({ order_index: workout.order_index })
        .eq('id', workout.id);
    }
    
    // Fetch and return the updated workout list
    return await fetchStandaloneWorkouts(coachId);
  } catch (error) {
    console.error('Error reordering standalone workouts:', error);
    throw error;
  }
};

/**
 * Ensures all workouts have an order_index field
 * This is necessary for initial setup of draggable sorting
 */
const ensureWorkoutsHaveOrderIndex = async (coachId: string) => {
  try {
    // Check if workouts already have order_index
    const { data: workouts } = await supabase
      .from('standalone_workouts')
      .select('id, order_index')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });
    
    if (!workouts) return;
    
    // If any workout lacks an order_index, set them all based on current order
    const needsUpdate = workouts.some(w => w.order_index === null);
    
    if (needsUpdate) {
      // Update each workout with an order index
      for (let i = 0; i < workouts.length; i++) {
        await supabase
          .from('standalone_workouts')
          .update({ order_index: i })
          .eq('id', workouts[i].id);
      }
    }
  } catch (error) {
    console.error('Error ensuring order indices:', error);
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
 * Reorders standalone workout exercises
 */
export const reorderStandaloneWorkoutExercises = async (
  workoutId: string,
  exercisesOrder: ReorderExerciseInput[]
): Promise<WorkoutExercise[]> => {
  try {
    // First, set all to a temporary negative number to avoid constraint conflicts
    // This approach avoids unique constraint issues during reordering
    for (let i = 0; i < exercisesOrder.length; i++) {
      await supabase
        .from('standalone_workout_exercises')
        .update({ order_index: -1000 - i })
        .eq('id', exercisesOrder[i].id);
    }

    // Then, set the actual new order
    for (const exercise of exercisesOrder) {
      await supabase
        .from('standalone_workout_exercises')
        .update({ order_index: exercise.order_index })
        .eq('id', exercise.id);
    }

    // Return the updated list
    const { data, error } = await supabase
      .from('standalone_workout_exercises')
      .select(`
        *,
        exercise:exercise_id(*)
      `)
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error reordering exercises:', error);
    throw error;
  }
};
