
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
  
  // Format today's date in ISO format (YYYY-MM-DD)
  const today = new Date();
  const todayISODate = today.toISOString().split('T')[0];
  console.log("Today's date for comparison:", todayISODate);
  
  try {
    // Get program assignments for this user
    const { data: assignments, error: assignmentsError } = await supabase
      .from('program_assignments')
      .select('*')
      .eq('user_id', userId);
    
    console.log("All program assignments for user:", assignments);
    
    if (assignmentsError) {
      console.error('Error fetching program assignments:', assignmentsError);
      throw assignmentsError;
    }
    
    if (!assignments || assignments.length === 0) {
      console.log("No program assignments found for user:", userId);
      return null;
    }
    
    // Filter active assignments in JavaScript for better control and debugging
    let activeAssignments = assignments.filter(assignment => {
      // Make sure start_date is a string in YYYY-MM-DD format
      let startDate = assignment.start_date;
      if (typeof startDate !== 'string') {
        startDate = new Date(startDate).toISOString().split('T')[0];
      }
      
      // Check if start_date is today or in the past
      const isStartValid = startDate <= todayISODate;
      
      // For end_date, if it's null, treat as valid (program doesn't expire)
      // If it has a value, make sure it's in future or today
      let isEndValid = true;
      if (assignment.end_date) {
        let endDate = assignment.end_date;
        if (typeof endDate !== 'string') {
          endDate = new Date(endDate).toISOString().split('T')[0];
        }
        isEndValid = endDate >= todayISODate;
      }
      
      console.log(`Assignment ${assignment.id}: start=${startDate} (valid=${isStartValid}), end=${assignment.end_date} (valid=${isEndValid})`);
      
      return isStartValid && isEndValid;
    });
    
    console.log("Active program assignments after filtering:", activeAssignments.length, activeAssignments);
    
    if (activeAssignments.length === 0) {
      console.log("No active program assignments found for user after filtering");
      
      // If no active assignments but we have assignments, debug the issue
      if (assignments.length > 0) {
        console.log("Program was assigned but not active. Checking first assignment:");
        const firstAssignment = assignments[0];
        console.log("First assignment:", firstAssignment);
        
        // Use the most recent assignment regardless of dates as a fallback
        console.log("IMPORTANT: Using most recent assignment as fallback since no active assignments found");
        activeAssignments = [assignments[0]];
      } else {
        return null;
      }
    }
    
    // Sort by start date (newest first) and take the most recent one
    activeAssignments.sort((a, b) => {
      const dateA = new Date(a.start_date).getTime();
      const dateB = new Date(b.start_date).getTime();
      return dateB - dateA;
    });
    
    const currentAssignment = activeAssignments[0];
    console.log("Using program assignment:", currentAssignment);
    
    const programId = currentAssignment.program_id;
    
    if (!programId) {
      console.log("No program ID found in assignment");
      return null;
    }
    
    // Get the program details
    const { data: programData, error: programError } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('id', programId)
      .single();
    
    if (programError) {
      console.error('Error fetching program details:', programError);
      throw programError;
    }
    
    console.log("Program data fetched:", programData);
    
    if (!programData) {
      console.log("No program details found for program ID:", programId);
      return null;
    }
    
    // Get the program weeks
    const { data: weeksData, error: weeksError } = await supabase
      .from('workout_weeks')
      .select('*')
      .eq('program_id', programData.id)
      .order('week_number', { ascending: true });
    
    if (weeksError) {
      console.error('Error fetching program weeks:', weeksError);
      throw weeksError;
    }
    
    console.log("Program weeks fetched:", weeksData?.length || 0, weeksData);
    
    const weeksWithWorkouts = [];
    
    // For each week, get the workouts
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
      
      console.log(`Week ${week.week_number} workouts:`, workoutsData?.length || 0, workoutsData);
      
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
    
    console.log("Full program data constructed:", 
      fullProgramData.program.title, 
      "with", fullProgramData.program.weeks.length, "weeks"
    );
    
    return fullProgramData;
  } catch (err) {
    console.error("Error in fetchCurrentProgram:", err);
    throw err;
  }
};
