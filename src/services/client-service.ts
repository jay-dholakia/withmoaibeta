
export const fetchCurrentProgram = async (userId: string): Promise<any | null> => {
  console.log("Fetching current program for user:", userId);
  
  if (!userId) {
    console.error("Cannot fetch current program: No user ID provided");
    return null;
  }
  
  const today = new Date();
  const todayISODate = today.toISOString().split('T')[0];
  console.log("Today's date for comparison:", todayISODate);
  
  try {
    const { data: assignments, error: assignmentError } = await supabase
      .from('program_assignments')
      .select('*')
      .eq('user_id', userId)
      .lte('start_date', todayISODate)
      .or(`end_date.is.null,end_date.gte.${todayISODate}`)
      .order('start_date', { ascending: false });
      
    if (assignmentError) {
      console.error('Error fetching program assignments:', assignmentError);
      throw assignmentError;
    }
    
    console.log("Program assignments found:", assignments?.length || 0, assignments);
    
    if (!assignments || assignments.length === 0) {
      console.log("No active program assignments found for user", userId);
      return null;
    }
    
    const currentAssignment = assignments[0];
    console.log("Using program assignment:", currentAssignment);
    
    const { data: programData, error: programError } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('id', currentAssignment.program_id)
      .single();
      
    if (programError) {
      console.error('Error fetching program details:', programError);
      throw programError;
    }
    
    console.log("Program data fetched:", programData);
    
    if (!programData) {
      console.log("No program details found for assignment", currentAssignment.id);
      return null;
    }
    
    const { data: weeksData, error: weeksError } = await supabase
      .from('workout_weeks')
      .select('*')
      .eq('program_id', programData.id)
      .order('week_number', { ascending: true });
      
    if (weeksError) {
      console.error('Error fetching program weeks:', weeksError);
      throw weeksError;
    }
    
    console.log("Program weeks fetched:", weeksData?.length || 0);
    
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
      
      console.log(`Week ${week.week_number} workouts:`, workoutsData?.length || 0);
      
      weeksWithWorkouts.push({
        ...week,
        workouts: workoutsData || []
      });
    }
    
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
    
    // Since client_workout_info is a view and not directly updatable, we shouldn't try to insert/update it directly
    // Instead, we can query it to check if we need to update any other tables that affect it
    try {
      const { data: clientInfo, error: clientInfoError } = await supabase
        .from('client_workout_info')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (clientInfoError) {
        console.error('Error checking client workout info:', clientInfoError);
      } else {
        console.log("Current client workout info:", clientInfo);
        // We would update the underlying tables here if needed
        // But for now, we won't try to update any tables directly
      }
    } catch (err) {
      console.error('Error querying client workout info:', err);
    }
    
    return fullProgramData;
  } catch (err) {
    console.error("Error in fetchCurrentProgram:", err);
    throw err;
  }
};
