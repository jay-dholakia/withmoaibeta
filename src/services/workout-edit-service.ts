import { supabase } from "@/integrations/supabase/client";
import { WorkoutSetCompletion, StandardWorkoutType } from "@/types/workout";

/**
 * Updates a workout set completion record
 */
export const updateWorkoutSetCompletion = async (
  completionId: string,
  data: Partial<WorkoutSetCompletion>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_set_completions')
      .update(data)
      .eq('id', completionId);
      
    if (error) {
      console.error("Error updating workout set completion:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateWorkoutSetCompletion:", error);
    return false;
  }
};

/**
 * Updates a workout completion entry directly
 */
export const updateWorkoutCompletion = async (
  completionId: string,
  data: {
    title?: string;
    description?: string | null;
    duration?: string | null;
    workout_type?: string;
    notes?: string | null;
    location?: string | null;
    distance?: string | null;
    completed_at?: string | null; // Added ability to update completion date
  }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_completions')
      .update(data)
      .eq('id', completionId);
      
    if (error) {
      console.error("Error updating workout completion:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateWorkoutCompletion:", error);
    return false;
  }
};

/**
 * Batch updates a list of workout set completions
 */
export const batchUpdateWorkoutSetCompletions = async (
  updates: Array<{
    id: string,
    changes: Partial<WorkoutSetCompletion>
  }>
): Promise<number> => {
  try {
    let successCount = 0;
    
    // Process updates in batches of 10 to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      // Create an array of promises for this batch
      const promises = batch.map(({ id, changes }) => 
        supabase
          .from('workout_set_completions')
          .update(changes)
          .eq('id', id)
      );
      
      // Execute all promises in this batch
      const results = await Promise.all(promises);
      
      // Count successful updates
      results.forEach((result) => {
        if (!result.error) {
          successCount++;
        } else {
          console.error("Error updating workout set completion:", result.error);
        }
      });
    }
    
    return successCount;
  } catch (error) {
    console.error("Error in batchUpdateWorkoutSetCompletions:", error);
    return 0;
  }
};

/**
 * Gets complete exercise information for a workout exercise
 */
export const getExerciseForWorkoutExercise = async (
  workoutExerciseId: string
): Promise<{ id: string; name: string; exercise_type: string } | null> => {
  try {
    // First get the exercise_id from the workout_exercise
    const { data: workoutExercise, error: workoutExerciseError } = await supabase
      .from('workout_exercises')
      .select('exercise_id')
      .eq('id', workoutExerciseId)
      .single();
      
    if (workoutExerciseError || !workoutExercise) {
      console.error("Could not find workout exercise:", workoutExerciseError);
      return null;
    }
    
    // Then get the exercise details
    const { data: exercise, error: exerciseError } = await supabase
      .from('exercises')
      .select('id, name, exercise_type')
      .eq('id', workoutExercise.exercise_id)
      .single();
      
    if (exerciseError || !exercise) {
      console.error("Could not find exercise:", exerciseError);
      return null;
    }
    
    return exercise;
  } catch (error) {
    console.error("Error in getExerciseForWorkoutExercise:", error);
    return null;
  }
};

/**
 * Detects workout type from title or description
 * This helps ensure the correct workout type emoji is displayed
 */
