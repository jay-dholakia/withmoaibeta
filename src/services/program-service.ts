
import { supabase } from "@/integrations/supabase/client";
import { ProgramAssignment, WorkoutExercise, WorkoutProgram, WorkoutWeek } from "@/types/workout";

/**
 * Fetches all programs assigned to a client
 */
export const fetchClientPrograms = async (clientId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .select(`
        id,
        start_date,
        end_date,
        user_id,
        program_id,
        program:program_id (
          id,
          title,
          description,
          weeks
        )
      `)
      .eq('user_id', clientId)
      .order('start_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching client programs:", error);
    return [];
  }
};

/**
 * Determines if a program assignment is currently active
 */
const isActiveAssignment = (assignment: ProgramAssignment): boolean => {
  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Check if start date is in the past or today
  const startDate = new Date(assignment.start_date);
  const startDateStr = startDate.toISOString().split('T')[0];
  const isStartValid = startDateStr <= todayStr;
  
  // Check if end date is in the future or not set
  let isEndValid = true;
  if (assignment.end_date) {
    const endDate = new Date(assignment.end_date);
    const endDateStr = endDate.toISOString().split('T')[0];
    isEndValid = endDateStr >= todayStr;
  }
  
  return isStartValid && isEndValid;
};

/**
 * Fetches program details including weeks and workouts
 */
const fetchFullProgramDetails = async (programId: string): Promise<WorkoutProgram | null> => {
  try {
    // Fetch basic program data
    const { data: programData, error: programError } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('id', programId)
      .single();
    
    if (programError || !programData) {
      console.error('Error fetching program details:', programError);
      return null;
    }
    
    // Fetch program weeks
    const { data: weeksData, error: weeksError } = await supabase
      .from('workout_weeks')
      .select('*')
      .eq('program_id', programId)
      .order('week_number', { ascending: true });
    
    if (weeksError) {
      console.error('Error fetching program weeks:', weeksError);
      return null;
    }
    
    // For each week, fetch the workouts with exercises
    const weeksWithWorkouts = [];
    
    for (const week of weeksData || []) {
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises (
            *,
            exercise:exercise_id (*)
          )
        `)
        .eq('week_id', week.id)
        .order('day_of_week', { ascending: true });
      
      if (workoutsError) {
        console.error(`Error fetching workouts for week ${week.week_number}:`, workoutsError);
        continue;
      }
      
      weeksWithWorkouts.push({
        ...week,
        workouts: workoutsData || []
      });
    }
    
    return {
      ...programData,
      weeks: weeksWithWorkouts
    };
  } catch (error) {
    console.error("Error fetching full program details:", error);
    return null;
  }
};

/**
 * Fetches all program assignments for a user
 */
const fetchUserProgramAssignments = async (userId: string): Promise<ProgramAssignment[] | null> => {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching program assignments:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in fetchUserProgramAssignments:", error);
    return null;
  }
};

/**
 * Fetches the current active program for a user
 */
export const fetchCurrentProgram = async (userId: string): Promise<any | null> => {
  console.log("Fetching current program for user:", userId);
  
  if (!userId) {
    console.error("Cannot fetch current program: No user ID provided");
    return null;
  }
  
  try {
    // Get user email for better logging
    const { data: authData } = await supabase.auth.getUser();
    const userEmail = authData?.user?.email;
    console.log(`Looking up program for user ${userId}${userEmail ? ` (${userEmail})` : ''}`);
    
    // Get all program assignments for this user
    const assignments = await fetchUserProgramAssignments(userId);
    
    if (!assignments || assignments.length === 0) {
      console.log(`No program assignments found for user ${userId}`);
      return null;
    }
    
    console.log(`Found ${assignments.length} program assignments for user ${userId}`);
    
    // Find active assignments
    const activeAssignments = assignments.filter(isActiveAssignment);
    console.log(`Found ${activeAssignments.length} active assignments`);
    
    // Use the most recent active assignment, or fall back to the most recent assignment
    const currentAssignment = activeAssignments.length > 0 
      ? activeAssignments[0] 
      : assignments[0];
    
    if (activeAssignments.length === 0 && assignments.length > 0) {
      console.log("No active assignments found. Using most recent assignment as fallback:", currentAssignment.id);
    } else {
      console.log("Using active assignment:", currentAssignment.id);
    }
    
    const programId = currentAssignment.program_id;
    
    if (!programId) {
      console.log("No program ID found in assignment");
      return null;
    }
    
    // Fetch the complete program data
    const programData = await fetchFullProgramDetails(programId);
    
    if (!programData) {
      console.log("No program details found for program ID:", programId);
      return null;
    }
    
    // Construct full program data
    const fullProgramData = {
      ...currentAssignment,
      program: programData
    };
    
    console.log("Successfully built program data:", 
      fullProgramData.program.title, 
      "with", fullProgramData.program.weeks.length, "weeks"
    );
    
    return fullProgramData;
  } catch (err) {
    console.error("Error in fetchCurrentProgram:", err);
    return null;
  }
};
