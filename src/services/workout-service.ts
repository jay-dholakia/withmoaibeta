
import { supabase } from "@/integrations/supabase/client";
import { Exercise, Workout, WorkoutExercise } from "@/types/workout";

/**
 * Creates a new workout
 */
export const createWorkout = async (workoutData: {
  week_id: string;
  title: string;
  description?: string;
  workout_type?: "strength" | "cardio" | "flexibility" | "mobility";
  priority?: number;
  template_id?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .insert({
        ...workoutData,
        workout_type: workoutData.workout_type || 'strength'
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating workout:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createWorkout:', error);
    throw error;
  }
};

/**
 * Fetches workout by ID
 */
export const fetchWorkout = async (id: string): Promise<Workout | null> => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching workout:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchWorkout:', error);
    throw error;
  }
};

/**
 * Fetches standalone workout by ID
 */
export const fetchStandaloneWorkout = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('standalone_workouts')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching standalone workout:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchStandaloneWorkout:', error);
    throw error;
  }
};

/**
 * Updates a workout
 */
export const updateWorkout = async (id: string, workoutData: {
  title?: string;
  description?: string | null;
  workout_type?: "strength" | "cardio" | "flexibility" | "mobility";
  priority?: number;
}) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .update(workoutData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating workout:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateWorkout:', error);
    throw error;
  }
};

/**
 * Deletes a workout
 */
export const deleteWorkout = async (id: string) => {
  try {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting workout:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteWorkout:', error);
    throw error;
  }
};

/**
 * Fetches workouts for a week
 */
export const fetchWorkoutsForWeek = async (weekId: string): Promise<Workout[]> => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('week_id', weekId)
      .order('priority', { ascending: true });
      
    if (error) {
      console.error('Error fetching workouts for week:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchWorkoutsForWeek:', error);
    throw error;
  }
};

/**
 * Fetches workout exercises for a workout
 */
export const fetchWorkoutExercises = async (workoutId: string): Promise<WorkoutExercise[]> => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select(`
        *,
        exercise:exercise_id (*)
      `)
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });
      
    if (error) {
      console.error('Error fetching workout exercises:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchWorkoutExercises:', error);
    throw error;
  }
};

/**
 * Create workout exercise
 */
export const createWorkoutExercise = async (exerciseData: {
  workout_id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  rest_seconds?: number;
  notes?: string;
  order_index: number;
  superset_group_id?: string;
  superset_order?: number;
}) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .insert(exerciseData)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating workout exercise:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createWorkoutExercise:', error);
    throw error;
  }
};

/**
 * Delete workout exercise
 */
export const deleteWorkoutExercise = async (id: string) => {
  try {
    const { error } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting workout exercise:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteWorkoutExercise:', error);
    throw error;
  }
};

/**
 * Move workout exercise up (decrease order_index)
 */
export const moveWorkoutExerciseUp = async (id: string, workoutId: string) => {
  try {
    // Get current exercise
    const { data: exerciseData, error: exerciseError } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('id', id)
      .single();
      
    if (exerciseError || !exerciseData) {
      console.error('Error fetching exercise:', exerciseError);
      throw exerciseError || new Error('Exercise not found');
    }
    
    const currentOrderIndex = exerciseData.order_index;
    
    if (currentOrderIndex === 0) {
      // Already at the top, nothing to do
      return fetchWorkoutExercises(workoutId);
    }
    
    // Find the exercise above this one
    const { data: aboveExercise, error: aboveError } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('order_index', currentOrderIndex - 1)
      .single();
      
    if (aboveError || !aboveExercise) {
      console.error('Error finding exercise above:', aboveError);
      throw aboveError || new Error('Exercise above not found');
    }
    
    // Swap order indices
    const { error: updateCurrentError } = await supabase
      .from('workout_exercises')
      .update({ order_index: currentOrderIndex - 1 })
      .eq('id', id);
      
    if (updateCurrentError) {
      console.error('Error updating current exercise:', updateCurrentError);
      throw updateCurrentError;
    }
    
    const { error: updateAboveError } = await supabase
      .from('workout_exercises')
      .update({ order_index: currentOrderIndex })
      .eq('id', aboveExercise.id);
      
    if (updateAboveError) {
      console.error('Error updating above exercise:', updateAboveError);
      throw updateAboveError;
    }
    
    // Fetch updated exercises
    return await fetchWorkoutExercises(workoutId);
  } catch (error) {
    console.error('Error moving workout exercise up:', error);
    throw error;
  }
};