export const detectWorkoutTypeFromText = (text: string): StandardWorkoutType => {
  if (!text) return 'strength';
  
  const lowerText = text.toLowerCase();
  
  // Check for sport-related keywords
  if (
    lowerText.includes('tennis') || 
    lowerText.includes('basketball') || 
    lowerText.includes('soccer') || 
    lowerText.includes('football') || 
    lowerText.includes('baseball') || 
    lowerText.includes('volleyball') || 
    lowerText.includes('golf') || 
    lowerText.includes('hockey') || 
    lowerText.includes('badminton') || 
    lowerText.includes('frisbee') || 
    lowerText.includes('sport')
  ) {
    return 'sport';
  }
  
  // Check for swimming
  if (lowerText.includes('swim') || lowerText.includes('pool')) {
    return 'swimming';
  }
  
  // Check for cycling
  if (
    lowerText.includes('bike') || 
    lowerText.includes('cycling') || 
    lowerText.includes('cycle')
  ) {
    return 'cycling';
  }
  
  // Check for running/cardio
  if (
    lowerText.includes('run') || 
    lowerText.includes('jog') || 
    lowerText.includes('cardio') || 
    lowerText.includes('treadmill') || 
    lowerText.includes('elliptical')
  ) {
    return 'cardio';
  }
  
  // Check for HIIT
  if (
    lowerText.includes('hiit') || 
    lowerText.includes('interval') || 
    lowerText.includes('high intensity')
  ) {
    return 'hiit';
  }
  
  // Check for flexibility/yoga
  if (
    lowerText.includes('yoga') || 
    lowerText.includes('stretch') || 
    lowerText.includes('flexibility') || 
    lowerText.includes('mobility')
  ) {
    return 'flexibility';
  }
  
  // Check for bodyweight
  if (
    lowerText.includes('bodyweight') || 
    lowerText.includes('body weight') || 
    lowerText.includes('calisthenics')
  ) {
    return 'bodyweight';
  }
  
  // Check for dance
  if (
    lowerText.includes('dance') || 
    lowerText.includes('zumba') || 
    lowerText.includes('aerobics')
  ) {
    return 'dance';
  }
  
  // Default to strength
  return 'strength';
};

/**
 * Gets exercise information from a workout_exercise_id
 * This is a more robust method that attempts multiple ways to look up the exercise
 */
export const getExerciseInfoByWorkoutExerciseId = async (
  workoutExerciseId: string
): Promise<{ name: string; type: string } | null> => {
  try {
    // First try to get the exercise info from workout_set_completions
    const { data: setCompletions, error: setCompletionsError } = await supabase
      .from('workout_set_completions')
      .select('workout_exercise_id, weight, duration, distance')
      .eq('workout_exercise_id', workoutExerciseId)
      .limit(1)
      .maybeSingle();
      
    // Then try to get exercise info from multiple possible tables
    const lookupExerciseInfo = async () => {
      // Try workout_exercises first
      const { data: workoutExercise } = await supabase
        .from('workout_exercises')
        .select('exercise:exercises(name, exercise_type)')
        .eq('id', workoutExerciseId)
        .maybeSingle();

      if (workoutExercise?.exercise) {
        return {
          name: workoutExercise.exercise.name,
          type: workoutExercise.exercise.exercise_type
        };
      }

      // Try standalone_workout_exercises next
      const { data: standaloneExercise } = await supabase
        .from('standalone_workout_exercises')
        .select('exercise:exercises(name, exercise_type)')
        .eq('id', workoutExerciseId)
        .maybeSingle();

      if (standaloneExercise?.exercise) {
        return {
          name: standaloneExercise.exercise.name,
          type: standaloneExercise.exercise.exercise_type
        };
      }

      // Try client_custom_workout_exercises
      const { data: customExercise } = await supabase
        .from('client_custom_workout_exercises')
        .select('custom_exercise_name, exercise:exercises(name, exercise_type)')
        .eq('id', workoutExerciseId)
        .maybeSingle();

      if (customExercise) {
        if (customExercise.custom_exercise_name) {
          return {
            name: customExercise.custom_exercise_name,
            type: 'strength' // Default to strength for custom exercises
          };
        } else if (customExercise.exercise) {
          return {
            name: customExercise.exercise.name,
            type: customExercise.exercise.exercise_type
          };
        }
      }

      // If we have set completion data, use it to infer the type
      if (setCompletions) {
        let inferredType = 'strength';
        let inferredName = 'Exercise';

        if (setCompletions.distance) {
          inferredType = 'cardio';
          inferredName = 'Running Exercise';
        } else if (setCompletions.duration && !setCompletions.weight) {
          inferredType = 'cardio';
          inferredName = 'Cardio Exercise';
        }

        return {
          name: inferredName,
          type: inferredType
        };
      }

      // Last resort fallback
      return {
        name: "Exercise",
        type: "strength"
      };
    };

    const exerciseInfo = await lookupExerciseInfo();
    return exerciseInfo;

  } catch (error) {
    console.error("Error in getExerciseInfoByWorkoutExerciseId:", error);
    return {
      name: "Exercise",
      type: "strength"
    };
  }
};
