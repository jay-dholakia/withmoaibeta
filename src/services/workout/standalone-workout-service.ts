
import { supabase } from "@/integrations/supabase/client";
import { normalizeWorkoutType } from "./utils";

export const createStandaloneWorkout = async (data: {
  title: string;
  description: string | null;
  coach_id: string;
  category?: string;
  workout_type: string;
}) => {
  const normalizedType = normalizeWorkoutType(data.workout_type);
  
  const { data: workout, error } = await supabase
    .from('standalone_workouts')
    .insert({
      title: data.title,
      description: data.description,
      coach_id: data.coach_id,
      category: data.category,
      workout_type: normalizedType
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating standalone workout:', error);
    throw error;
  }

  return workout;
};

export const fetchStandaloneWorkouts = async (coachId: string) => {
  const { data: workouts, error } = await supabase
    .from('standalone_workouts')
    .select('*')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching standalone workouts:', error);
    throw error;
  }

  return workouts;
};

export const fetchStandaloneWorkout = async (workoutId: string) => {
  const { data: workout, error } = await supabase
    .from('standalone_workouts')
    .select('*, workout_exercises:standalone_workout_exercises(*, exercise:exercise_id(*))')
    .eq('id', workoutId)
    .single();

  if (error) {
    console.error('Error fetching standalone workout:', error);
    throw error;
  }

  return workout;
};

export const updateStandaloneWorkout = async (workoutId: string, data: {
  title?: string;
  description?: string | null;
  category?: string;
  workout_type?: string;
}) => {
  const updateData = { ...data };
  if (updateData.workout_type) {
    updateData.workout_type = normalizeWorkoutType(updateData.workout_type);
  }
  
  const { data: workout, error } = await supabase
    .from('standalone_workouts')
    .update(updateData)
    .eq('id', workoutId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating standalone workout:', error);
    throw error;
  }

  return workout;
};

export const deleteStandaloneWorkout = async (workoutId: string) => {
  const { error } = await supabase
    .from('standalone_workouts')
    .delete()
    .eq('id', workoutId);

  if (error) {
    console.error('Error deleting standalone workout:', error);
    throw error;
  }
};

export const createStandaloneWorkoutExercise = async (data: {
  workout_id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  rest_seconds: number | null;
  notes: string | null;
  order_index: number;
}) => {
  const { data: workoutExercise, error } = await supabase
    .from('standalone_workout_exercises')
    .insert(data)
    .select('*')
    .single();

  if (error) {
    console.error('Error creating standalone workout exercise:', error);
    throw error;
  }

  return workoutExercise;
};

export const fetchStandaloneWorkoutExercises = async (workoutId: string) => {
  const { data: workoutExercises, error } = await supabase
    .from('standalone_workout_exercises')
    .select(`
      *,
      exercise:exercise_id (*)
    `)
    .eq('workout_id', workoutId)
    .order('order_index');

  if (error) {
    console.error('Error fetching standalone workout exercises:', error);
    throw error;
  }

  return workoutExercises;
};

export const updateStandaloneWorkoutExercise = async (exerciseId: string, data: {
  sets?: number;
  reps?: string;
  rest_seconds?: number | null;
  notes?: string | null;
  order_index?: number;
}) => {
  const { data: workoutExercise, error } = await supabase
    .from('standalone_workout_exercises')
    .update(data)
    .eq('id', exerciseId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating standalone workout exercise:', error);
    throw error;
  }

  return workoutExercise;
};

export const moveStandaloneWorkoutExerciseUp = async (exerciseId: string, workoutId: string) => {
  // Fetch all exercises to get the current order
  const exercises = await fetchStandaloneWorkoutExercises(workoutId);
  
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
  
  // Swap their order indices
  await updateStandaloneWorkoutExercise(currentExercise.id, { order_index: previousExercise.order_index });
  await updateStandaloneWorkoutExercise(previousExercise.id, { order_index: currentExercise.order_index });
  
  // Return the updated list
  return await fetchStandaloneWorkoutExercises(workoutId);
};

export const moveStandaloneWorkoutExerciseDown = async (exerciseId: string, workoutId: string) => {
  // Fetch all exercises to get the current order
  const exercises = await fetchStandaloneWorkoutExercises(workoutId);
  
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
  
  // Swap their order indices
  await updateStandaloneWorkoutExercise(currentExercise.id, { order_index: nextExercise.order_index });
  await updateStandaloneWorkoutExercise(nextExercise.id, { order_index: currentExercise.order_index });
  
  // Return the updated list
  return await fetchStandaloneWorkoutExercises(workoutId);
};

export const deleteStandaloneWorkoutExercise = async (exerciseId: string) => {
  const { error } = await supabase
    .from('standalone_workout_exercises')
    .delete()
    .eq('id', exerciseId);

  if (error) {
    console.error('Error deleting standalone workout exercise:', error);
    throw error;
  }
};

export const copyTemplateWorkoutToWeek = async (
  weekId: string, 
  templateId: string, 
  dayOfWeek: number
) => {
  try {
    const template = await fetchStandaloneWorkout(templateId);
    
    if (!template) {
      throw new Error("Template workout not found");
    }
    
    const { addWorkoutToWeek } = await import('./workout-service');
    const { createWorkoutExercise } = await import('./workout-exercise-service');
    
    const newWorkout = await addWorkoutToWeek(weekId, {
      title: template.title,
      description: template.description,
      day_of_week: dayOfWeek,
      workout_type: template.workout_type || 'strength'
    });
    
    if (template.workout_exercises && template.workout_exercises.length > 0) {
      for (const exercise of template.workout_exercises) {
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
    console.error("Error copying template workout:", error);
    throw error;
  }
};
