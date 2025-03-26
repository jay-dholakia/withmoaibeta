
import { supabase } from "@/integrations/supabase/client";
import { WorkoutHistoryItem } from "@/types/workout";

/**
 * Fetches workouts that have been assigned to a client but not yet completed
 */
export const fetchAssignedWorkouts = async (userId: string): Promise<WorkoutHistoryItem[]> => {
  try {
    if (!userId) {
      console.error("Cannot fetch assigned workouts: userId is null or undefined");
      return [];
    }
    
    console.log(`Fetching assigned workouts for user: ${userId}`);
    
    // Instead of using RPC, we'll query the program_assignments table directly
    // The RLS policies have been fixed to prevent infinite recursion
    const { data: programAssignments, error: programError } = await supabase
      .from('program_assignments')
      .select('id, program_id, start_date, end_date, user_id, assigned_by, created_at')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });
    
    if (programError) {
      console.error("Error fetching program assignments:", programError);
      throw programError;
    }
    
    console.log(`Raw program assignments query result:`, programAssignments);
    
    if (!programAssignments || programAssignments.length === 0) {
      console.log(`No program assignments found for user ${userId}`);
      return [];
    }
    
    console.log(`Found ${programAssignments.length} program assignments`);
    
    // Get all program IDs
    const programIds = [...new Set(programAssignments.map(pa => pa.program_id))];
    console.log(`Program IDs:`, programIds);
    
    return await fetchWorkoutsFromPrograms(userId, programIds, programAssignments);
  } catch (error) {
    console.error("Error in fetchAssignedWorkouts:", error);
    return [];
  }
};

/**
 * Fetches workouts from the assigned programs
 */
const fetchWorkoutsFromPrograms = async (
  userId: string, 
  programIds: string[], 
  programAssignments: any[]
): Promise<WorkoutHistoryItem[]> => {
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
    return await createPlaceholdersForProgramsWithoutWeeks(userId, programAssignments);
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
  
  return await processWorkoutsForAssignment(userId, weeks, workouts, programIds);
};

/**
 * Creates placeholder entries for programs that don't have any weeks defined yet
 */
const createPlaceholdersForProgramsWithoutWeeks = async (
  userId: string, 
  programAssignments: any[]
): Promise<WorkoutHistoryItem[]> => {
  const result: WorkoutHistoryItem[] = [];
  
  for (const assignment of programAssignments) {
    // Get the program details
    const { data: program } = await supabase
      .from('workout_programs')
      .select('title')
      .eq('id', assignment.program_id)
      .single();
    
    if (program) {
      try {
        // Create a placeholder workout completion entry
        const { data: newCompletion, error: completionError } = await supabase
          .from('workout_completions')
          .insert({
            workout_id: assignment.program_id, // Using program_id as a placeholder
            user_id: userId,
            completed_at: null, // Now this works because the column allows NULL
            notes: `Program: ${program.title}`
          })
          .select('id')
          .single();
        
        if (completionError) {
          console.error(`Error creating workout completion for program ${assignment.program_id}:`, completionError);
          continue;
        }
        
        if (newCompletion) {
          result.push({
            id: newCompletion.id,
            workout_id: assignment.program_id,
            user_id: userId,
            completed_at: null,
            workout: {
              id: assignment.program_id,
              title: `Program: ${program.title}`,
              description: "No workouts have been created for this program yet.",
              day_of_week: 0,
              week_id: "",
              week: null
            }
          });
        }
      } catch (e) {
        console.error(`Error processing program ${assignment.program_id}:`, e);
      }
    }
  }
  
  console.log(`Returning ${result.length} placeholder workouts`);
  return result;
};

/**
 * Processes workouts for assignment to a user
 */
const processWorkoutsForAssignment = async (
  userId: string,
  weeks: any[],
  workouts: any[],
  programIds: string[]
): Promise<WorkoutHistoryItem[]> => {
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
  
  console.log("Debug - Fetched programs for workouts:", programs);
  
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
      const program = weekInfo ? programMap.get(weekInfo.program_id) : null;
      
      result.push({
        id: completionId,
        workout_id: workout.id,
        user_id: userId,
        completed_at: null,
        workout: {
          ...workout,
          week: {
            week_number: weekInfo?.week_number,
            program: program ? {
              id: program.id,
              title: program.title
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
      const program = weekInfo ? programMap.get(weekInfo.program_id) : null;
      
      result.push({
        id: newCompletion.id,
        workout_id: workout.id,
        user_id: userId,
        completed_at: null,
        workout: {
          ...workout,
          week: {
            week_number: weekInfo?.week_number,
            program: program ? {
              id: program.id,
              title: program.title
            } : null
          }
        }
      });
    }
  }
  
  console.log(`Returning ${result.length} workouts to display`);
  return result;
};
