
import { supabase } from '@/integrations/supabase/client';

/**
 * Client Data Types for Coach Views
 */
export interface ClientData {
  id: string;
  email: string;
  user_type: string;
  first_name: string | null;
  last_name: string | null;
  last_workout_at: string | null;
  total_workouts_completed: number;
  current_program_id: string | null;
  current_program_title: string | null;
  days_since_last_workout: number | null;
  group_ids: string[];
}

/**
 * Fetches all clients associated with the coach's groups
 */
export const fetchCoachClients = async (coachId: string): Promise<ClientData[]> => {
  if (!coachId) throw new Error('Coach ID is required');
  
  try {
    // First try using RPC function
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_coach_clients', {
      coach_id: coachId
    });
    
    if (rpcError) {
      console.error('Error with RPC client fetch:', rpcError);
      
      // Fallback to direct query if RPC fails
      console.log('Falling back to direct query for clients');
      return await fetchCoachClientsDirect(coachId);
    }
    
    // If we're here, RPC was successful, but we want to double-check the workout counts
    // Fetch the accurate workout counts from the workout_completions table
    if (rpcData && rpcData.length > 0) {
      const clientIds = rpcData.map(client => client.id);
      
      // Get accurate workout counts
      const workoutCounts = await fetchAccurateWorkoutCounts(clientIds);
      
      // Update the total_workouts_completed value with the accurate count
      // Cast each row to ClientData after ensuring first_name and last_name are present
      return rpcData.map((client: any) => ({
        ...client,
        // Ensure first_name and last_name are present even if null
        first_name: client.first_name || null,
        last_name: client.last_name || null,
        total_workouts_completed: workoutCounts.get(client.id) || 0
      })) as ClientData[];
    }
    
    return (rpcData || []) as ClientData[];
  } catch (error) {
    console.error('Error fetching coach clients:', error);
    return [];
  }
};

/**
 * Direct client fetch fallback when RPC fails
 * Fetches clients directly by querying related tables
 */
