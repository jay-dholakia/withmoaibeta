import { supabase } from "@/integrations/supabase/client";
import { WorkoutBasic, WorkoutHistoryItem, WorkoutSetCompletion } from "@/types/workout";

// Function to log a one-off workout (not part of a program)
export const createOneOffWorkoutCompletion = async (data: {
  title: string;
  description?: string;
  notes?: string;
  workout_type?: string;
  rating?: number;
  distance?: string;
  duration?: string;
  location?: string;
  completed_at?: string;
}) => {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error("User not authenticated");
  }
  
  const { error } = await supabase
    .from('workout_completions')
    .insert({
      user_id: userData.user.id,
      title: data.title,
      description: data.description,
      notes: data.notes,
      workout_type: data.workout_type || 'one_off',
      rating: data.rating,
      distance: data.distance,
      duration: data.duration,
      location: data.location,
      completed_at: data.completed_at || new Date().toISOString(),
      life_happens_pass: false,
      rest_day: false
    });
  
  if (error) {
    console.error("Error creating one-off workout:", error);
    throw error;
  }
  
  return true;
};

// Function to log a rest day
export const logRestDay = async (notes?: string) => {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error("User not authenticated");
  }
  
  const { error } = await supabase
    .from('workout_completions')
    .insert({
      user_id: userData.user.id,
      rest_day: true,
      notes: notes,
      title: "Rest Day",
      workout_type: 'rest_day',
      completed_at: new Date().toISOString()
    });
  
  if (error) {
    console.error("Error logging rest day:", error);
    throw error;
  }
  
  return true;
};

// Function to log a life happens pass
export const useLifeHappensPass = async (notes?: string) => {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error("User not authenticated");
  }
  
  const { error } = await supabase
    .from('workout_completions')
    .insert({
      user_id: userData.user.id,
      life_happens_pass: true,
      notes: notes,
      title: "Life Happens Pass",
      workout_type: 'rest_day',
      completed_at: new Date().toISOString()
    });
  
  if (error) {
    console.error("Error logging life happens pass:", error);
    throw error;
  }
  
  return true;
};

// Function to complete a custom workout
export const completeCustomWorkout = async (customWorkoutId: string, notes?: string) => {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error("User not authenticated");
  }
  
  // First get the custom workout details
  const { data: customWorkout, error: customWorkoutError } = await supabase
    .from('client_custom_workouts')
    .select('*')
    .eq('id', customWorkoutId)
    .single();
  
  if (customWorkoutError) {
    console.error("Error fetching custom workout:", customWorkoutError);
    throw customWorkoutError;
  }
  
  // Then create the workout completion
  const { error } = await supabase
    .from('workout_completions')
    .insert({
      user_id: userData.user.id,
      title: customWorkout.title,
      description: customWorkout.description,
      notes: notes,
      workout_type: customWorkout.workout_type || 'custom',
      custom_workout_id: customWorkoutId,
      completed_at: customWorkout.workout_date || new Date().toISOString(),
      life_happens_pass: false,
      rest_day: false
    });
  
  if (error) {
    console.error("Error completing custom workout:", error);
    throw error;
  }
  
  return true;
};

// Function to delete a workout completion
export const deleteWorkoutCompletion = async (id: string) => {
  const { error } = await supabase
    .from('workout_completions')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error("Error deleting workout completion:", error);
    throw error;
  }
  
  return true;
};

// Add the missing functions that are imported in other files
export const getWeeklyAssignedWorkoutsCount = async (userId: string): Promise<number> => {
  try {
    // Default to 5 workouts per week if we can't determine the actual count
    return 5;
    
    // In a real implementation, you would query the database to get the actual count
    // based on the user's assigned programs for the current week
  } catch (error) {
    console.error("Error getting weekly assigned workouts count:", error);
    return 5; // Default fallback
  }
};

export const countCompletedWorkoutsForWeek = async (userId: string, weekStartDate: Date): Promise<number> => {
  try {
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    
    const { count, error } = await supabase
      .from('workout_completions')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('completed_at', weekStartDate.toISOString())
      .lte('completed_at', weekEndDate.toISOString())
      .is('life_happens_pass', false)
      .is('rest_day', false);
    
    if (error) throw error;
    
    return count || 0;
  } catch (error) {
    console.error("Error counting completed workouts for week:", error);
    return 0;
  }
};

export const getUserIdByEmail = async (email: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    
    if (error) throw error;
    
    return data?.id || null;
  } catch (error) {
    console.error("Error getting user ID by email:", error);
    return null;
  }
};

export const getAssignedWorkoutsCountForWeek = async (userId: string, weekNumber: number): Promise<number> => {
  try {
    // This would normally query the database to get the number of workouts assigned for a specific week
    // For now, we'll return a default value
    return 5;
  } catch (error) {
    console.error("Error getting assigned workouts count for week:", error);
    return 5; // Default fallback
  }
};

/**
 * Fetches the workout history for a specific client
 */