/**
 * Move workout exercise down (increase order_index)
 */
export const moveWorkoutExerciseDown = async (id: string, workoutId: string) => {
  try {
    // Get current exercise
    const { data: exerciseData, error: exerciseError } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('id', id)
      .single();
      
    if (exerciseError || !exerciseData) {
      console.error('Error fetching exercise:', exerciseError);
      throw exerciseError || new Error('Exercise not found');
    }
    
    const currentOrderIndex = exerciseData.order_index;
    
    // Find the exercise below this one
    const { data: belowExercise, error: belowError } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('order_index', currentOrderIndex + 1)
      .single();
      
    if (belowError) {
      // Check if this was a "not found" error - could mean we're already at the bottom
      if (belowError.code === 'PGRST116') {
        // Already at the bottom, nothing to do
        return fetchWorkoutExercises(workoutId);
      }
      console.error('Error finding exercise below:', belowError);
      throw belowError;
    }
    
    if (!belowExercise) {
      // No exercise below, nothing to do
      return fetchWorkoutExercises(workoutId);
    }
    
    // Swap order indices
    const { error: updateCurrentError } = await supabase
      .from('workout_exercises')
      .update({ order_index: currentOrderIndex + 1 })
      .eq('id', id);
      
    if (updateCurrentError) {
      console.error('Error updating current exercise:', updateCurrentError);
      throw updateCurrentError;
    }
    
    const { error: updateBelowError } = await supabase
      .from('workout_exercises')
      .update({ order_index: currentOrderIndex })
      .eq('id', belowExercise.id);
      
    if (updateBelowError) {
      console.error('Error updating below exercise:', updateBelowError);
      throw updateBelowError;
    }
    
    // Fetch updated exercises
    return await fetchWorkoutExercises(workoutId);
  } catch (error) {
    console.error('Error moving workout exercise down:', error);
    throw error;
  }
};

/**
 * Fetches all exercises
 */
export const fetchAllExercises = async (): Promise<Exercise[]> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name', { ascending: true });
      
    if (error) {
      console.error('Error fetching exercises:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchAllExercises:', error);
    throw error;
  }
};

/**
 * Fetches exercises by category
 */
export const fetchExercisesByCategory = async (category: string): Promise<Exercise[]> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('category', category)
      .order('name', { ascending: true });
      
    if (error) {
      console.error('Error fetching exercises by category:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchExercisesByCategory:', error);
    throw error;
  }
};

/**
 * Fetches exercise categories
 */
export const fetchExerciseCategories = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('category')
      .order('category', { ascending: true });
      
    if (error) {
      console.error('Error fetching exercise categories:', error);
      throw error;
    }
    
    // Extract unique categories
    const categories = [...new Set(data.map(item => item.category))];
    return categories;
  } catch (error) {
    console.error('Error in fetchExerciseCategories:', error);
    throw error;
  }
};

/**
 * Fetches all exercise muscle groups
 */
export const fetchExerciseMuscleGroups = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('muscle_group')
      .order('muscle_group', { ascending: true });
      
    if (error) {
      console.error('Error fetching exercise muscle groups:', error);
      throw error;
    }
    
    // Extract unique muscle groups and filter out nulls
    const muscleGroups = [...new Set(data.filter(item => item.muscle_group).map(item => item.muscle_group))];
    return muscleGroups;
  } catch (error) {
    console.error('Error in fetchExerciseMuscleGroups:', error);
    throw error;
  }
};

/**
 * Creates a new exercise
 */
export const createExercise = async (exerciseData: {
  name: string;
  category: string;
  description?: string;
  exercise_type: string;
  muscle_group?: string;
  youtube_link?: string;
}): Promise<Exercise> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .insert(exerciseData)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating exercise:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createExercise:', error);
    throw error;
  }
};