const fetchCoachClientsDirect = async (coachId: string): Promise<ClientData[]> => {
  try {
    // Get the group IDs this coach is assigned to
    const { data: groupCoaches } = await supabase
      .from('group_coaches')
      .select('group_id')
      .eq('coach_id', coachId);
    
    if (!groupCoaches || groupCoaches.length === 0) {
      console.log('No group assignments found for coach');
      return [];
    }
    
    const groupIds = groupCoaches.map(gc => gc.group_id);
    console.log('Coach is assigned to these groups:', groupIds);
    
    // Get client IDs from these groups
    const { data: groupMembers, error: membersError } = await supabase
      .from('group_members')
      .select('user_id, group_id')  // Include group_id in the selection
      .in('group_id', groupIds);
    
    if (membersError) {
      console.error('Error fetching group members:', membersError);
      return [];
    }
    
    if (!groupMembers || groupMembers.length === 0) {
      console.log('No clients found in coach groups');
      return [];
    }
    
    const clientIds = groupMembers.map(gm => gm.user_id);
    console.log('Found client IDs:', clientIds);
    
    // Now fetch the actual client profiles with these IDs
    const { data: clientProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        user_type
      `)
      .eq('user_type', 'client')
      .in('id', clientIds);
    
    if (profilesError) {
      console.error('Error fetching client profiles:', profilesError);
      return [];
    }
    
    if (!clientProfiles || clientProfiles.length === 0) {
      return [];
    }
    
    // Get accurate workout counts
    const workoutCounts = await fetchAccurateWorkoutCounts(clientIds);
    
    // Get client workout info for last workout dates
    const { data: workoutInfo, error: workoutInfoError } = await supabase
      .from('client_workout_info')
      .select('*')
      .in('user_id', clientIds);
      
    if (workoutInfoError) {
      console.error('Error fetching client workout info:', workoutInfoError);
    }
    
    // Get program info for clients with program assignments
    const programIds = workoutInfo?.filter(wi => wi.current_program_id).map(wi => wi.current_program_id) || [];
    
    let programs = [];
    if (programIds.length > 0) {
      const { data: programData, error: programError } = await supabase
        .from('workout_programs')
        .select('id, title')
        .in('id', programIds);
        
      if (programError) {
        console.error('Error fetching programs:', programError);
      } else {
        programs = programData || [];
      }
    }
    
    // Get emails for these clients
    const { data: emails } = await supabase.rpc('get_users_email', {
      user_ids: clientIds
    });
    
    // Get client profile info (first_name, last_name)
    const { data: clientProfilesData } = await supabase
      .from('client_profiles')
      .select('id, first_name, last_name')
      .in('id', clientIds);
    
    // Create various mappings for efficient lookups
    const emailMap = new Map(emails ? emails.map(e => [e.id, e.email]) : []);
    const clientProfilesMap = new Map(clientProfilesData ? clientProfilesData.map(cp => [cp.id, cp]) : []);
    
    const groupMap = new Map();
    for (const member of groupMembers) {
      if (!groupMap.has(member.user_id)) {
        groupMap.set(member.user_id, []);
      }
      groupMap.get(member.user_id).push(member.group_id);
    }
    
    const workoutInfoMap = new Map(workoutInfo ? workoutInfo.map(wi => [wi.user_id, wi]) : []);
    const programMap = new Map(programs ? programs.map(p => [p.id, p]) : []);
    
    // Transform the data to match expected format
    return clientProfiles.map(client => {
      // Get workout info from map
      const clientWorkoutInfo = workoutInfoMap.get(client.id);
      
      // Get profile info from map
      const clientProfileInfo = clientProfilesMap.get(client.id);
      
      // Get program info if available
      const program = clientWorkoutInfo?.current_program_id 
        ? programMap.get(clientWorkoutInfo.current_program_id)
        : null;
        
      // Calculate days since last workout
      let daysSinceLastWorkout = null;
      if (clientWorkoutInfo?.last_workout_at) {
        const lastWorkout = new Date(clientWorkoutInfo.last_workout_at);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - lastWorkout.getTime());
        daysSinceLastWorkout = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
        
      return {
        id: client.id,
        email: emailMap.get(client.id) || 'Unknown',
        user_type: client.user_type,
        first_name: clientProfileInfo?.first_name || null,
        last_name: clientProfileInfo?.last_name || null,
        last_workout_at: clientWorkoutInfo?.last_workout_at || null,
        // Use the accurate count from actually completed workouts
        total_workouts_completed: workoutCounts.get(client.id) || 0,
        current_program_id: clientWorkoutInfo?.current_program_id || null,
        current_program_title: program?.title || null,
        days_since_last_workout: daysSinceLastWorkout,
        group_ids: groupMap.get(client.id) || []
      };
    });
  } catch (error) {
    console.error('Error in direct client fetch:', error);
    return [];
  }
};

/**
 * Fetches accurate workout completion counts for clients
 * Ensures only legitimate completed workouts are counted (not rest days, life happens passes)
 */
const fetchAccurateWorkoutCounts = async (clientIds: string[]): Promise<Map<string, number>> => {
  // Create a map of id -> workout completion count
  const workoutCountMap = new Map<string, number>();
  
  if (!clientIds.length) {
    return workoutCountMap;
  }
  
  // Individual workout completion counts per user
  const workoutCountPromises = clientIds.map(async (clientId) => {
    // Get the completed workouts with comprehensive debugging
    console.log(`Fetching completed workouts for client ${clientId}`);
    
    const { data: completions, error: countError } = await supabase
      .from('workout_completions')
      .select('*')  // Select all to inspect the data
      .eq('user_id', clientId);
      
    if (countError) {
      console.error(`Error fetching workouts for client ${clientId}:`, countError);
      return { userId: clientId, count: 0 };
    }
    
    // Log ALL workout completions for debugging
    console.log(`All workout completions for ${clientId}:`, completions);
    
    // Filter in JavaScript to make sure we're only counting legitimately completed workouts
    const actualCompletedWorkouts = completions?.filter(workout => 
      workout.completed_at !== null &&
      workout.life_happens_pass !== true &&
      workout.rest_day !== true
    ) || [];
    
    console.log(`Actual completed workouts for ${clientId}:`, actualCompletedWorkouts.length);
    
    return { 
      userId: clientId, 
      count: actualCompletedWorkouts.length 
    };
  });
  
  // Wait for all promises to resolve
  const workoutCountResults = await Promise.all(workoutCountPromises);
  
  // Populate the map with results
  workoutCountResults.forEach(result => {
    workoutCountMap.set(result.userId, result.count);
  });
  
  return workoutCountMap;
};
