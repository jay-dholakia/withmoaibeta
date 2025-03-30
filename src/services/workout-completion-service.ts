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
  superset_group_id?: string | null;
  superset_order?: number | null;
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
    console.log("Fetching workout completion data for ID:", workoutCompletionId);
    
    // Get the current user ID first to avoid Promise in the query
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || '';
    
    // First try to get the completion data directly
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
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching workout completion data:", error);
      throw error;
    }
    
    if (data) {
      console.log("Found workout completion:", data);
      
      // Ensure distance is a number or null
      const processedData: WorkoutCompletion = {
        ...data,
        distance: data.distance ? Number(data.distance) : null
      };
      
      return processedData;
    }
    
    // If no completion record found, try to fetch workout data to create a new completion
    console.log("No workout completion found with ID, trying to fetch workout directly");
    const { data: workoutData, error: workoutError } = await supabase
      .from('workouts')
      .select(`
        id,
        title,
        description
      `)
      .eq('id', workoutCompletionId)
      .maybeSingle();
    
    if (workoutError) {
      console.error("Error fetching workout data:", workoutError);
      throw workoutError;
    }
    
    if (!workoutData) {
      console.error("No workout found with ID:", workoutCompletionId);
      throw new Error('Workout not found');
    }
    
    console.log("Found workout data, creating default completion:", workoutData);
    
    // Create a new workout completion record in the database
    const { data: newCompletion, error: insertError } = await supabase
      .from('workout_completions')
      .insert({
        id: workoutCompletionId, // Use the same ID as the workout for simplicity
        user_id: userId,
        workout_id: workoutCompletionId,
        rest_day: false,
        life_happens_pass: false
      })
      .select('*')
      .single();
    
    if (insertError) {
      console.error("Error creating workout completion:", insertError);
      throw insertError;
    }
    
    console.log("Created new workout completion:", newCompletion);
    
    // Return the newly created workout completion with workout data
    return {
      ...newCompletion,
      workout: workoutData,
      distance: null
    };
  } catch (error) {
    console.error("Error in workout completion data query:", error);
    throw error;
  }
};

/**
 * Fetches exercises for a workout completion
 */
export const fetchWorkoutCompletionExercises = async (workoutCompletionId: string): Promise<WorkoutCompletionExercise[]> => {
  try {
    // First check if there are existing completion exercises
    // Use the standard join syntax instead of explicit foreign key relationship
    const { data: existingExercises, error: existingError } = await supabase
      .from('workout_completion_exercises')
      .select(`
        id,
        workout_completion_id,
        exercise_id,
        completed,
        created_at,
        result,
        exercise:exercises (
          id,
          name,
          description,
          category,
          log_type
        )
      `)
      .eq('workout_completion_id', workoutCompletionId);
    
    if (existingError) {
      console.error("Error checking existing completion exercises:", existingError);
      throw existingError;
    }
    
    // If we already have completion exercises, return them
    if (existingExercises && existingExercises.length > 0) {
      console.log(`Found ${existingExercises.length} existing completion exercises`);
      
      // Map the data to ensure it conforms to the WorkoutCompletionExercise interface
      const exercises: WorkoutCompletionExercise[] = existingExercises.map(item => {
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
    }
    
    // If no completion exercises exist, we need to fetch workout exercises and create them
    console.log("No completion exercises found, creating from workout exercises");
    
    // Ensure the workout completion exists before trying to create exercises
    // This will create it if it doesn't exist
    await fetchWorkoutCompletion(workoutCompletionId);
    
    // Fetch the workout ID from the completion
    const { data: completion, error: completionError } = await supabase
      .from('workout_completions')
      .select('workout_id')
      .eq('id', workoutCompletionId)
      .single();
    
    if (completionError) {
      console.error("Error fetching workout completion:", completionError);
      throw completionError;
    }
    
    if (!completion.workout_id) {
      console.error("No workout ID associated with this completion");
      throw new Error('No workout ID associated with this completion');
    }
    
    // Fetch workout exercises
    const { data: workoutExercises, error: workoutExercisesError } = await supabase
      .from('workout_exercises')
      .select(`
        id,
        workout_id,
        exercise_id,
        sets,
        reps,
        order_index,
        rest_seconds,
        superset_group_id,
        superset_order,
        exercise:exercises (
          id,
          name,
          description,
          category,
          log_type
        )
      `)
      .eq('workout_id', completion.workout_id)
      .order('order_index', { ascending: true });
    
    if (workoutExercisesError) {
      console.error("Error fetching workout exercises:", workoutExercisesError);
      throw workoutExercisesError;
    }
    
    if (!workoutExercises || workoutExercises.length === 0) {
      console.log("No workout exercises found");
      return [];
    }
    
    console.log(`Found ${workoutExercises.length} workout exercises, creating completion exercises`);
    
    // Create completion exercises for each workout exercise
    const createdExercises: WorkoutCompletionExercise[] = [];
    
    for (const workoutExercise of workoutExercises) {
      try {
        // Insert the completion exercise
        const { data: newExercise, error: insertError } = await supabase
          .from('workout_completion_exercises')
          .insert({
            workout_completion_id: workoutCompletionId,
            exercise_id: workoutExercise.exercise_id,
            completed: false,
            result: null
          })
          .select(`
            id,
            workout_completion_id,
            exercise_id,
            completed,
            created_at,
            result,
            exercise:exercises (
              id,
              name,
              description,
              category,
              log_type
            )
          `)
          .single();
        
        if (insertError) {
          console.error("Error creating completion exercise:", insertError);
          continue;
        }
        
        // Use the type guard to check if exercise is valid
        const exercise = isValidExercise(newExercise.exercise) ? {
          id: newExercise.exercise.id || '',
          name: newExercise.exercise.name || '',
          description: newExercise.exercise.description || null,
          log_type: (newExercise.exercise.log_type as 'weight_reps' | 'duration_distance' | 'duration' | 'reps') || 'weight_reps',
          category: newExercise.exercise.category || ''
        } : undefined;
        
        createdExercises.push({
          ...newExercise,
          exercise,
          superset_group_id: workoutExercise.superset_group_id,
          superset_order: workoutExercise.superset_order
        });
      } catch (err) {
        console.error('Error creating completion exercise for exercise:', workoutExercise.id, err);
        // Continue with other exercises even if one fails
      }
    }
    
    return createdExercises;
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
          id,
          workout_completion_id,
          exercise_id,
          completed,
          created_at,
          result,
          exercise:exercises (
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

    // Determine what fields need to be updated
    const updateFields: any = {};
    if (updates.result !== undefined) updateFields.result = updates.result;
    if (updates.completed !== undefined) updateFields.completed = updates.completed;

    // Only proceed with the update if there are fields to update
    if (Object.keys(updateFields).length === 0) {
      throw new Error('No valid fields to update');
    }

    const { data, error } = await supabase
      .from('workout_completion_exercises')
      .update(updateFields)
      .eq('id', exerciseId)
      .select(`
        id,
        workout_completion_id,
        exercise_id,
        completed,
        created_at,
        result,
        exercise:exercises (
          id,
          name,
          description,
          category,
          log_type
        )
      `)
      .single();

    if (error) {
      console.error('Supabase error updating workout completion exercise:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('No data returned from update operation');
    }
    
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
