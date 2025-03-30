
import { supabase } from "@/integrations/supabase/client";

export interface WorkoutCompletion {
  id: string;
  user_id: string;
  workout_id: string | null;
  created_at: string;
  completed_at: string | null;
  rest_day: boolean;
  life_happens_pass: boolean;
  notes: string | null;
  rating: number | null;
  title: string | null;
  description: string | null;
  workout_type: string | null;
  distance: number | null;
  duration: string | null;
  location: string | null;
  workout?: {
    id: string;
    title: string;
    description: string | null;
  };
}

export interface WorkoutCompletionExercise {
  id: string;
  workout_completion_id: string;
  exercise_id: string;
  completed: boolean;
  created_at: string;
  result: any; // This can be structured based on the exercise type
  exercise?: {
    id: string;
    name: string;
    description: string | null;
    log_type: 'weight_reps' | 'duration_distance' | 'duration';
    category: string;
  };
}

/**
 * Fetches a workout completion by ID
 */
export const fetchWorkoutCompletion = async (workoutCompletionId: string): Promise<WorkoutCompletion> => {
  try {
    const { data, error } = await supabase
      .from('workout_completions')
      .select(`
        *,
        workout:workout_id (
          id,
          title,
          description
        )
      `)
      .eq('id', workoutCompletionId)
      .single();

    if (error) throw error;
    
    // Ensure the data conforms to the WorkoutCompletion interface
    const completion: WorkoutCompletion = {
      id: data.id,
      user_id: data.user_id,
      workout_id: data.workout_id,
      created_at: data.created_at || new Date().toISOString(),
      completed_at: data.completed_at,
      rest_day: data.rest_day || false,
      life_happens_pass: data.life_happens_pass || false,
      notes: data.notes,
      rating: data.rating,
      title: data.title,
      description: data.description,
      workout_type: data.workout_type,
      distance: data.distance,
      duration: data.duration,
      location: data.location,
      workout: data.workout
    };
    
    return completion;
  } catch (error) {
    console.error('Error fetching workout completion:', error);
    throw error;
  }
};

/**
 * Fetches exercises for a workout completion
 */
export const fetchWorkoutCompletionExercises = async (workoutCompletionId: string): Promise<WorkoutCompletionExercise[]> => {
  try {
    const { data, error } = await supabase
      .from('workout_completion_exercises')
      .select(`
        *,
        exercise:exercise_id (
          id,
          name,
          description,
          category,
          log_type
        )
      `)
      .eq('workout_completion_id', workoutCompletionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    // Map the data to ensure it conforms to the WorkoutCompletionExercise interface
    const exercises: WorkoutCompletionExercise[] = (data || []).map(item => ({
      id: item.id,
      workout_completion_id: item.workout_completion_id,
      exercise_id: item.exercise_id,
      completed: item.completed || false,
      created_at: item.created_at,
      result: item.result,
      exercise: item.exercise
    }));
    
    return exercises;
  } catch (error) {
    console.error('Error fetching workout completion exercises:', error);
    throw error;
  }
};

/**
 * Updates a workout completion exercise
 */
export const updateWorkoutCompletionExercise = async (exerciseId: string, updates: Partial<WorkoutCompletionExercise>): Promise<WorkoutCompletionExercise> => {
  try {
    const { data, error } = await supabase
      .from('workout_completion_exercises')
      .update(updates)
      .eq('id', exerciseId)
      .select(`
        *,
        exercise:exercise_id (
          id,
          name,
          description,
          category,
          log_type
        )
      `)
      .single();

    if (error) throw error;
    
    // Ensure the data conforms to the WorkoutCompletionExercise interface
    const exercise: WorkoutCompletionExercise = {
      id: data.id,
      workout_completion_id: data.workout_completion_id,
      exercise_id: data.exercise_id,
      completed: data.completed || false,
      created_at: data.created_at,
      result: data.result,
      exercise: data.exercise
    };
    
    return exercise;
  } catch (error) {
    console.error('Error updating workout completion exercise:', error);
    throw error;
  }
};

/**
 * Completes a workout completion
 */
export const completeWorkoutCompletion = async (workoutCompletionId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('workout_completions')
      .update({
        completed_at: new Date().toISOString()
      })
      .eq('id', workoutCompletionId);

    if (error) throw error;
  } catch (error) {
    console.error('Error completing workout:', error);
    throw error;
  }
};

/**
 * Skips a workout completion
 */
export const skipWorkoutCompletion = async (workoutCompletionId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('workout_completions')
      .update({
        life_happens_pass: true
      })
      .eq('id', workoutCompletionId);

    if (error) throw error;
  } catch (error) {
    console.error('Error skipping workout:', error);
    throw error;
  }
};
