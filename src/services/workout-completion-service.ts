
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
    log_type: 'weight_reps' | 'duration_distance' | 'duration' | 'reps';
    category: string;
  };
}

/**
 * Type guard to check if an object is a valid exercise
 */
function isValidExercise(obj: any): obj is {
  id: string;
  name: string;
  description: string | null;
  log_type: 'weight_reps' | 'duration_distance' | 'duration' | 'reps';
  category: string;
} {
  return obj && typeof obj === 'object' && !('error' in obj);
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
      title: data.title || null, 
      description: data.description || null, 
      workout_type: data.workout_type || null, 
      distance: typeof data.distance === 'string' ? parseFloat(data.distance) : data.distance,
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
    const exercises: WorkoutCompletionExercise[] = (data || []).map(item => {
      // Use the type guard to check if exercise is valid
      const exercise = isValidExercise(item.exercise) ? {
        id: item.exercise.id || '',
        name: item.exercise.name || '',
        description: item.exercise.description || null,
        log_type: (item.exercise.log_type as 'weight_reps' | 'duration_distance' | 'duration' | 'reps') || 'weight_reps',
        category: item.exercise.category || ''
      } : undefined;

      return {
        id: item.id,
        workout_completion_id: item.workout_completion_id,
        exercise_id: item.exercise_id,
        completed: item.completed || false,
        created_at: item.created_at,
        result: item.result,
        exercise
      };
    });
    
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
    // Format the result data based on exercise log_type if available
    if (updates.result) {
      // First, fetch current exercise data to get the log_type
      const { data: currentExercise, error: fetchError } = await supabase
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
        .eq('id', exerciseId)
        .single();

      if (fetchError) throw fetchError;

      // Format the result based on the exercise type
      if (isValidExercise(currentExercise.exercise)) {
        const logType = currentExercise.exercise.log_type;
        
        switch (logType) {
          case 'weight_reps':
            // For weight_reps exercises, ensure we have reps, sets, and weight
            if (!updates.result.reps || !updates.result.sets) {
              throw new Error('Reps and sets are required for weight_reps exercises');
            }
            // Weight is optional but included if provided
            break;
          
          case 'reps':
            // For reps exercises, ensure we have reps and sets
            if (!updates.result.reps || !updates.result.sets) {
              throw new Error('Reps and sets are required for reps exercises');
            }
            // Remove weight if it was included
            delete updates.result.weight;
            break;
          
          case 'duration':
            // For duration exercises, ensure we have duration
            if (!updates.result.duration) {
              updates.result.duration = '00:00:00';
            }
            break;
          
          case 'duration_distance':
            // For duration_distance exercises, we only need distance and duration
            // Sets and rest_seconds are not applicable
            if (!updates.result.distance) {
              throw new Error('Distance is required for duration_distance exercises');
            }
            if (!updates.result.duration) {
              updates.result.duration = '00:00:00';
            }
            // Remove sets and rest_seconds if they were included
            delete updates.result.sets;
            delete updates.result.rest_seconds;
            break;
        }
      }
    }

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
    
    // Use the type guard to check if exercise is valid
    const exercise = isValidExercise(data.exercise) ? {
      id: data.exercise.id || '',
      name: data.exercise.name || '',
      description: data.exercise.description || null,
      log_type: (data.exercise.log_type as 'weight_reps' | 'duration_distance' | 'duration' | 'reps') || 'weight_reps',
      category: data.exercise.category || ''
    } : undefined;
    
    // Ensure the data conforms to the WorkoutCompletionExercise interface
    const exerciseData: WorkoutCompletionExercise = {
      id: data.id,
      workout_completion_id: data.workout_completion_id,
      exercise_id: data.exercise_id,
      completed: data.completed || false,
      created_at: data.created_at,
      result: data.result,
      exercise
    };
    
    return exerciseData;
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
