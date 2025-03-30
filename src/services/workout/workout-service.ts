
import { supabase } from "@/integrations/supabase/client";
import { Workout } from "@/types/workout";
import { normalizeWorkoutType } from "./utils";

export const createWorkout = async (data: {
  week_id: string;
  day_of_week: number;
  title: string;
  description: string | null;
  workout_type: string;
  priority?: number;
}) => {
  const normalizedType = normalizeWorkoutType(data.workout_type);
  
  const { data: workout, error } = await supabase
    .from('workouts')
    .insert({
      week_id: data.week_id,
      day_of_week: data.day_of_week,
      title: data.title,
      description: data.description,
      workout_type: normalizedType,
      priority: data.priority || 0
    } as any) // Use type assertion to avoid TS error
    .select('*')
    .single();

  if (error) {
    console.error('Error creating workout:', error);
    throw error;
  }

  return workout;
};

export const updateWorkout = async (id: string, data: {
  title?: string;
  description?: string | null;
  day_of_week?: number;
  workout_type?: string;
  priority?: number;
}) => {
  const updateData = { ...data };
  if (updateData.workout_type) {
    updateData.workout_type = normalizeWorkoutType(updateData.workout_type);
  }
  
  const { data: workout, error } = await supabase
    .from('workouts')
    .update(updateData as any) // Use type assertion to avoid TS error
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating workout:', error);
    throw error;
  }

  return workout;
};

export const fetchWorkouts = async (weekId: string) => {
  const { data: workouts, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('week_id', weekId)
    .order('day_of_week', { ascending: true });

  if (error) {
    console.error('Error fetching workouts:', error);
    throw error;
  }

  return workouts;
};

export const fetchWorkout = async (workoutId: string): Promise<Workout> => {
  const { data: workout, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', workoutId)
    .single();

  if (error) {
    console.error('Error fetching workout:', error);
    throw error;
  }

  return workout;
};

export const deleteWorkout = async (workoutId: string) => {
  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', workoutId);

  if (error) {
    console.error('Error deleting workout:', error);
    throw error;
  }
};

export const addWorkoutToWeek = async (weekId: string, data: {
  title: string;
  description?: string | null;
  day_of_week: number;
  workout_type: string;
  priority?: number;
}) => {
  const { data: workout, error } = await supabase
    .from('workouts')
    .insert({
      week_id: weekId,
      title: data.title,
      description: data.description || null,
      day_of_week: data.day_of_week,
      workout_type: data.workout_type,
      priority: data.priority || 0
    } as any) // Use type assertion to avoid TS error
    .select('*')
    .single();

  if (error) {
    console.error('Error adding workout to week:', error);
    throw error;
  }

  return workout;
};

export const copyWorkoutToWeek = async (
  sourceWorkoutId: string, 
  targetWeekId: string,
  dayOfWeek?: number
) => {
  try {
    // Fetch source workout details
    const sourceWorkout = await fetchWorkout(sourceWorkoutId);
    
    if (!sourceWorkout) {
      throw new Error("Source workout not found");
    }
    
    // Create new workout in target week
    const newWorkout = await addWorkoutToWeek(targetWeekId, {
      title: sourceWorkout.title,
      description: sourceWorkout.description,
      day_of_week: dayOfWeek !== undefined ? dayOfWeek : sourceWorkout.day_of_week,
      workout_type: sourceWorkout.workout_type || 'strength'
    });
    
    // Fetch exercises from source workout
    const { fetchWorkoutExercises, createWorkoutExercise } = await import('./workout-exercise-service');
    const exercises = await fetchWorkoutExercises(sourceWorkoutId);
    
    // Add exercises to new workout
    if (exercises.length > 0) {
      for (const exercise of exercises) {
        await createWorkoutExercise({
          workout_id: newWorkout.id,
          exercise_id: exercise.exercise_id,
          sets: exercise.sets || 0,
          reps: exercise.reps || '',
          rest_seconds: exercise.rest_seconds,
          notes: exercise.notes,
          order_index: exercise.order_index
        });
      }
    }
    
    return newWorkout;
  } catch (error) {
    console.error("Error copying workout:", error);
    throw error;
  }
};
