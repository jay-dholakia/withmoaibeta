
import { supabase } from '@/integrations/supabase/client';
import { Workout, WorkoutExercise } from '@/types/workout';

/**
 * Fetches workouts for a specific week
 */
export const fetchWorkoutsForWeek = async (weekId: string) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('week_id', weekId)
      .order('day_of_week', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workouts for week:', error);
    throw error;
  }
};

/**
 * Fetches all workouts for a program
 */
export const fetchWorkouts = async (weekId: string) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('week_id', weekId)
      .order('day_of_week', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workouts:', error);
    throw error;
  }
};

/**
 * Fetches a specific workout
 */
export const fetchWorkout = async (workoutId: string) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .single();
    
    if (error) {
      console.error('Error fetching workout:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching workout:', error);
    throw error;
  }
};

/**
 * Creates a workout
 */
export const createWorkout = async (workoutData: {
  week_id: string;
  title: string;
  description?: string | null;
  day_of_week: number;
  workout_type?: "cardio" | "strength" | "mobility" | "flexibility";
  priority?: number;
  template_id?: string | null;
}) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .insert([workoutData])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating workout:', error);
    throw error;
  }
};

/**
 * Creates a workout from a template
 */
export const createWorkoutFromTemplate = async (workoutData: {
  week_id: string;
  day_of_week: number;
  priority?: number;
  template_id: string;
}) => {
  try {
    // First fetch the template details
    const { data: template, error: templateError } = await supabase
      .from('standalone_workouts')
      .select('*')
      .eq('id', workoutData.template_id)
      .single();
    
    if (templateError) {
      throw templateError;
    }
    
    // Map template workout_type to a valid workout_type for the workout table
    let workoutType: 'cardio' | 'strength' | 'mobility' | 'flexibility' = 'strength';
    
    if (template.workout_type === 'cardio') {
      workoutType = 'cardio';
    } else if (template.workout_type === 'mobility' || template.workout_type === 'flexibility') {
      workoutType = template.workout_type;
    }
    
    // Create the workout with template reference
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .insert({
        week_id: workoutData.week_id,
        title: template.title,
        description: template.description,
        day_of_week: workoutData.day_of_week,
        workout_type: workoutType,
        priority: workoutData.priority || 0,
        template_id: workoutData.template_id
      })
      .select()
      .single();
    
    if (workoutError) {
      throw workoutError;
    }
    
    // Get template exercises
    const { data: templateExercises, error: exercisesError } = await supabase
      .from('standalone_workout_exercises')
      .select('*')
      .eq('workout_id', template.id)
      .order('order_index', { ascending: true });
    
    if (exercisesError) {
      throw exercisesError;
    }
    
    if (templateExercises && templateExercises.length > 0) {
      // Create workout exercises from template
      const workoutExercises = templateExercises.map((ex, index) => ({
        workout_id: workout.id,
        exercise_id: ex.exercise_id,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest_seconds,
        notes: ex.notes,
        order_index: index,
        superset_group_id: ex.superset_group_id,
        superset_order: ex.superset_order
      }));
      
      const { error: insertError } = await supabase
        .from('workout_exercises')
        .insert(workoutExercises);
      
      if (insertError) {
        throw insertError;
      }
    }
    
    return workout;
  } catch (error) {
    console.error('Error creating workout from template:', error);
    throw error;
  }
};

/**
 * Updates a workout
 */
export const updateWorkout = async (workoutId: string, workoutData: {
  title?: string;
  description?: string | null;
  day_of_week?: number;
  workout_type?: "cardio" | "strength" | "mobility" | "flexibility";
  priority?: number;
  template_id?: string | null;
}) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .update(workoutData)
      .eq('id', workoutId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating workout:', error);
    throw error;
  }
};

/**
 * Fetches exercises for a specific workout
 */
export const fetchWorkoutExercises = async (workoutId: string) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
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
    console.error('Error fetching workout exercises:', error);
    throw error;
  }
};

/**
 * Creates a workout exercise
 */
export const createWorkoutExercise = async (exerciseData: {
  workout_id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  rest_seconds?: number;
  notes?: string;
  order_index: number;
}) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .insert([exerciseData])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating workout exercise:', error);
    throw error;
  }
};

/**
 * Updates a workout exercise
 */
