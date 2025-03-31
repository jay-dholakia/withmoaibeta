
/**
 * Workout tracking service for tracking sets, completing workouts, and fetching personal records
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Tracks a set for a workout
 */
export const trackWorkoutSet = async (
  workoutCompletionId: string,
  workoutExerciseId: string,
  setNumber: number,
  weight: number | null,
  reps: number | null,
  notes: string | null = null,
  distance: string | null = null,
  duration: string | null = null,
  location: string | null = null
) => {
  try {
    console.log("Tracking workout set with params:", {
      workoutCompletionId,
      workoutExerciseId,
      setNumber,
      weight,
      reps,
      notes,
      distance,
      duration,
      location
    });

    // First, check if the workout completion record exists
    const { data: completionData, error: completionError } = await supabase
      .from('workout_completions')
      .select('user_id, workout_id')
      .eq('id', workoutCompletionId)
      .maybeSingle();
    
    if (completionError) {
      console.error("Error fetching workout completion:", completionError);
      throw completionError;
    }
    
    // If no completion record found, we need to create one
    let userId;
    let workoutId;
    
    if (!completionData) {
      // Get the current user ID
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData || !userData.user) {
        console.error("Cannot track set: User not authenticated");
        throw new Error("User not authenticated");
      }
      
      userId = userData.user.id;
      
      // Get the workout ID from the workout_exercises table
      const { data: exerciseData, error: exerciseError } = await supabase
        .from('workout_exercises')
        .select('workout_id')
        .eq('id', workoutExerciseId)
        .maybeSingle();
      
      if (exerciseError) {
        console.error("Error fetching workout exercise:", exerciseError);
        throw exerciseError;
      }
      
      if (!exerciseData) {
        console.error("Workout exercise not found:", workoutExerciseId);
        throw new Error("Workout exercise not found");
      }
      
      workoutId = exerciseData.workout_id;
      
      // Check if workout completion with this ID already exists before creating
      try {
        const { data: existingCompletion, error: existingCompletionError } = await supabase
          .from('workout_completions')
          .select('id, user_id, workout_id')
          .eq('id', workoutCompletionId)
          .maybeSingle();
          
        if (existingCompletionError && existingCompletionError.code !== 'PGRST116') {
          console.error("Error checking for existing completion:", existingCompletionError);
          // Continue with the attempt to create a new record
        }
        
        if (!existingCompletion) {
          // Only create if it doesn't exist
          try {
            const { data: newCompletion, error: newCompletionError } = await supabase
              .from('workout_completions')
              .insert({
                id: workoutCompletionId,
                user_id: userId,
                workout_id: workoutId,
                created_at: new Date().toISOString()
              })
              .select()
              .single();
              
            if (newCompletionError) {
              // If this is a duplicate key error, it means another request created the record
              // between our check and insert (race condition)
              if (newCompletionError.code === '23505') {
                console.log("Workout completion already exists (race condition), fetching existing record");
                
                const { data: existingData, error: fetchError } = await supabase
                  .from('workout_completions')
                  .select('user_id, workout_id')
                  .eq('id', workoutCompletionId)
                  .single();
                  
                if (fetchError) {
                  console.error("Error fetching existing workout completion after duplicate key:", fetchError);
                  throw fetchError;
                }
                
                if (existingData) {
                  userId = existingData.user_id;
                  workoutId = existingData.workout_id;
                } else {
                  throw new Error("Could not retrieve existing workout completion after duplicate key error");
                }
              } else {
                console.error("Error creating workout completion:", newCompletionError);
                throw newCompletionError;
              }
            } else if (newCompletion) {
              console.log("Created new workout completion:", newCompletion);
            }
          } catch (createError: any) {
            if (createError.code === '23505') {
              // Handle duplicate key error by fetching the existing record
              const { data: existingData, error: fetchError } = await supabase
                .from('workout_completions')
                .select('user_id, workout_id')
                .eq('id', workoutCompletionId)
                .single();
                
              if (fetchError) {
                console.error("Error fetching existing record after duplicate key:", fetchError);
                throw fetchError;
              }
              
              if (existingData) {
                userId = existingData.user_id;
                workoutId = existingData.workout_id;
              } else {
                throw createError;
              }
            } else {
              throw createError;
            }
          }
        } else {
          // Get the user_id and workout_id from the existing record
          userId = existingCompletion.user_id;
          workoutId = existingCompletion.workout_id;
        }
      } catch (error) {
        console.error("Error handling workout completion creation:", error);
        
        // If we still don't have userId or workoutId, something is wrong
        if (!userId || !workoutId) {
          throw new Error("Could not determine user or workout for completion");
        }
      }
    } else {
      userId = completionData.user_id;
      workoutId = completionData.workout_id;
    }
    
    const { data: existingSetData, error: existingSetError } = await supabase
      .from('workout_set_completions')
      .select('id')
      .eq('workout_completion_id', workoutCompletionId)
      .eq('workout_exercise_id', workoutExerciseId)
      .eq('set_number', setNumber)
      .maybeSingle();
    
    if (existingSetError) {
      console.error("Error checking for existing set:", existingSetError);
      throw existingSetError;
    }
    
    // Set a default value for reps if null to satisfy the personal_records constraint
    // Note: We only do this for the personal_records trigger, not for the actual set data
    const defaultReps = reps !== null ? reps : 1;
    
    if (existingSetData) {
      // Update existing set
      const { data, error } = await supabase
        .from('workout_set_completions')
        .update({
          weight,
          reps_completed: reps,
          completed: true,
          notes,
          distance,
          duration,
          location
        })
        .eq('id', existingSetData.id)
        .select();
      
      if (error) {
        console.error("Error updating workout set:", error);
        throw error;
      }
      
      return data?.[0];
    } else {
      // Insert new set
      const { data, error } = await supabase
        .from('workout_set_completions')
        .insert({
          workout_completion_id: workoutCompletionId,
          workout_exercise_id: workoutExerciseId,
          user_id: userId,
          set_number: setNumber,
          weight,
          reps_completed: reps,
          completed: true,
          notes,
          distance,
          duration,
          location
        })
        .select();
      
      if (error) {
        // If this is a personal_records constraint violation, it's likely because reps is null
        if (error.code === '23502' && error.message?.includes('personal_records')) {
          console.error("Constraint violation in personal_records, disabling trigger for this operation");
          // For now, we'll just catch this specific error and provide a more helpful message
          throw new Error("Cannot track set with null reps for exercise that requires rep tracking. Please provide a valid rep count.");
        }
        console.error("Error tracking workout set:", error);
        throw error;
      }
      
      return data?.[0];
    }
  } catch (error) {
    console.error("Error in trackWorkoutSet:", error);
    throw error;
  }
};