/**
 * Fetch workout weeks for a program
 */
export const fetchWorkoutWeeks = async (programId: string) => {
  try {
    const { data, error } = await supabase
      .from('workout_weeks')
      .select('*')
      .eq('program_id', programId)
      .order('week_number', { ascending: true });
      
    if (error) {
      console.error('Error fetching workout weeks:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchWorkoutWeeks:', error);
    throw error;
  }
};

/**
 * Creates a workout template
 */
export const createWorkoutTemplate = async (templateData: {
  title: string;
  description?: string;
  workout_type?: "strength" | "cardio" | "flexibility" | "mobility";
  coach_id: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('standalone_workouts')
      .insert({
        ...templateData,
        workout_type: templateData.workout_type || 'strength'
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating workout template:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createWorkoutTemplate:', error);
    throw error;
  }
};

/**
 * Updates a workout template
 */
export const updateWorkoutTemplate = async (id: string, templateData: {
  title?: string;
  description?: string;
  workout_type?: "strength" | "cardio" | "flexibility" | "mobility";
  category?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('standalone_workouts')
      .update(templateData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating workout template:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateWorkoutTemplate:', error);
    throw error;
  }
};

/**
 * Fetches standalone workouts (templates)
 */
export const fetchStandaloneWorkouts = async (coachId: string) => {
  try {
    const { data, error } = await supabase
      .from('standalone_workouts')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching standalone workouts:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchStandaloneWorkouts:', error);
    throw error;
  }
};

/**
 * Fetches standalone workout exercise
 */
export const fetchStandaloneWorkoutExercises = async (workoutId: string) => {
  try {
    const { data, error } = await supabase
      .from('standalone_workout_exercises')
      .select(`
        *,
        exercise:exercise_id (*)
      `)
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true });
      
    if (error) {
      console.error('Error fetching standalone workout exercises:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchStandaloneWorkoutExercises:', error);
    throw error;
  }
};

/**
 * Create standalone workout exercise
 */
export const createStandaloneWorkoutExercise = async (exerciseData: {
  workout_id: string;
  exercise_id: string;
  sets?: number;
  reps?: string;
  rest_seconds?: number;
  notes?: string;
  order_index: number;
  superset_group_id?: string;
  superset_order?: number;
}) => {
  try {
    const { data, error } = await supabase
      .from('standalone_workout_exercises')
      .insert(exerciseData)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating standalone workout exercise:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createStandaloneWorkoutExercise:', error);
    throw error;
  }
};

/**
 * Delete standalone workout exercise
 */
export const deleteStandaloneWorkoutExercise = async (id: string) => {
  try {
    const { error } = await supabase
      .from('standalone_workout_exercises')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting standalone workout exercise:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteStandaloneWorkoutExercise:', error);
    throw error;
  }
};

/**
 * Move standalone workout exercise up (decrease order_index)
 */
export const moveStandaloneWorkoutExerciseUp = async (id: string, workoutId: string) => {
  try {
    // Get current exercise
    const { data: exerciseData, error: exerciseError } = await supabase
      .from('standalone_workout_exercises')
      .select('*')
      .eq('id', id)
      .single();
      
    if (exerciseError || !exerciseData) {
      console.error('Error fetching exercise:', exerciseError);
      throw exerciseError || new Error('Exercise not found');
    }
    
    const currentOrderIndex = exerciseData.order_index;
    
    if (currentOrderIndex === 0) {
      // Already at the top, nothing to do
      return fetchStandaloneWorkoutExercises(workoutId);
    }
    
    // Find the exercise above this one
    const { data: aboveExercise, error: aboveError } = await supabase
      .from('standalone_workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('order_index', currentOrderIndex - 1)
      .single();
      
    if (aboveError || !aboveExercise) {
      console.error('Error finding exercise above:', aboveError);
      throw aboveError || new Error('Exercise above not found');
    }
    
    // Swap order indices
    const { error: updateCurrentError } = await supabase
      .from('standalone_workout_exercises')
      .update({ order_index: currentOrderIndex - 1 })
      .eq('id', id);
      
    if (updateCurrentError) {
      console.error('Error updating current exercise:', updateCurrentError);
      throw updateCurrentError;
    }
    
    const { error: updateAboveError } = await supabase
      .from('standalone_workout_exercises')
      .update({ order_index: currentOrderIndex })
      .eq('id', aboveExercise.id);
      
    if (updateAboveError) {
      console.error('Error updating above exercise:', updateAboveError);
      throw updateAboveError;
    }
    
    // Fetch updated exercises
    return await fetchStandaloneWorkoutExercises(workoutId);
  } catch (error) {
    console.error('Error moving standalone workout exercise up:', error);
    throw error;
  }
};

/**
 * Move standalone workout exercise down (increase order_index)
 */
export const moveStandaloneWorkoutExerciseDown = async (id: string, workoutId: string) => {
  try {
    // Get current exercise
    const { data: exerciseData, error: exerciseError } = await supabase
      .from('standalone_workout_exercises')
      .select('*')
      .eq('id', id)
      .single();
      
    if (exerciseError || !exerciseData) {
      console.error('Error fetching exercise:', exerciseError);
      throw exerciseError || new Error('Exercise not found');
    }
    
    const currentOrderIndex = exerciseData.order_index;
    
    // Find the exercise below this one
    const { data: belowExercise, error: belowError } = await supabase
      .from('standalone_workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('order_index', currentOrderIndex + 1)
      .single();
      
    if (belowError) {
      // Check if this was a "not found" error - could mean we're already at the bottom
      if (belowError.code === 'PGRST116') {
        // Already at the bottom, nothing to do
        return fetchStandaloneWorkoutExercises(workoutId);
      }
      console.error('Error finding exercise below:', belowError);
      throw belowError;
    }
    
    if (!belowExercise) {
      // No exercise below, nothing to do
      return fetchStandaloneWorkoutExercises(workoutId);
    }
    
    // Swap order indices
    const { error: updateCurrentError } = await supabase
      .from('standalone_workout_exercises')
      .update({ order_index: currentOrderIndex + 1 })
      .eq('id', id);
      
    if (updateCurrentError) {
      console.error('Error updating current exercise:', updateCurrentError);
      throw updateCurrentError;
    }
    
    const { error: updateBelowError } = await supabase
      .from('standalone_workout_exercises')
      .update({ order_index: currentOrderIndex })
      .eq('id', belowExercise.id);
      
    if (updateBelowError) {
      console.error('Error updating below exercise:', updateBelowError);
      throw updateBelowError;
    }
    
    // Fetch updated exercises
    return await fetchStandaloneWorkoutExercises(workoutId);
  } catch (error) {
    console.error('Error moving standalone workout exercise down:', error);
    throw error;
  }
};

/**
 * Create workout week
 */
export const createWorkoutWeek = async (weekData: {
  program_id: string;
  title: string;
  description?: string;
  week_number: number;
  target_strength_workouts?: number;
  target_cardio_minutes?: number;
  target_miles_run?: number;
  target_strength_mobility_workouts?: number;
}) => {
  try {
    const { data, error } = await supabase
      .from('workout_weeks')
      .insert(weekData)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating workout week:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createWorkoutWeek:', error);
    throw error;
  }
};

/**
 * Fetch workout week
 */
export const fetchWorkoutWeek = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('workout_weeks')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching workout week:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchWorkoutWeek:', error);
    throw error;
  }
};

/**
 * Update workout week
 */
export const updateWorkoutWeek = async (id: string, weekData: {
  title?: string;
  description?: string;
  target_strength_workouts?: number;
  target_cardio_minutes?: number;
  target_miles_run?: number;
  target_strength_mobility_workouts?: number;
}) => {
  try {
    const { data, error } = await supabase
      .from('workout_weeks')
      .update(weekData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating workout week:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateWorkoutWeek:', error);
    throw error;
  }
};

/**
 * Delete workout week
 */
export const deleteWorkoutWeek = async (id: string) => {
  try {
    // First, delete all workouts in this week
    const workouts = await fetchWorkoutsForWeek(id);
    
    for (const workout of workouts) {
      await deleteWorkout(workout.id);
    }
    
    // Then delete the week itself
    const { error } = await supabase
      .from('workout_weeks')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting workout week:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteWorkoutWeek:', error);
    throw error;
  }
};

/**
 * Copy workout week
 */
export const copyWorkoutWeek = async (sourceWeekId: string, targetWeekId: string) => {
  try {
    // Fetch source workouts
    const sourceWorkouts = await fetchWorkoutsForWeek(sourceWeekId);
    
    // Create new workouts in target week
    for (const sourceWorkout of sourceWorkouts) {
      // Create the workout
      const newWorkout = await createWorkout({
        week_id: targetWeekId,
        title: sourceWorkout.title,
        description: sourceWorkout.description,
        workout_type: sourceWorkout.workout_type as any,
        priority: sourceWorkout.priority,
        template_id: sourceWorkout.template_id
      });
      
      // Copy exercises
      const sourceExercises = await fetchWorkoutExercises(sourceWorkout.id);
      
      for (const sourceExercise of sourceExercises) {
        await createWorkoutExercise({
          workout_id: newWorkout.id,
          exercise_id: sourceExercise.exercise_id,
          sets: sourceExercise.sets,
          reps: sourceExercise.reps,
          rest_seconds: sourceExercise.rest_seconds,
          notes: sourceExercise.notes,
          order_index: sourceExercise.order_index,
          superset_group_id: sourceExercise.superset_group_id,
          superset_order: sourceExercise.superset_order
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error copying workout week:', error);
    throw error;
  }
};

/**
 * Reorder workouts in a week
 */
export const reorderWorkouts = async (weekId: string, workoutIds: string[]) => {
  try {
    // Update priority for each workout
    for (let i = 0; i < workoutIds.length; i++) {
      const { error } = await supabase
        .from('workouts')
        .update({ priority: i })
        .eq('id', workoutIds[i]);
        
      if (error) {
        console.error(`Error updating workout ${workoutIds[i]} priority:`, error);
        throw error;
      }
    }
    
    // Fetch updated workouts
    return await fetchWorkoutsForWeek(weekId);
  } catch (error) {
    console.error('Error reordering workouts:', error);
    throw error;
  }
};

/**
 * Create multiple workouts at once
 */
export const createMultipleWorkouts = async (workouts: Array<{
  week_id: string;
  title: string;
  description?: string;
  workout_type?: "strength" | "cardio" | "flexibility" | "mobility";
  priority?: number;
  template_id?: string;
}>) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .insert(workouts.map(workout => ({
        ...workout,
        workout_type: workout.workout_type || 'strength'
      })))
      .select();
      
    if (error) {
      console.error('Error creating multiple workouts:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createMultipleWorkouts:', error);
    throw error;
  }
};

/**
 * Create workout from template
 */
export const createWorkoutFromTemplate = async (templateId: string, weekId: string, priority: number = 0) => {
  try {
    // First, get the template
    const template = await fetchStandaloneWorkout(templateId);
    
    if (!template) {
      throw new Error('Template not found');
    }
    
    // Create the workout
    const workout = await createWorkout({
      week_id: weekId,
      title: template.title,
      description: template.description,
      workout_type: template.workout_type as any,
      priority,
      template_id: templateId
    });
    
    // Get template exercises
    const templateExercises = await fetchStandaloneWorkoutExercises(templateId);
    
    // Create exercises for the new workout
    for (const exercise of templateExercises) {
      await createWorkoutExercise({
        workout_id: workout.id,
        exercise_id: exercise.exercise_id,
        sets: exercise.sets || 3,
        reps: exercise.reps || '8-12',
        rest_seconds: exercise.rest_seconds,
        notes: exercise.notes,
        order_index: exercise.order_index,
        superset_group_id: exercise.superset_group_id,
        superset_order: exercise.superset_order
      });
    }
    
    return workout;
  } catch (error) {
    console.error('Error creating workout from template:', error);
    throw error;
  }
};

/**
 * Gets all exercise alternatives
 */
export const getExerciseAlternatives = async (exerciseId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('get_exercise_alternatives', { exercise_id_param: exerciseId });
    
    if (error) {
      console.error('Error getting exercise alternatives:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getExerciseAlternatives:', error);
    throw error;
  }
};
