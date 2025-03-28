import { supabase } from "@/integrations/supabase/client";
import { Exercise, Workout } from "@/types/workout";

export const createWorkout = async (data: {
  week_id: string;
  day_of_week: number;
  title: string;
  description: string | null;
  workout_type: string;
  priority?: number;
}) => {
  const { data: workout, error } = await supabase
    .from('workouts')
    .insert({
      week_id: data.week_id,
      day_of_week: data.day_of_week,
      title: data.title,
      description: data.description,
      workout_type: data.workout_type,
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
  const { data: workout, error } = await supabase
    .from('workouts')
    .update({
      title: data.title,
      description: data.description,
      day_of_week: data.day_of_week,
      workout_type: data.workout_type,
      priority: data.priority
    } as any) // Use type assertion to avoid TS error
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating workout:', error);
    throw error;
  }

  return workout;
};

export const createWorkoutProgram = async (data: {
  title: string;
  description: string | null;
  weeks: number;
  coach_id: string;
}) => {
  const { data: program, error } = await supabase
    .from('workout_programs')
    .insert(data)
    .select('*')
    .single();

  if (error) {
    console.error('Error creating workout program:', error);
    throw error;
  }

  return program;
};

export const fetchWorkoutPrograms = async (coachId: string) => {
  const { data: programs, error } = await supabase
    .from('workout_programs')
    .select('*')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching workout programs:', error);
    throw error;
  }

  return programs;
};

export const fetchWorkoutProgram = async (programId: string) => {
  const { data: program, error } = await supabase
    .from('workout_programs')
    .select('*')
    .eq('id', programId)
    .single();

  if (error) {
    console.error('Error fetching workout program:', error);
    throw error;
  }

  return program;
};

export const updateWorkoutProgram = async (programId: string, data: {
  title?: string;
  description?: string | null;
  weeks?: number;
}) => {
  const { data: program, error } = await supabase
    .from('workout_programs')
    .update(data)
    .eq('id', programId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating workout program:', error);
    throw error;
  }

  return program;
};

export const deleteWorkoutProgram = async (programId: string) => {
  const { error } = await supabase
    .from('workout_programs')
    .delete()
    .eq('id', programId);

  if (error) {
    console.error('Error deleting workout program:', error);
    throw error;
  }
};

export const createWorkoutWeek = async (data: {
  program_id: string;
  week_number: number;
  title: string;
  description: string | null;
}) => {
  const { data: week, error } = await supabase
    .from('workout_weeks')
    .insert(data)
    .select('*')
    .single();

  if (error) {
    console.error('Error creating workout week:', error);
    throw error;
  }

  return week;
};

export const fetchWorkoutWeeks = async (programId: string) => {
  const { data: weeks, error } = await supabase
    .from('workout_weeks')
    .select('*')
    .eq('program_id', programId)
    .order('week_number', { ascending: true });

  if (error) {
    console.error('Error fetching workout weeks:', error);
    throw error;
  }

  return weeks;
};

export const fetchWorkoutWeek = async (weekId: string) => {
  const { data: week, error } = await supabase
    .from('workout_weeks')
    .select('*, program:program_id (title, id)')
    .eq('id', weekId)
    .single();

  if (error) {
    console.error('Error fetching workout week:', error);
    throw error;
  }

  return week;
};

export const updateWorkoutWeek = async (weekId: string, data: {
  title?: string;
  description?: string | null;
  week_number?: number;
}) => {
  const { data: week, error } = await supabase
    .from('workout_weeks')
    .update(data)
    .eq('id', weekId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating workout week:', error);
    throw error;
  }

  return week;
};

