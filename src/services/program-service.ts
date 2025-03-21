
import { supabase } from "@/integrations/supabase/client";

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
    const { data: assignments, error: assignmentsError } = await supabase
      .from('program_assignments')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });
    
    if (assignmentsError) {
      console.error('Error fetching program assignments:', assignmentsError);
      throw assignmentsError;
    }
    
    console.log(`Found ${assignments?.length || 0} program assignments for user ${userId}`);
    
    if (!assignments || assignments.length === 0) {
      console.log(`No program assignments found for user ${userId}`);
      return null;
    }
    
    // Get current date in YYYY-MM-DD format for comparison
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    console.log("Today's date for comparison:", todayStr);
    
    // Find active program assignments (start date is in the past or today, and end date is in the future or null)
    const activeAssignments = assignments.filter(assignment => {
      const startDate = new Date(assignment.start_date);
      const startDateStr = startDate.toISOString().split('T')[0];
      const isStartValid = startDateStr <= todayStr;
      
      let isEndValid = true;
      if (assignment.end_date) {
        const endDate = new Date(assignment.end_date);
        const endDateStr = endDate.toISOString().split('T')[0];
        isEndValid = endDateStr >= todayStr;
      }
      
      console.log(`Assignment ${assignment.id}: start=${startDateStr} (valid=${isStartValid}), end=${assignment.end_date || 'ongoing'} (valid=${isEndValid})`);
      
      return isStartValid && isEndValid;
    });
    
    console.log(`Found ${activeAssignments.length} active assignments`);
    
    // If no active assignments, use the most recent assignment as a fallback
    const currentAssignment = activeAssignments.length > 0 
      ? activeAssignments[0] 
      : assignments[0];  // Most recent assignment (already sorted by start_date desc)
    
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
    
    // Fetch the complete program data with weeks and workouts
    const { data: programData, error: programError } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('id', programId)
      .single();
    
    if (programError) {
      console.error('Error fetching program details:', programError);
      throw programError;
    }
    
    if (!programData) {
      console.log("No program details found for program ID:", programId);
      return null;
    }
    
    console.log("Found program:", programData.title);
    
    // Get the program weeks
    const { data: weeksData, error: weeksError } = await supabase
      .from('workout_weeks')
      .select('*')
      .eq('program_id', programId)
      .order('week_number', { ascending: true });
    
    if (weeksError) {
      console.error('Error fetching program weeks:', weeksError);
      throw weeksError;
    }
    
    console.log(`Found ${weeksData?.length || 0} weeks for program`);
    
    // For each week, get the workouts with exercises
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
      
      console.log(`Week ${week.week_number}: Found ${workoutsData?.length || 0} workouts`);
      
      weeksWithWorkouts.push({
        ...week,
        workouts: workoutsData || []
      });
    }
    
    // Construct full program data
    const fullProgramData = {
      ...currentAssignment,
      program: {
        ...programData,
        weeks: weeksWithWorkouts
      }
    };
    
    console.log("Successfully built program data:", 
      fullProgramData.program.title, 
      "with", fullProgramData.program.weeks.length, "weeks"
    );
    
    return fullProgramData;
  } catch (err) {
    console.error("Error in fetchCurrentProgram:", err);
    throw err;
  }
};
