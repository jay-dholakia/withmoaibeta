
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

export const fetchAssignedWorkouts = async (userId: string): Promise<WorkoutHistoryItem[]> => {
  try {
    console.log(`Fetching assigned workouts for user: ${userId}`);
    
    // First, get the active program assignments for this user
    const { data: programAssignments, error: programError } = await supabase
      .from('program_assignments')
      .select('id, program_id, start_date, end_date')
      .eq('user_id', userId)
      .is('end_date', null)
      .or(`end_date.gt.${new Date().toISOString()}`);
    
    if (programError) {
      console.error("Error fetching program assignments:", programError);
      throw programError;
    }
    
    if (!programAssignments || programAssignments.length === 0) {
      console.log("No active program assignments found for user");
      return [];
    }
    
    console.log(`Found ${programAssignments.length} active program assignments`);
    
    // Get all program IDs
    const programIds = programAssignments.map(pa => pa.program_id);
    
    // Get all weeks associated with these programs
    const { data: weeks, error: weeksError } = await supabase
      .from('workout_weeks')
      .select('id, week_number, program_id')
      .in('program_id', programIds)
      .order('week_number', { ascending: true });
    
    if (weeksError) {
      console.error("Error fetching workout weeks:", weeksError);
      throw weeksError;
    }
    
    if (!weeks || weeks.length === 0) {
      console.log("No workout weeks found for the assigned programs");
      return [];
    }
    
    console.log(`Found ${weeks.length} workout weeks across all assigned programs`);
    
    // Get all week IDs
    const weekIds = weeks.map(week => week.id);
    
    // Get all workouts in these weeks
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id, title, description, day_of_week, week_id')
      .in('week_id', weekIds);
    
    if (workoutsError) {
      console.error("Error fetching workouts:", workoutsError);
      throw workoutsError;
    }
    
    if (!workouts || workouts.length === 0) {
      console.log("No workouts found in the assigned program weeks");
      return [];
    }
    
    console.log(`Found ${workouts.length} workouts in the assigned program weeks`);
    
    // Create a map of weeks with their program info
    const weekMap = new Map();
    weeks.forEach(week => {
      const programId = week.program_id;
      weekMap.set(week.id, {
        week_number: week.week_number,
        program_id: programId
      });
    });
    
    // Get the program details for better display
    const { data: programs, error: programsError } = await supabase
      .from('workout_programs')
      .select('id, title')
      .in('id', programIds);
    
    if (programsError) {
      console.error("Error fetching program details:", programsError);
      throw programsError;
    }
    
    // Create a map of programs for quick lookup
    const programMap = new Map();
    if (programs) {
      programs.forEach(program => {
        programMap.set(program.id, program);
      });
    }
    
    // Check which workouts are already completed or in progress
    const { data: completions, error: completionsError } = await supabase
      .from('workout_completions')
      .select('id, workout_id, completed_at')
      .eq('user_id', userId)
      .in('workout_id', workouts.map(w => w.id));
    
    if (completionsError) {
      console.error("Error fetching workout completions:", completionsError);
      throw completionsError;
    }
    
    // Create a map of completed workouts
    const completedWorkoutIds = new Set();
    const inProgressWorkouts = new Map();
    
    if (completions) {
      completions.forEach(completion => {
        if (completion.completed_at) {
          completedWorkoutIds.add(completion.workout_id);
        } else {
          inProgressWorkouts.set(completion.workout_id, completion.id);
        }
      });
    }
    
    console.log(`${completedWorkoutIds.size} workouts are already completed`);
    console.log(`${inProgressWorkouts.size} workouts are in progress`);
    
    // Filter out completed workouts and prepare the result
    const result: WorkoutHistoryItem[] = [];
    
    // First, add in-progress workouts
    for (const workout of workouts) {
      if (inProgressWorkouts.has(workout.id)) {
        const completionId = inProgressWorkouts.get(workout.id);
        const weekInfo = weekMap.get(workout.week_id);
        const programInfo = weekInfo ? programMap.get(weekInfo.program_id) : null;
        
        result.push({
          id: completionId,
          workout_id: workout.id,
          user_id: userId,
          completed_at: null,
          workout: {
            ...workout,
            week: {
              week_number: weekInfo?.week_number,
              program: programInfo ? {
                title: programInfo.title
              } : null
            }
          }
        });
      }
    }
    
    // Then, add not-started workouts for which we need to create completion entries
    for (const workout of workouts) {
      // Skip if already completed or in progress
      if (completedWorkoutIds.has(workout.id) || inProgressWorkouts.has(workout.id)) {
        continue;
      }
      
      // Create a workout completion entry
      const { data: newCompletion, error: newCompletionError } = await supabase
        .from('workout_completions')
        .insert({
          workout_id: workout.id,
          user_id: userId,
          completed_at: null
        })
        .select('id')
        .single();
      
      if (newCompletionError) {
        console.error(`Error creating workout completion for workout ${workout.id}:`, newCompletionError);
        continue;
      }
      
      if (newCompletion) {
        const weekInfo = weekMap.get(workout.week_id);
        const programInfo = weekInfo ? programMap.get(weekInfo.program_id) : null;
        
        result.push({
          id: newCompletion.id,
          workout_id: workout.id,
          user_id: userId,
          completed_at: null,
          workout: {
            ...workout,
            week: {
              week_number: weekInfo?.week_number,
              program: programInfo ? {
                title: programInfo.title
              } : null
            }
          }
        });
      }
    }
    
    console.log(`Returning ${result.length} workouts to display`);
    return result;
  } catch (error) {
    console.error("Error in fetchAssignedWorkouts:", error);
    return [];
  }
};