export const deleteWorkoutWeek = async (weekId: string) => {
  const { error } = await supabase
    .from('workout_weeks')
    .delete()
    .eq('id', weekId);

  if (error) {
    console.error('Error deleting workout week:', error);
    throw error;
  }
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

export const createWorkoutExercise = async (data: {
  workout_id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  rest_seconds: number | null;
  notes: string | null;
  order_index: number;
}) => {
  const { data: workoutExercise, error } = await supabase
    .from('workout_exercises')
    .insert(data)
    .select('*')
    .single();

  if (error) {
    console.error('Error creating workout exercise:', error);
    throw error;
  }

  return workoutExercise;
};

export const fetchWorkoutExercises = async (workoutId: string) => {
  const { data: workoutExercises, error } = await supabase
    .from('workout_exercises')
    .select(`
      *,
      exercise:exercise_id (*)
    `)
    .eq('workout_id', workoutId)
    .order('order_index');

  if (error) {
    console.error('Error fetching workout exercises:', error);
    throw error;
  }

  return workoutExercises;
};

export const updateWorkoutExercise = async (exerciseId: string, data: {
  sets?: number;
  reps?: string;
  rest_seconds?: number | null;
  notes?: string | null;
  order_index?: number;
}) => {
  const { data: workoutExercise, error } = await supabase
    .from('workout_exercises')
    .update(data)
    .eq('id', exerciseId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating workout exercise:', error);
    throw error;
  }

  return workoutExercise;
};

export const moveWorkoutExerciseUp = async (exerciseId: string, workoutId: string) => {
  // Fetch all exercises to get the current order
  const exercises = await fetchWorkoutExercises(workoutId);
  
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
  await updateWorkoutExercise(currentExercise.id, { order_index: previousExercise.order_index });
  await updateWorkoutExercise(previousExercise.id, { order_index: currentExercise.order_index });
  
  // Return the updated list
  return await fetchWorkoutExercises(workoutId);
};

export const moveWorkoutExerciseDown = async (exerciseId: string, workoutId: string) => {
  // Fetch all exercises to get the current order
  const exercises = await fetchWorkoutExercises(workoutId);
  
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
  await updateWorkoutExercise(currentExercise.id, { order_index: nextExercise.order_index });
  await updateWorkoutExercise(nextExercise.id, { order_index: currentExercise.order_index });
  
  // Return the updated list
  return await fetchWorkoutExercises(workoutId);
};

export const deleteWorkoutExercise = async (exerciseId: string) => {
  const { error } = await supabase
    .from('workout_exercises')
    .delete()
    .eq('id', exerciseId);

  if (error) {
    console.error('Error deleting workout exercise:', error);
    throw error;
  }
};

export const fetchExercises = async () => {
  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching exercises:', error);
    throw error;
  }

  return exercises;
};

export const fetchExercise = async (exerciseId: string) => {
  const { data: exercise, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', exerciseId)
    .single();

  if (error) {
    console.error('Error fetching exercise:', error);
    throw error;
  }

  return exercise;
};

export const createStandaloneWorkout = async (data: {
  title: string;
  description: string | null;
  coach_id: string;
  category?: string;
  workout_type: string;
}) => {
  const { data: workout, error } = await supabase
    .from('standalone_workouts')
    .insert(data)
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
  const { data: workout, error } = await supabase
    .from('standalone_workouts')
    .update(data)
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

export const fetchExercisesByCategory = async () => {
  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching exercises by category:', error);
    throw error;
  }

  const exercisesByCategory: Record<string, Exercise[]> = {};
  
  exercisesByCategory['All'] = exercises as Exercise[];
  
  exercises.forEach(exercise => {
    if (!exercisesByCategory[exercise.category]) {
      exercisesByCategory[exercise.category] = [];
    }
    exercisesByCategory[exercise.category].push(exercise as Exercise);
  });

  return exercisesByCategory;
};

export const fetchAllClients = async () => {
  const { data: clients, error } = await supabase
    .rpc('get_coach_clients', { coach_id: (await supabase.auth.getUser()).data.user?.id });

  if (error) {
    console.error('Error fetching all clients:', error);
    throw error;
  }

  return clients || [];
};

export const fetchAssignedUsers = async (programId: string) => {
  const { data: assignments, error } = await supabase
    .from('program_assignments')
    .select('*')
    .eq('program_id', programId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching assigned users:', error);
    throw error;
  }

  return assignments;
};

export const assignProgramToUser = async (data: {
  program_id: string;
  user_id: string;
  assigned_by: string;
  start_date: string;
  end_date: string | null;
}) => {
  const { data: assignment, error } = await supabase
    .from('program_assignments')
    .insert(data)
    .select('*')
    .single();

  if (error) {
    console.error('Error assigning program to user:', error);
    throw error;
  }

  return assignment;
};

export const deleteProgramAssignment = async (assignmentId: string) => {
  const { error } = await supabase
    .from('program_assignments')
    .delete()
    .eq('id', assignmentId);

  if (error) {
    console.error('Error deleting program assignment:', error);
    throw error;
  }

  return true;
};

export const getWorkoutProgramAssignmentCount = async (programId: string) => {
  const { count, error } = await supabase
    .from('program_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('program_id', programId);

  if (error) {
    console.error('Error getting workout program assignment count:', error);
    throw error;
  }

  return count || 0;
};

export const addWorkoutToWeek = async (weekId: string, data: {
  title: string;
  description?: string | null;
  day_of_week: number;
  workout_type: string;
}) => {
  const { data: workout, error } = await supabase
    .from('workouts')
    .insert({
      week_id: weekId,
      title: data.title,
      description: data.description || null,
      day_of_week: data.day_of_week,
      workout_type: data.workout_type
    } as any) // Use type assertion to avoid TS error
    .select('*')
    .single();

  if (error) {
    console.error('Error adding workout to week:', error);
    throw error;
  }

  return workout;
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
