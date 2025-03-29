
import { supabase } from "@/integrations/supabase/client";
import { WorkoutBasic, WorkoutHistoryItem } from "@/types/workout";

/**
 * Fetches the workout history for a specific client
 */
export const fetchClientWorkoutHistory = async (clientId: string): Promise<WorkoutHistoryItem[]> => {
  try {
    // First, get the basic completion data - only include properly completed workouts
    const { data: completions, error: completionsError } = await supabase
      .from('workout_completions')
      .select('id, completed_at, notes, rating, user_id, workout_id, life_happens_pass, rest_day')
      .eq('user_id', clientId)
      .not('completed_at', 'is', null)  // Only include workouts that have a completion date
      .order('completed_at', { ascending: false });
    
    if (completionsError) {
      console.error("Error fetching workout completions:", completionsError);
      throw completionsError;
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
        throw workoutsError;
      }
      
      // Create workout objects with week property initialized to null
      if (workouts) {
        workouts.forEach(workout => {
          workoutMap.set(workout.id, {
            ...workout,
            week: null,
            workout_type: workout.workout_type || 'strength' // Ensure workout_type is set
          });
        });
      }
      
      // Fetch the week data for the workouts
      if (workouts && workouts.length > 0) {
        const weekIds = [...new Set(workouts.map(w => w.week_id).filter(Boolean))];
        
        if (weekIds.length > 0) {
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
              // Ensure we select the title and id fields from programs
              const { data: programs, error: programsError } = await supabase
                .from('workout_programs')
                .select('id, title')
                .in('id', programIds);
              
              if (programsError) {
                console.error("Error fetching programs:", programsError);
              } else {
                console.log("Debug - Fetched programs for history:", programs);
                
                // Create a map of programs for quick lookup
                const programMap = new Map();
                if (programs) {
                  programs.forEach(program => {
                    programMap.set(program.id, program);
                  });
                }
                
                // Create a map of weeks with program data
                const weekMap = new Map();
                if (weeks) {
                  weeks.forEach(week => {
                    const program = programMap.get(week.program_id);
                    weekMap.set(week.id, {
                      ...week,
                      program: program || null
                    });
                  });
                }
                
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
            }
          }
        }
      }
    }
    
    // Combine the data - ensure completed_at is a proper date string
    return completions.map(completion => {
      // Ensure completed_at is a valid date string and not null/undefined
      const completed_at = completion.completed_at 
        ? new Date(completion.completed_at).toISOString() 
        : new Date().toISOString();
        
      // If workout_id is null, return completion without workout details
      if (!completion.workout_id) {
        return {
          ...completion,
          completed_at, // Use the validated date
          workout: null
        };
      }
      
      const workoutDetails = workoutMap.get(completion.workout_id) || null;
      return {
        ...completion,
        completed_at, // Use the validated date
        workout: workoutDetails
      };
    });
  } catch (error) {
    console.error("Error in fetchClientWorkoutHistory:", error);
    return [];
  }
};
