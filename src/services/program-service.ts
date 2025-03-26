
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
    console.log("Fetching program details for ID:", programId);
    
    // Check if we can directly access the program (test for RLS issues)
    const { data: accessTest, error: accessError } = await supabase
      .from('workout_programs')
      .select('id, title')
      .eq('id', programId);
    
    if (accessError) {
      console.error('Access error checking program - RLS issue detected:', accessError);
      return null;
    }
    
    if (!accessTest || accessTest.length === 0) {
      console.error('No program access via RLS policies for ID:', programId);
      
      // Try using program_assignments as a bridge
      const { data: checkAssignment } = await supabase
        .from('program_assignments')
        .select('program_id')
        .eq('program_id', programId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
        .maybeSingle();
      
      if (checkAssignment) {
        console.log('Program assignment exists but direct program access failed - RLS policy issue');
        
        // Log additional RLS debugging info
        console.log('Assignment details:', checkAssignment);
        console.log('Current user ID:', (await supabase.auth.getUser()).data.user?.id);
        
        // Try again with a more specific query to test policies
        const { data: specificQuery, error: specificError } = await supabase.rpc(
          'is_program_assigned_to_user',
          { 
            program_id_param: programId,
            user_id_param: (await supabase.auth.getUser()).data.user?.id 
          }
        );
        
        if (specificError) {
          console.error('RPC check error:', specificError);
        } else {
          console.log('Program is assigned to user:', specificQuery);
        }
      } else {
        console.log('No program assignment found - no RLS access expected');
      }
      
      return null;
    }
    
    const { data: programData, error: programError } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('id', programId)
      .maybeSingle();
    
    if (programError) {
      console.error('Error fetching program details:', programError);
      return null;
    }
    
    if (!programData) {
      console.error('No program found with ID:', programId);
      return null;
    }

    console.log("Successfully fetched program data:", programData.title);
    
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

    console.log(`Fetched ${weeksData?.length || 0} weeks for program ${programData.title}`);
    
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

      console.log(`Week ${week.week_number}: fetched ${workoutsData?.length || 0} workouts`);
      
      weeksWithWorkouts.push({
        ...week,
        workouts: workoutsData || []
      });
    }
    
    // Return program with week data in the new format
    return {
      ...programData,
      weekData: weeksWithWorkouts
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
    console.log("Raw program assignments query result:");
    const { data, error } = await supabase
      .from('program_assignments')
      .select('id, program_id, start_date, end_date, user_id, assigned_by, created_at')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching program assignments:', error);
      return null;
    }
    
    console.log(data);
    console.log(`Found ${data?.length || 0} program assignments`);
    
    if (data && data.length > 0) {
      console.log("Program IDs:", data.map(d => d.program_id));
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
      "with", fullProgramData.program.weekData?.length || 0, "weeks"
    );
    
    return fullProgramData;
  } catch (err) {
    console.error("Error in fetchCurrentProgram:", err);
    return null;
  }
};

/**
 * Deletes a program assignment and updates the client's current program if needed
 */
export const deleteProgramAssignment = async (assignmentId: string): Promise<boolean> => {
  try {
    // First, get the assignment details to check if we need to update the client's program
    const { data: assignment, error: fetchError } = await supabase
      .from('program_assignments')
      .select('*')
      .eq('id', assignmentId)
      .maybeSingle(); // Changed from .single() to .maybeSingle()
    
    if (fetchError) {
      console.error('Error fetching assignment details:', fetchError);
      throw fetchError;
    }
    
    // Delete the assignment
    const { error: deleteError } = await supabase
      .from('program_assignments')
      .delete()
      .eq('id', assignmentId);
    
    if (deleteError) {
      console.error('Error deleting program assignment:', deleteError);
      throw deleteError;
    }
    
    // Check if this is the client's current active program and remove it if so
    if (assignment) {
      const { data: clientInfo, error: clientInfoError } = await supabase
        .from('client_workout_info')
        .select('current_program_id')
        .eq('user_id', assignment.user_id)
        .maybeSingle(); // Changed from .single() to .maybeSingle()
      
      if (!clientInfoError && clientInfo && clientInfo.current_program_id === assignment.program_id) {
        // This was the client's current program, so we need to update
        console.log('Removing current program reference for client:', assignment.user_id);
        try {
          // Use the RPC function to update the client's program
          await supabase.rpc('update_client_program', {
            user_id_param: assignment.user_id,
            program_id_param: null
          });
        } catch (rpcError) {
          console.error('Error updating client program reference:', rpcError);
          // This is not critical enough to fail the whole operation
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to delete program assignment:', error);
    return false;
  }
};
