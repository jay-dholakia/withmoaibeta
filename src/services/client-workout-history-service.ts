import { supabase } from "@/integrations/supabase/client";
import { WorkoutBasic, WorkoutHistoryItem, WorkoutSetCompletion } from "@/types/workout";

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
    // We know the custom_workout_id field exists in the database now, so we can include it directly
    const selectStatement = `
      id, completed_at, notes, rating, user_id, workout_id, life_happens_pass, rest_day, 
      title, description, workout_type, duration, distance, location, custom_workout_id
    `;
    
    const { data: completions, error: completionsError } = await supabase
      .from('workout_completions')
      .select(selectStatement)
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
            workout_type: workout.workout_type || 'strength', // Ensure workout_type is set
            custom_workout: false
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
        
        // Handle custom workouts (direct entries without workout_id)
        if (!completion.workout_id && (completion.title || completion.custom_workout_id)) {
          // Create a custom workout history item
          const customWorkoutId = completion.custom_workout_id || completion.id;
          return {
            id: completion.id,
            completed_at,
            notes: completion.notes,
            rating: completion.rating,
            user_id: clientId,
            workout_id: customWorkoutId, // Use custom_workout_id if available
            title: completion.title,
            description: completion.description,
            workout_type: completion.workout_type || 'custom',
            duration: completion.duration,
            distance: completion.distance,
            location: completion.location,
            life_happens_pass: completion.life_happens_pass || false,
            rest_day: completion.rest_day || false,
            workout_set_completions,
            // Also add the workout object for consistency
            workout: {
              id: customWorkoutId,
              title: completion.title || 'Custom Workout',
              description: completion.description,
              day_of_week: 0, // Default value for custom workouts
              week_id: '', // Default value for custom workouts
              workout_type: completion.workout_type || 'custom',
              custom_workout: true
            } as WorkoutBasic
          } as WorkoutHistoryItem;
        }
        
        // Handle rest days (no workout_id, rest_day = true)
        if (!completion.workout_id && completion.rest_day) {
          return {
            id: completion.id,
            completed_at,
            notes: completion.notes,
            rating: completion.rating,
            user_id: clientId,
            workout_id: '',
            title: 'Rest Day', // Changed from '' to 'Rest Day'
            rest_day: true,
            life_happens_pass: completion.life_happens_pass || false,
            workout_set_completions,
            workout: {
              id: completion.id,
              title: 'Rest Day', // Changed from undefined to 'Rest Day'
              description: 'Recovery day',
              day_of_week: 0,
              week_id: '',
              workout_type: 'rest_day',
              custom_workout: false
            }
          } as WorkoutHistoryItem;
        }
        
        // Regular workout completion
        const workoutDetails = workoutMap.get(completion.workout_id) || null;
        
        // Create a valid WorkoutHistoryItem and explicitly type it
        const historyItem: WorkoutHistoryItem = {
          id: completion.id,
          completed_at,
          notes: completion.notes,
          rating: completion.rating,
          user_id: clientId,
          workout_id: completion.workout_id || '',
          workout: workoutDetails,
          life_happens_pass: completion.life_happens_pass || false,
          rest_day: completion.rest_day || false,
          workout_set_completions
        };
        
        return historyItem;
      } catch (error) {
        console.error("Error processing workout completion:", error, completion);
        // Return a valid but empty workout history item as fallback
        return {
          id: completion.id || `fallback-${Date.now()}`,
          user_id: clientId,
          workout_id: completion.workout_id || '',
          completed_at: new Date().toISOString(),
          workout: null,
          workout_set_completions: []
        } as WorkoutHistoryItem;
      }
    });
    
    return workoutHistory;
  } catch (error) {
    console.error("Error in fetchClientWorkoutHistory:", error);
    return [];
  }
};
