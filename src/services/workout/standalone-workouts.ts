
import { supabase } from '@/integrations/supabase/client';
import { StandaloneWorkout } from '@/types/workout';

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