export const fetchClientWorkoutHistory = async (clientId: string): Promise<WorkoutHistoryItem[]> => {
  try {
    if (!clientId) {
      console.error("Invalid clientId provided to fetchClientWorkoutHistory");
      return [];
    }

    // First, get the basic completion data - only include properly completed workouts
    const { data: completions, error: completionsError } = await supabase
      .from('workout_completions')
      .select('id, completed_at, notes, rating, user_id, workout_id, life_happens_pass, rest_day')
      .eq('user_id', clientId)
      .not('completed_at', 'is', null)  // Only include workouts that have a completion date
      .order('completed_at', { ascending: false });
    
    if (completionsError) {
      console.error("Error fetching workout completions:", completionsError);
      return [];
    }
    
    if (!completions || completions.length === 0) {
      return [];
    }
    
    // Create a set of unique workout IDs, filtering out null values
    const workoutIds = [
      ...new Set(
        completions
          .map(c => c.workout_id)
          .filter(id => id !== null && id !== undefined)
      )
    ];
    
    // Initialize the workout map
    const workoutMap: Map<string, WorkoutBasic> = new Map();
    
    // Only fetch workout details if we have valid workout IDs
    if (workoutIds.length > 0) {
      try {
        // Fetch workout details separately
        const { data: workouts, error: workoutsError } = await supabase
          .from('workouts')
          .select('id, title, description, day_of_week, week_id, workout_type')
          .in('id', workoutIds);
        
        if (workoutsError) {
          console.error("Error fetching workouts:", workoutsError);
          // Continue execution but with empty workouts
        } else if (workouts && workouts.length > 0) {
          // Create workout objects with week property initialized to null
          workouts.forEach(workout => {
            workoutMap.set(workout.id, {
              ...workout,
              week: null,
              workout_type: workout.workout_type || 'strength' // Ensure workout_type is set
            });
          });
          
          // Fetch the week data for the workouts
          if (workouts.length > 0) {
            const weekIds = [...new Set(workouts.map(w => w.week_id).filter(Boolean))];
            
            if (weekIds.length > 0) {
              try {
                const { data: weeks, error: weeksError } = await supabase
                  .from('workout_weeks')
                  .select('id, week_number, program_id')
                  .in('id', weekIds);
                
                if (weeksError) {
                  console.error("Error fetching workout weeks:", weeksError);
                } else if (weeks && weeks.length > 0) {
                  // Get program info
                  const programIds = [...new Set(weeks.map(w => w.program_id).filter(Boolean))];
                  
                  if (programIds.length > 0) {
                    try {
                      // Ensure we select the title and id fields from programs
                      const { data: programs, error: programsError } = await supabase
                        .from('workout_programs')
                        .select('id, title')
                        .in('id', programIds);
                      
                      if (programsError) {
                        console.error("Error fetching programs:", programsError);
                      } else if (programs) {
                        // Create a map of programs for quick lookup
                        const programMap = new Map();
                        programs.forEach(program => {
                          programMap.set(program.id, program);
                        });
                        
                        // Create a map of weeks with program data
                        const weekMap = new Map();
                        weeks.forEach(week => {
                          const program = programMap.get(week.program_id);
                          weekMap.set(week.id, {
                            ...week,
                            program: program || null
                          });
                        });
                        
                        // Add week data to each workout in workoutMap
                        workoutMap.forEach((workout, workoutId) => {
                          if (workout.week_id) {
                            const weekData = weekMap.get(workout.week_id);
                            if (weekData) {
                              workoutMap.set(workoutId, {
                                ...workout,
                                week: {
                                  week_number: weekData.week_number,
                                  program: weekData.program ? {
                                    id: weekData.program.id,
                                    title: weekData.program.title
                                  } : null
                                }
                              });
                            }
                          }
                        });
                      }
                    } catch (err) {
                      console.error("Error processing program data:", err);
                    }
                  }
                }
              } catch (err) {
                console.error("Error processing week data:", err);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error processing workout data:", err);
      }
    }
    
    // Fetch workout set completions if we have completion IDs
    const completionIds = completions.map(completion => completion.id);
    const setCompletionsMap: Map<string, WorkoutSetCompletion[]> = new Map();
    
    if (completionIds.length > 0) {
      try {
        const { data: setCompletions, error: setCompletionsError } = await supabase
          .from('workout_set_completions')
          .select('*')
          .in('workout_completion_id', completionIds);
        
        if (setCompletionsError) {
          console.error("Error fetching workout set completions:", setCompletionsError);
        } else if (setCompletions && setCompletions.length > 0) {
          // Create a map of set completions by workout completion ID  
          setCompletions.forEach((setCompletion) => {
            const completionId = setCompletion.workout_completion_id;
            if (!setCompletionsMap.has(completionId)) {
              setCompletionsMap.set(completionId, []);
            }
            const completionsArray = setCompletionsMap.get(completionId);
            if (completionsArray) {
              completionsArray.push(setCompletion as WorkoutSetCompletion);
            }
          });
        }
      } catch (err) {
        console.error("Error processing set completion data:", err);
      }
    }
    
    // Combine the data - ensure completed_at is a proper date string
    const workoutHistory: WorkoutHistoryItem[] = completions.map(completion => {
      try {
        // Ensure completed_at is a valid date string and not null/undefined
        const completed_at = completion.completed_at 
          ? new Date(completion.completed_at).toISOString() 
          : new Date().toISOString();
          
        // Get set completions for this workout completion
        const workout_set_completions = setCompletionsMap.get(completion.id) || [];
        
        // If workout_id is null, return completion without workout details
        if (!completion.workout_id) {
          return {
            ...completion,
            completed_at, // Use the validated date
            workout: null,
            workout_set_completions
          };
        }
        
        const workoutDetails = workoutMap.get(completion.workout_id) || null;
        return {
          ...completion,
          completed_at, // Use the validated date
          workout: workoutDetails,
          workout_set_completions
        };
      } catch (error) {
        console.error("Error processing workout completion:", error, completion);
        // Return a valid but empty workout history item as fallback
        return {
          id: completion.id,
          user_id: clientId,
          workout_id: completion.workout_id || '',
          completed_at: new Date().toISOString(),
          workout: null,
          workout_set_completions: []
        };
      }
    });
    
    return workoutHistory;
  } catch (error) {
    console.error("Error in fetchClientWorkoutHistory:", error);
    return [];
  }
};