/**
 * Completes a workout
 */
export const completeWorkout = async (
  workoutCompletionId: string,
  rating: number | null,
  notes: string | null
) => {
  try {
    const { data, error } = await supabase
      .from('workout_completions')
      .update({
        completed_at: new Date().toISOString(),
        rating,
        notes
      })
      .eq('id', workoutCompletionId)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error("Error completing workout:", error);
      throw error;
    }
    
    // Check for any personal records that were achieved
    await fetchPersonalRecords(workoutCompletionId);
    
    return data;
  } catch (error) {
    console.error("Error in completeWorkout:", error);
    throw error;
  }
};

/**
 * Fetches personal records for a specific workout completion
 */
export const fetchPersonalRecords = async (workoutCompletionId: string) => {
  try {
    const { data, error } = await supabase
      .from('personal_records')
      .select(`
        *,
        exercise:exercise_id (*)
      `)
      .eq('workout_completion_id', workoutCompletionId);
    
    if (error) {
      console.error("Error fetching personal records:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error in fetchPersonalRecords:", error);
    throw error;
  }
};

/**
 * Submits beta feedback
 */
export const submitBetaFeedback = async (userId: string, feedback: string) => {
  try {
    const { data, error } = await supabase
      .from('beta_feedback')
      .insert({
        user_id: userId,
        feedback
      });
    
    if (error) {
      console.error("Error submitting beta feedback:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error in submitBetaFeedback:", error);
    throw error;
  }
};
