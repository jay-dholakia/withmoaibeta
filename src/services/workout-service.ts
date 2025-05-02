import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches all exercises.
 */
export const fetchExercises = async () => {
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
    console.error('Error in fetchExercises:', error);
    throw error;
  }
};

/**
 * Fetches a single exercise by ID.
 */
export const fetchExerciseById = async (exerciseId: string) => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exerciseId)
      .single();
      
    if (error) {
      console.error('Error fetching exercise:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchExerciseById:', error);
    throw error;
  }
};

/**
 * Creates a new exercise.
 */
export const createExercise = async (data: {
  name: string;
  youtube_link?: string | null;
  muscle_group: string;
  description?: string | null;
}) => {
  try {
    const { data: exercise, error } = await supabase
      .from('exercises')
      .insert({
        name: data.name,
        youtube_link: data.youtube_link,
        muscle_group: data.muscle_group,
        description: data.description
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating exercise:', error);
      throw error;
    }
    
    return exercise;
  } catch (error) {
    console.error('Error in createExercise:', error);
    throw error;
  }
};

/**
 * Updates an existing exercise.
 */
export const updateExercise = async (exerciseId: string, data: {
  name?: string;
  youtube_link?: string | null;
  muscle_group?: string;
  description?: string | null;
}) => {
  try {
    const { data: exercise, error } = await supabase
      .from('exercises')
      .update({
        name: data.name,
        youtube_link: data.youtube_link,
        muscle_group: data.muscle_group,
        description: data.description
      })
      .eq('id', exerciseId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating exercise:', error);
      throw error;
    }
    
    return exercise;
  } catch (error) {
    console.error('Error in updateExercise:', error);
    throw error;
  }
};

/**
 * Deletes an exercise by ID.
 */
export const deleteExercise = async (exerciseId: string) => {
  try {
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', exerciseId);
      
    if (error) {
      console.error('Error deleting exercise:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteExercise:', error);
    throw error;
  }
};

/**
 * Fetches all standalone workouts.
 */
export const fetchStandaloneWorkouts = async () => {
  try {
    const { data, error } = await supabase
      .from('standalone_workouts')
      .select('*')
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
 * Fetches a single standalone workout by ID.
 */
export const fetchStandaloneWorkoutById = async (workoutId: string) => {
  try {
    const { data, error } = await supabase
      .from('standalone_workouts')
      .select('*')
      .eq('id', workoutId)
      .single();
      
    if (error) {
      console.error('Error fetching standalone workout:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchStandaloneWorkoutById:', error);
    throw error;
  }
};

/**
 * Creates a new standalone workout.
 */
export const createStandaloneWorkout = async (data: {
  title: string;
  description?: string | null;
  workout_type: "strength" | "cardio" | "flexibility" | "mobility";
  category: string;
}) => {
  try {
    const { data: workout, error } = await supabase
      .from('standalone_workouts')
      .insert({
        title: data.title,
        description: data.description,
        workout_type: data.workout_type,
        category: data.category
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating standalone workout:', error);
      throw error;
    }
    
    return workout;
  } catch (error) {
    console.error('Error in createStandaloneWorkout:', error);
    throw error;
  }
};

/**
 * Updates an existing standalone workout.
 */
export const updateStandaloneWorkout = async (workoutId: string, data: {
  title?: string;
  description?: string | null;
  workout_type?: "strength" | "cardio" | "flexibility" | "mobility";
  category?: string;
}) => {
  try {
    const { data: workout, error } = await supabase
      .from('standalone_workouts')
      .update({
        title: data.title,
        description: data.description,
        workout_type: data.workout_type,
        category: data.category
      })
      .eq('id', workoutId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating standalone workout:', error);
      throw error;
    }
    
    return workout;
  } catch (error) {
    console.error('Error in updateStandaloneWorkout:', error);
    throw error;
  }
};

/**
 * Deletes a standalone workout by ID.
 */
export const deleteStandaloneWorkout = async (workoutId: string) => {
  try {
    const { error } = await supabase
      .from('standalone_workouts')
      .delete()
      .eq('id', workoutId);
      
    if (error) {
      console.error('Error deleting standalone workout:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteStandaloneWorkout:', error);
    throw error;
  }
};

/**
 * Fetches all standalone workout exercises for a given workout ID.
 */
export const fetchStandaloneWorkoutExercises = async (workoutId: string) => {
  try {
    const { data, error } = await supabase
      .from('standalone_workout_exercises')
      .select(`
        *,
        exercise:exercise_id (
          id,
          name,
          youtube_link,
          muscle_group,
          description
        )
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
 * Fetches a single standalone workout exercise by ID.
 */
export const fetchStandaloneWorkoutExerciseById = async (exerciseId: string) => {
  try {
    const { data, error } = await supabase
      .from('standalone_workout_exercises')
      .select('*')
      .eq('id', exerciseId)
      .single();
      
    if (error) {
      console.error('Error fetching standalone workout exercise:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchStandaloneWorkoutExerciseById:', error);
    throw error;
  }
};

/**
 * Creates a new standalone workout exercise.
 */
export const createStandaloneWorkoutExercise = async (data: {
  workout_id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  rest_seconds?: number | null;
  notes?: string | null;
  order_index: number;
  superset_group_id?: string | null;
  superset_order?: number | null;
}) => {
  try {
    const { data: workoutExercise, error } = await supabase
      .from('standalone_workout_exercises')
      .insert({
        workout_id: data.workout_id,
        exercise_id: data.exercise_id,
        sets: data.sets,
        reps: data.reps,
        rest_seconds: data.rest_seconds,
        notes: data.notes,
        order_index: data.order_index,
        superset_group_id: data.superset_group_id,
        superset_order: data.superset_order
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating standalone workout exercise:', error);
      throw error;
    }
    
    return workoutExercise;
  } catch (error) {
    console.error('Error in createStandaloneWorkoutExercise:', error);
    throw error;
  }
};

/**
 * Updates an existing standalone workout exercise.
 */
export const updateStandaloneWorkoutExercise = async (exerciseId: string, data: {
  sets?: number;
  reps?: string;
  rest_seconds?: number | null;
  notes?: string | null;
  order_index?: number;
  superset_group_id?: string | null;
  superset_order?: number | null;
}) => {
  try {
    const { data: workoutExercise, error } = await supabase
      .from('standalone_workout_exercises')
      .update({
        sets: data.sets,
        reps: data.reps,
        rest_seconds: data.rest_seconds,
        notes: data.notes,
        order_index: data.order_index,
        superset_group_id: data.superset_group_id,
        superset_order: data.superset_order
      })
      .eq('id', exerciseId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating standalone workout exercise:', error);
      throw error;
    }
    
    return workoutExercise;
  } catch (error) {
    console.error('Error in updateStandaloneWorkoutExercise:', error);
    throw error;
  }
};

/**
 * Deletes a standalone workout exercise by ID.
 */
export const deleteStandaloneWorkoutExercise = async (exerciseId: string) => {
  try {
    const { error } = await supabase
      .from('standalone_workout_exercises')
      .delete()
      .eq('id', exerciseId);
      
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
 * Fetches all workouts.
 */
export const fetchWorkouts = async () => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select(`
        *,
        week:week_id (
          id,
          title,
          week_number,
          program:program_id (
            id,
            title
          )
        ),
        workout_exercises (
          *,
          exercise:exercise_id (
            id,
            name,
            youtube_link,
            muscle_group
          )
        )
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching workouts:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchWorkouts:', error);
    throw error;
  }
};

/**
 * Fetches a single workout by ID.
 */
export const fetchWorkoutById = async (workoutId: string) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select(`
        *,
        week:week_id (
          id,
          title,
          week_number,
          program:program_id (
            id,
            title
          )
        ),
        workout_exercises (
          *,
          exercise:exercise_id (
            id,
            name,
            youtube_link,
            muscle_group
          )
        )
      `)
      .eq('id', workoutId)
      .single();
      
    if (error) {
      console.error('Error fetching workout:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchWorkoutById:', error);
    throw error;
  }
};

/**
 * Create a new workout
 */
export const createWorkout = async (data: {
  workout_type: "strength" | "cardio" | "flexibility" | "mobility";
  week_id: string;
  day_of_week: number; // Added day_of_week property
  title: string;
  description?: string;
  priority?: number;
  template_id?: string;
}) => {
  try {
    const { data: workout, error } = await supabase
      .from('workouts')
      .insert({
        workout_type: data.workout_type,
        week_id: data.week_id,
        day_of_week: data.day_of_week, // Use the day_of_week property
        title: data.title,
        description: data.description,
        priority: data.priority || 0,
        template_id: data.template_id
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating workout:', error);
      throw error;
    }
    
    return workout;
  } catch (error) {
    console.error('Error in createWorkout:', error);
    throw error;
  }
};

/**
 * Updates an existing workout.
 */
export const updateWorkout = async (workoutId: string, data: {
  workout_type?: "strength" | "cardio" | "flexibility" | "mobility";
  title?: string;
  description?: string;
  priority?: number;
  template_id?: string;
}) => {
  try {
    const { data: workout, error } = await supabase
      .from('workouts')
      .update({
        workout_type: data.workout_type,
        title: data.title,
        description: data.description,
        priority: data.priority,
        template_id: data.template_id
      })
      .eq('id', workoutId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating workout:', error);
      throw error;
    }
    
    return workout;
  } catch (error) {
    console.error('Error in updateWorkout:', error);
    throw error;
  }
};

/**
 * Deletes a workout by ID.
 */
export const deleteWorkout = async (workoutId: string) => {
  try {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', workoutId);
      
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
 * Fetches all workout exercises for a given workout ID.
 */
export const fetchWorkoutExercises = async (workoutId: string) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select(`
        *,
        exercise:exercise_id (
          id,
          name,
          youtube_link,
          muscle_group,
          description
        )
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
 * Fetches a single workout exercise by ID.
 */
export const fetchWorkoutExerciseById = async (exerciseId: string) => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('id', exerciseId)
      .single();
      
    if (error) {
      console.error('Error fetching workout exercise:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchWorkoutExerciseById:', error);
    throw error;
  }
};

/**
 * Creates a new workout exercise.
 */
export const createWorkoutExercise = async (data: {
  workout_id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  rest_seconds?: number | null;
  notes?: string | null;
  order_index: number;
  superset_group_id?: string | null;
  superset_order?: number | null;
}) => {
  try {
    const { data: workoutExercise, error } = await supabase
      .from('workout_exercises')
      .insert({
        workout_id: data.workout_id,
        exercise_id: data.exercise_id,
        sets: data.sets,
        reps: data.reps,
        rest_seconds: data.rest_seconds,
        notes: data.notes,
        order_index: data.order_index,
		superset_group_id: data.superset_group_id,
        superset_order: data.superset_order
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating workout exercise:', error);
      throw error;
    }
    
    return workoutExercise;
  } catch (error) {
    console.error('Error in createWorkoutExercise:', error);
    throw error;
  }
};

/**
 * Updates an existing workout exercise.
 */
export const updateWorkoutExercise = async (exerciseId: string, data: {
  sets?: number;
  reps?: string;
  rest_seconds?: number | null;
  notes?: string | null;
  order_index?: number;
  superset_group_id?: string | null;
  superset_order?: number | null;
}) => {
  try {
    const { data: workoutExercise, error } = await supabase
      .from('workout_exercises')
      .update({
        sets: data.sets,
        reps: data.reps,
        rest_seconds: data.rest_seconds,
        notes: data.notes,
        order_index: data.order_index,
		superset_group_id: data.superset_group_id,
        superset_order: data.superset_order
      })
      .eq('id', exerciseId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating workout exercise:', error);
      throw error;
    }
    
    return workoutExercise;
  } catch (error) {
    console.error('Error in updateWorkoutExercise:', error);
    throw error;
  }
};

/**
 * Deletes a workout exercise by ID.
 */
export const deleteWorkoutExercise = async (exerciseId: string) => {
  try {
    const { error } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('id', exerciseId);
      
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
 * Reorder workout exercises
 */
export const reorderWorkoutExercises = async (exercises: { id: string; order_index: number }[]) => {
  try {
    // Use a single database call to update all exercises
    const updates = exercises.map(exercise => ({
      id: exercise.id,
      order_index: exercise.order_index,
    }));
    
    const { error } = await supabase
      .from('workout_exercises')
      .upsert(updates);
      
    if (error) {
      console.error('Error reordering workout exercises:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in reorderWorkoutExercises:', error);
    throw error;
  }
};

/**
 * Get next available priority
 */
export const getNextAvailablePriority = async (weekId: string) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('priority')
      .eq('week_id', weekId)
      .order('priority', { ascending: false })
      .limit(1);
      
    if (error) {
      console.error('Error fetching workouts:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return 1;
    }
    
    return data[0].priority + 1;
  } catch (error) {
    console.error('Error in getNextAvailablePriority:', error);
    throw error;
  }
};

/**
 * Fetches workouts for a specific week
 */
export const fetchWorkoutsByWeekId = async (weekId: string) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select(`
        *,
        week:week_id (
          id,
          title,
          week_number,
          program:program_id (
            id,
            title,
            program_type
          )
        ),
        workout_exercises (
          *,
          exercise:exercise_id (
            id,
            name,
            youtube_link,
            muscle_group
          )
        )
      `)
      .eq('week_id', weekId)
      .order('day_of_week', { ascending: true });
      
    if (error) {
      console.error('Error fetching workouts:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchWorkouts:', error);
    throw error;
  }
};

/**
 * Create multiple workouts at once
 */
export const createWorkouts = async (workouts: {
  workout_type: "strength" | "cardio" | "flexibility" | "mobility";
  week_id: string;
  day_of_week: number; // Added day_of_week property
  title: string;
  description?: string;
  priority?: number;
  template_id?: string;
}[]) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .insert(workouts)
      .select();
      
    if (error) {
      console.error('Error creating workouts:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createWorkouts:', error);
    throw error;
  }
};

export interface Exercise {
  id: string;
  created_at: string;
  name: string;
  youtube_link?: string;
  muscle_group: string;
  description?: string;
  alternative_exercises?: Exercise[];
}

// Update the WorkoutExercise interface to include the superset properties
export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  rest_seconds?: number;
  notes?: string;
  order_index: number;
  superset_group_id?: string; // Added missing property
  superset_order?: number;     // Added missing property
  created_at: string;
  exercise?: Exercise;
}

/**
 * Assign alternative exercises
 */
export const assignAlternativeExercises = async (exerciseId: string, alternativeExerciseIds: string[]) => {
  try {
    // Delete existing alternative exercises
    const { error: deleteError } = await supabase
      .from('alternative_exercises')
      .delete()
      .eq('exercise_id', exerciseId);
      
    if (deleteError) {
      console.error('Error deleting existing alternative exercises:', deleteError);
      throw deleteError;
    }
    
    // Insert new alternative exercises
    const newAlternativeExercises = alternativeExerciseIds.map(alternativeExerciseId => ({
      exercise_id: exerciseId,
      alternative_exercise_id: alternativeExerciseId
    }));
    
    const { data, error } = await supabase
      .from('alternative_exercises')
      .insert(newAlternativeExercises)
      .select();
      
    if (error) {
      console.error('Error assigning alternative exercises:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in assignAlternativeExercises:', error);
    throw error;
  }
};

/**
 * Fetch alternative exercises
 */
export const fetchAlternativeExercises = async (exerciseId: string) => {
  try {
    const { data, error } = await supabase
      .from('alternative_exercises')
      .select(`
        *,
        alternative_exercise:alternative_exercise_id (
          id,
          name,
          youtube_link,
          muscle_group,
          description
        )
      `)
      .eq('exercise_id', exerciseId);
      
    if (error) {
      console.error('Error fetching alternative exercises:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchAlternativeExercises:', error);
    throw error;
  }
};

/**
 * Delete alternative exercises
 */
export const deleteAlternativeExercises = async (exerciseId: string) => {
  try {
    const { error } = await supabase
      .from('alternative_exercises')
      .delete()
      .eq('exercise_id', exerciseId);
      
    if (error) {
      console.error('Error deleting alternative exercises:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteAlternativeExercises:', error);
    throw error;
  }
};
