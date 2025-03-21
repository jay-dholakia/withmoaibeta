
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
  
  const today = new Date();
  const todayISODate = today.toISOString().split('T')[0];
  console.log("Today's date for comparison:", todayISODate);
  
  try {
    // First check if we have a current program ID stored somewhere
    let programId = null;
    
    // Query workout info to get current program ID if available
    const { data: workoutInfoData } = await supabase
      .rpc('get_client_workout_info', { user_id_param: userId })
      .maybeSingle();
      
    if (workoutInfoData?.current_program_id) {
      programId = workoutInfoData.current_program_id;
      console.log("Program ID from workout info:", programId);
    }
    
    // If no program ID found in workout info, check program assignments
    if (!programId) {
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
      programId = currentAssignment.program_id;
    }
    
    if (!programId) {
      console.log("No program ID found for user");
      return null;
    }
    
    // Get the program assignment details
    const { data: assignmentData, error: assignmentQueryError } = await supabase
      .from('program_assignments')
      .select('*')
      .eq('user_id', userId)
      .eq('program_id', programId)
      .order('start_date', { ascending: false })
      .limit(1)
      .single();
      
    if (assignmentQueryError && assignmentQueryError.code !== 'PGRST116') {
      console.error('Error fetching program assignment:', assignmentQueryError);
    }
    
    // Create a fallback assignment object with an id field to fix the TypeScript error
    const fallbackAssignment = {
      id: `${userId}_${programId}`,  // Generate a predictable ID for the fallback
      program_id: programId,
      user_id: userId,
      start_date: todayISODate,
      end_date: null as string | null,
      assigned_by: userId,
      created_at: new Date().toISOString()
    };
    
    const currentAssignment = assignmentData || fallbackAssignment;
    
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
    
    // Update client program info through RPC call instead of directly using the view
    try {
      await supabase.rpc('update_client_program', {
        user_id_param: userId,
        program_id_param: programId
      });
      console.log("Updated client program info through RPC");
    } catch (error) {
      console.error("Error updating client_workout_info:", error);
      // Continue execution even if this update fails
    }
    
    return fullProgramData;
  } catch (err) {
    console.error("Error in fetchCurrentProgram:", err);
    throw err;
  }
};
