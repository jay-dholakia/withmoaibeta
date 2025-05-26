import { supabase } from '@/integrations/supabase/client';
import { WorkoutProgram } from '@/types/workout';

/**
 * Fetches workout programs
 */
export const fetchWorkoutPrograms = async (coachId?: string, fetchAllPrograms: boolean = false) => {
  try {
    let query = supabase
      .from('workout_programs')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Only filter by coach ID if fetchAllPrograms is false
    if (coachId && !fetchAllPrograms) {
      query = query.eq('coach_id', coachId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workout programs:', error);
    throw error;
  }
};

/**
 * Fetches a specific workout program
 */
export const fetchWorkoutProgram = async (programId: string) => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('id', programId)
      .maybeSingle();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching workout program:', error);
    throw error;
  }
};

/**
 * Creates a workout program
 */
export const createWorkoutProgram = async (programData: {
  title: string;
  description?: string | null;
  coach_id: string;
  program_type: string;
  weeks: number;
}) => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .insert([programData])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating workout program:', error);
    throw error;
  }
};

/**
 * Updates a workout program
 */
export const updateWorkoutProgram = async (programId: string, programData: {
  title?: string;
  description?: string | null;
  program_type?: string;
  weeks?: number;
}) => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .update(programData)
      .eq('id', programId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating workout program:', error);
    throw error;
  }
};

/**
 * Deletes a workout program
 */
export const deleteWorkoutProgram = async (programId: string) => {
  try {
    const { error } = await supabase
      .from('workout_programs')
      .delete()
      .eq('id', programId);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting workout program:', error);
    throw error;
  }
};

/**
 * Duplicates a workout program with all its content
 */
export const duplicateWorkoutProgram = async (programId: string, newTitle: string) => {
  try {
    // First, fetch the original program
    const { data: originalProgram, error: fetchError } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('id', programId)
      .single();

    if (fetchError || !originalProgram) {
      throw new Error('Failed to fetch original program');
    }

    // Create the new program
    const { data: newProgram, error: createError } = await supabase
      .from('workout_programs')
      .insert({
        title: newTitle,
        description: originalProgram.description,
        weeks: originalProgram.weeks,
        program_type: originalProgram.program_type,
        coach_id: originalProgram.coach_id
      })
      .select()
      .single();

    if (createError || !newProgram) {
      throw new Error('Failed to create new program');
    }

    // Fetch and duplicate all weeks for this program
    const { data: originalWeeks, error: weeksError } = await supabase
      .from('workout_weeks')
      .select('*')
      .eq('program_id', programId)
      .order('week_number', { ascending: true });

    if (weeksError) {
      throw new Error('Failed to fetch original weeks');
    }

    if (originalWeeks && originalWeeks.length > 0) {
      for (const week of originalWeeks) {
        // Create new week
        const { data: newWeek, error: newWeekError } = await supabase
          .from('workout_weeks')
          .insert({
            program_id: newProgram.id,
            week_number: week.week_number,
            title: week.title,
            description: week.description,
            target_strength_workouts: week.target_strength_workouts,
            target_strength_mobility_workouts: week.target_strength_mobility_workouts,
            target_miles_run: week.target_miles_run,
            target_cardio_minutes: week.target_cardio_minutes
          })
          .select()
          .single();

        if (newWeekError || !newWeek) {
          console.error('Error creating new week:', newWeekError);
          continue;
        }

        // Fetch and duplicate workouts for this week
        const { data: originalWorkouts, error: workoutsError } = await supabase
          .from('workouts')
          .select('*')
          .eq('week_id', week.id)
          .order('day_of_week', { ascending: true });

        if (workoutsError) {
          console.error('Error fetching original workouts:', workoutsError);
          continue;
        }

        if (originalWorkouts && originalWorkouts.length > 0) {
          for (const workout of originalWorkouts) {
            // Create new workout
            const { data: newWorkout, error: newWorkoutError } = await supabase
              .from('workouts')
              .insert({
                week_id: newWeek.id,
                title: workout.title,
                description: workout.description,
                day_of_week: workout.day_of_week,
                workout_type: workout.workout_type,
                template_id: workout.template_id,
                priority: workout.priority
              })
              .select()
              .single();

            if (newWorkoutError || !newWorkout) {
              console.error('Error creating new workout:', newWorkoutError);
              continue;
            }

            // Fetch and duplicate exercises for this workout
            const { data: originalExercises, error: exercisesError } = await supabase
              .from('workout_exercises')
              .select('*')
              .eq('workout_id', workout.id)
              .order('order_index', { ascending: true });

            if (exercisesError) {
              console.error('Error fetching original exercises:', exercisesError);
              continue;
            }

            if (originalExercises && originalExercises.length > 0) {
              const exercisesToInsert = originalExercises.map(exercise => ({
                workout_id: newWorkout.id,
                exercise_id: exercise.exercise_id,
                sets: exercise.sets,
                reps: exercise.reps,
                rest_seconds: exercise.rest_seconds,
                notes: exercise.notes,
                order_index: exercise.order_index,
                superset_group_id: exercise.superset_group_id,
                superset_order: exercise.superset_order
              }));

              const { error: insertExercisesError } = await supabase
                .from('workout_exercises')
                .insert(exercisesToInsert);

              if (insertExercisesError) {
                console.error('Error inserting new exercises:', insertExercisesError);
              }
            }
          }
        }
      }
    }

    return newProgram;
  } catch (error) {
    console.error('Error duplicating workout program:', error);
    throw error;
  }
};

/**
 * Renames a workout program
 */
export const renameWorkoutProgram = async (programId: string, newTitle: string) => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .update({ title: newTitle })
      .eq('id', programId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error renaming workout program:', error);
    throw error;
  }
};
