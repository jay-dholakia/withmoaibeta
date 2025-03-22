
import { supabase } from "@/integrations/supabase/client";
import { WorkoutBasic, WorkoutHistoryItem } from "@/types/workout";

export const fetchClientWorkoutHistory = async (clientId: string): Promise<WorkoutHistoryItem[]> => {
  try {
    // First, get the basic completion data
    const { data: completions, error: completionsError } = await supabase
      .from('workout_completions')
      .select('id, completed_at, notes, rating, user_id, workout_id, life_happens_pass')
      .eq('user_id', clientId)
      .order('completed_at', { ascending: false });
    
    if (completionsError) {
      console.error("Error fetching workout completions:", completionsError);
      throw completionsError;
    }
    
    if (!completions || completions.length === 0) {
      return [];
    }
    
    // Create a set of unique workout IDs
    const workoutIds = [...new Set(completions.map(c => c.workout_id))];
    
    // Fetch workout details separately
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id, title, description, day_of_week, week_id')
      .in('id', workoutIds);
    
    if (workoutsError) {
      console.error("Error fetching workouts:", workoutsError);
      throw workoutsError;
    }
    
    // Create workout objects with week property initialized to null
    const workoutMap: Map<string, WorkoutBasic> = new Map();
    
    if (workouts) {
      workouts.forEach(workout => {
        workoutMap.set(workout.id, {
          ...workout,
          week: null
        });
      });
    }
    
    // Fetch the week data for the workouts
    if (workouts && workouts.length > 0) {
      const weekIds = [...new Set(workouts.map(w => w.week_id))];
      
      const { data: weeks, error: weeksError } = await supabase
        .from('workout_weeks')
        .select('id, week_number, program_id')
        .in('id', weekIds);
      
      if (weeksError) {
        console.error("Error fetching workout weeks:", weeksError);
      } else if (weeks && weeks.length > 0) {
        // Get program info
        const programIds = [...new Set(weeks.map(w => w.program_id))];
        
        const { data: programs, error: programsError } = await supabase
          .from('workout_programs')
          .select('id, title')
          .in('id', programIds);
        
        if (programsError) {
          console.error("Error fetching programs:", programsError);
        }
        
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
          const weekData = weekMap.get(workout.week_id);
          if (weekData) {
            workoutMap.set(workoutId, {
              ...workout,
              week: {
                week_number: weekData.week_number,
                program: weekData.program
              }
            });
          }
        });
      }
    }
    
    // Combine the data
    return completions.map(completion => {
      const workoutDetails = workoutMap.get(completion.workout_id) || null;
      return {
        ...completion,
        workout: workoutDetails
      };
    });
  } catch (error) {
    console.error("Error in fetchClientWorkoutHistory:", error);
    return [];
  }
};

// Add the missing fetchAssignedWorkouts function
export const fetchAssignedWorkouts = async (userId: string): Promise<WorkoutHistoryItem[]> => {
  try {
    // First, get all workout completions for this user where completed_at is null (i.e., not yet completed)
    const { data: assignedWorkouts, error: assignedError } = await supabase
      .from('workout_completions')
      .select('id, workout_id, user_id')
      .eq('user_id', userId)
      .is('completed_at', null);
    
    if (assignedError) {
      console.error("Error fetching assigned workouts:", assignedError);
      throw assignedError;
    }
    
    if (!assignedWorkouts || assignedWorkouts.length === 0) {
      return [];
    }
    
    // Get the list of workout IDs
    const workoutIds = [...new Set(assignedWorkouts.map(w => w.workout_id))];
    
    // Fetch the workout details
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id, title, description, day_of_week, week_id')
      .in('id', workoutIds);
    
    if (workoutsError) {
      console.error("Error fetching workouts:", workoutsError);
      throw workoutsError;
    }
    
    // Create a map of workout objects with week property initialized to null
    const workoutMap: Map<string, WorkoutBasic> = new Map();
    
    if (workouts) {
      workouts.forEach(workout => {
        workoutMap.set(workout.id, {
          ...workout,
          week: null
        });
      });
    }
    
    // Fetch the week data for the workouts
    if (workouts && workouts.length > 0) {
      const weekIds = [...new Set(workouts.filter(w => w.week_id).map(w => w.week_id))];
      
      if (weekIds.length > 0) {
        const { data: weeks, error: weeksError } = await supabase
          .from('workout_weeks')
          .select('id, week_number, program_id')
          .in('id', weekIds);
        
        if (weeksError) {
          console.error("Error fetching workout weeks:", weeksError);
        } else if (weeks && weeks.length > 0) {
          // Get program info
          const programIds = [...new Set(weeks.filter(w => w.program_id).map(w => w.program_id))];
          
          if (programIds.length > 0) {
            const { data: programs, error: programsError } = await supabase
              .from('workout_programs')
              .select('id, title')
              .in('id', programIds);
            
            if (programsError) {
              console.error("Error fetching programs:", programsError);
            }
            
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
                      program: weekData.program
                    }
                  });
                }
              }
            });
          }
        }
      }
    }
    
    // Combine the data
    return assignedWorkouts.map(assignment => {
      const workoutDetails = workoutMap.get(assignment.workout_id) || null;
      return {
        ...assignment,
        workout: workoutDetails,
        completed_at: null // These are incomplete workouts
      };
    });
  } catch (error) {
    console.error("Error in fetchAssignedWorkouts:", error);
    return [];
  }
};