export const updateWorkoutExercise = async (exerciseId: string, exerciseData: {
  sets?: number;
  reps?: string;
  rest_seconds?: number;
  notes?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .update(exerciseData)
      .eq('id', exerciseId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating workout exercise:', error);
    throw error;
  }
};

/**
 * Deletes a workout exercise
 */
export const deleteWorkoutExercise = async (exerciseId: string) => {
  try {
    const { error } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('id', exerciseId);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting workout exercise:', error);
    throw error;
  }
};

/**
 * Moves a workout exercise up in order
 */
export const moveWorkoutExerciseUp = async (exerciseId: string, workoutId: string) => {
  try {
    console.log("Service: Moving exercise up", { exerciseId, workoutId });
    
    // First, get all exercises for the workout to find the current exercise and its position
    const { data: exercises, error: exerciseError } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });
    
    if (exerciseError || !exercises || exercises.length === 0) {
      console.error("Error fetching exercises:", exerciseError);
      throw new Error("Could not fetch exercises");
    }
    
    // Find the current exercise
    const currentExercise = exercises.find(ex => ex.id === exerciseId);
    if (!currentExercise) {
      throw new Error("Could not find current exercise in the list");
    }
    
    const currentIndex = exercises.findIndex(ex => ex.id === exerciseId);
    
    // If it's already at the top (index 0), do nothing
    if (currentIndex === 0) {
      console.log("Exercise already at the top, cannot move up further");
      return exercises;
    }
    
    // Find the exercise above it in the sorted list
    const aboveExercise = exercises[currentIndex - 1];
    
    // Swap their order_index values
    const currentOrderIndex = currentExercise.order_index;
    const aboveOrderIndex = aboveExercise.order_index;
    
    // Update the current exercise's order_index
    const { error: updateCurrentError } = await supabase
      .from('workout_exercises')
      .update({ order_index: aboveOrderIndex })
      .eq('id', exerciseId);
    
    if (updateCurrentError) {
      console.error("Error updating current exercise:", updateCurrentError);
      throw new Error("Failed to update current exercise");
    }
    
    // Update the above exercise's order_index
    const { error: updateAboveError } = await supabase
      .from('workout_exercises')
      .update({ order_index: currentOrderIndex })
      .eq('id', aboveExercise.id);
    
    if (updateAboveError) {
      console.error("Error updating exercise above:", updateAboveError);
      throw new Error("Failed to update exercise above");
    }
    
    // Get updated exercises
    const { data: updatedExercises, error: fetchError } = await supabase
      .from('workout_exercises')
      .select(`
        *,
        exercise:exercise_id(*)
      `)
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });
      
    if (fetchError) {
      console.error("Error fetching updated exercises:", fetchError);
      throw new Error("Failed to fetch updated exercises");
    }
    
    console.log("Successfully moved exercise up");
    return updatedExercises || [];
  } catch (error) {
    console.error("Error in moveWorkoutExerciseUp:", error);
    throw error;
  }
};

/**
 * Moves a workout exercise down in order
 */
export const moveWorkoutExerciseDown = async (exerciseId: string, workoutId: string) => {
  try {
    console.log("Service: Moving exercise down", { exerciseId, workoutId });
    
    // Get all exercises for the workout to find the current exercise and its position
    const { data: exercises, error: exerciseError } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });
    
    if (exerciseError || !exercises || exercises.length === 0) {
      console.error("Error fetching exercises:", exerciseError);
      throw new Error("Could not fetch exercises");
    }
    
    // Find the current exercise in the sorted array
    const currentIndex = exercises.findIndex(ex => ex.id === exerciseId);
    if (currentIndex === -1) {
      throw new Error("Could not find current exercise in the list");
    }
    
    // If it's already at the bottom, do nothing
    if (currentIndex === exercises.length - 1) {
      console.log("Exercise already at the bottom, cannot move down further");
      return exercises;
    }
    
    // Get the current exercise and the one below it
    const currentExercise = exercises[currentIndex];
    const belowExercise = exercises[currentIndex + 1];
    
    // Swap their order_index values
    const currentOrderIndex = currentExercise.order_index;
    const belowOrderIndex = belowExercise.order_index;
    
    // Update the current exercise's order_index
    const { error: updateCurrentError } = await supabase
      .from('workout_exercises')
      .update({ order_index: belowOrderIndex })
      .eq('id', exerciseId);
    
    if (updateCurrentError) {
      console.error("Error updating current exercise:", updateCurrentError);
      throw new Error("Failed to update current exercise");
    }
    
    // Update the below exercise's order_index
    const { error: updateBelowError } = await supabase
      .from('workout_exercises')
      .update({ order_index: currentOrderIndex })
      .eq('id', belowExercise.id);
    
    if (updateBelowError) {
      console.error("Error updating exercise below:", updateBelowError);
      throw new Error("Failed to update exercise below");
    }
    
    // Get updated exercises
    const { data: updatedExercises, error: fetchError } = await supabase
      .from('workout_exercises')
      .select(`
        *,
        exercise:exercise_id(*)
      `)
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });
      
    if (fetchError) {
      console.error("Error fetching updated exercises:", fetchError);
      throw new Error("Failed to fetch updated exercises");
    }
    
    console.log("Successfully moved exercise down");
    return updatedExercises || [];
  } catch (error) {
    console.error("Error in moveWorkoutExerciseDown:", error);
    throw error;
  }
};
