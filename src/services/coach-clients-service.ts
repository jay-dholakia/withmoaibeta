
import { supabase } from '@/integrations/supabase/client';

/**
 * Client Data Types for Coach Views
 */
export interface ClientData {
  id: string;
  email: string | null;
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
 * If coach is an admin (is_admin: true), fetches all clients
 */
export const fetchCoachClients = async (coachId: string): Promise<ClientData[]> => {
  if (!coachId) throw new Error('Coach ID is required');
  
  try {
    // Check if coach is an admin
    const { data: isAdmin, error: adminCheckError } = await supabase
      .rpc('is_admin', { check_user_id: coachId });
    
    if (adminCheckError) {
      console.error('Error checking admin status:', adminCheckError);
    }
    
    console.log(`Coach ${coachId} admin status:`, isAdmin);
    
    // If coach is admin, get all clients
    if (isAdmin === true) {
      console.log('Coach is admin, fetching all clients');
      return await fetchAllClientsForAdmin();
    }
    
    // Get the group IDs this coach is assigned to
    const { data: groupCoaches, error: groupError } = await supabase
      .from('group_coaches')
      .select('group_id')
      .eq('coach_id', coachId);
    
    if (groupError) {
      console.error('Error fetching coach groups:', groupError);
      return [];
    }
    
    if (!groupCoaches || groupCoaches.length === 0) {
      console.log('No group assignments found for coach');
      return [];
    }
    
    const groupIds = groupCoaches.map(gc => gc.group_id);
    console.log('Coach is assigned to these groups:', groupIds);
    
    // Get client IDs from these groups
    const { data: groupMembers, error: membersError } = await supabase
      .from('group_members')
      .select('user_id, group_id')
      .in('group_id', groupIds);
    
    if (membersError) {
      console.error('Error fetching group members:', membersError);
      return [];
    }
    
    if (!groupMembers || groupMembers.length === 0) {
      console.log('No clients found in coach groups');
      return [];
    }
    
    const clientIds = [...new Set(groupMembers.map(gm => gm.user_id))];
    console.log('Found client IDs:', clientIds);
    
    // Create a map of user_id to their group_ids
    const userGroups: Record<string, string[]> = {};
    groupMembers.forEach(m => {
      if (!userGroups[m.user_id]) {
        userGroups[m.user_id] = [];
      }
      userGroups[m.user_id].push(m.group_id);
    });
    
    // Get client profiles for names
    const { data: clientProfiles, error: profilesError } = await supabase
      .from('client_profiles')
      .select('id, first_name, last_name')
      .in('id', clientIds);
    
    if (profilesError) {
      console.error('Error fetching client profiles:', profilesError);
    }
    
    // Create a map for easy profile lookup
    const profilesMap: Record<string, any> = {};
    if (clientProfiles) {
      clientProfiles.forEach(profile => {
        profilesMap[profile.id] = profile;
      });
    }
    console.log('Client profiles map:', profilesMap);
    
    // Get client workout info
    const { data: clientData, error: clientError } = await supabase
      .from('client_workout_info')
      .select('*')
      .in('user_id', clientIds);
    
    if (clientError) {
      console.error('Error fetching client workout info:', clientError);
      return [];
    }
    
    // Get program titles for referenced programs
    const programIds = clientData
      ?.map(client => client.current_program_id)
      .filter(id => id !== null) as string[] || [];
      
    const { data: programs, error: programsError } = await supabase
      .from('workout_programs')
      .select('id, title')
      .in('id', programIds);
    
    if (programsError) {
      console.error('Error fetching program titles:', programsError);
    }
    
    // Create a map for program titles
    const programMap: Record<string, string> = {};
    if (programs) {
      programs.forEach(program => {
        programMap[program.id] = program.title;
      });
    }
    console.log('Program map:', programMap);
    
    // Get emails for these clients
    const { data: emails, error: emailError } = await supabase.rpc('get_users_email', {
      user_ids: clientIds
    });
    
    if (emailError) {
      console.error('Error fetching emails:', emailError);
    }
    
    const emailMap: Record<string, string> = {};
    if (emails) {
      emails.forEach((e: { id: string; email: string }) => {
        emailMap[e.id] = e.email;
      });
    }
    console.log('Email map:', emailMap);
    
    // Transform the data to match the ClientData interface
    const result: ClientData[] = clientData?.map(client => {
      // Calculate days since last workout
      let daysSinceLastWorkout = null;
      if (client.last_workout_at) {
        const lastWorkoutDate = new Date(client.last_workout_at);
        const currentDate = new Date();
        const diffTime = Math.abs(currentDate.getTime() - lastWorkoutDate.getTime());
        daysSinceLastWorkout = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      
      const profile = profilesMap[client.user_id] || {};
      const userEmail = emailMap[client.user_id] || null;
      const programTitle = client.current_program_id ? programMap[client.current_program_id] || null : null;
      
      console.log(`Client ${client.user_id} profile:`, profile);
      console.log(`Client ${client.user_id} email:`, userEmail);
      console.log(`Client ${client.user_id} program:`, programTitle);
      
      return {
        id: client.user_id,
        email: userEmail,
        user_type: client.user_type || 'client',
        first_name: profile.first_name || null,
        last_name: profile.last_name || null,
        last_workout_at: client.last_workout_at,
        total_workouts_completed: client.total_workouts_completed || 0,
        current_program_id: client.current_program_id,
        current_program_title: programTitle,
        days_since_last_workout: daysSinceLastWorkout,
        group_ids: userGroups[client.user_id] || []
      };
    }) || [];
    
    // Sort by total workouts
    return result.sort((a, b) => 
      (b.total_workouts_completed || 0) - (a.total_workouts_completed || 0)
    );
  } catch (error) {
    console.error('Error fetching coach clients:', error);
    return [];
  }
};

/**
 * Special function to fetch ALL clients for admin coaches
 */
const fetchAllClientsForAdmin = async (): Promise<ClientData[]> => {
  try {
    console.log("Fetching all clients for admin");
    
    // Get all client profiles
    const { data: clientProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_type')
      .eq('user_type', 'client');
    
    if (profilesError) {
      console.error('Error fetching client profiles:', profilesError);
      return [];
    }
    
    if (!clientProfiles || clientProfiles.length === 0) {
      console.log('No clients found');
      return [];
    }
    
    console.log(`Found ${clientProfiles.length} clients`);
    const clientIds = clientProfiles.map(client => client.id);
    
    // Get client profile info (first_name, last_name)
    const { data: clientProfilesData, error: clientProfilesError } = await supabase
      .from('client_profiles')
      .select('id, first_name, last_name');
    
    if (clientProfilesError) {
      console.error('Error fetching client profile data:', clientProfilesError);
    }
    
    const clientProfilesMap = new Map();
    if (clientProfilesData) {
      clientProfilesData.forEach(cp => {
        clientProfilesMap.set(cp.id, cp);
      });
    }
    console.log(`Fetched ${clientProfilesData?.length || 0} client profiles`);
    
    // Get emails for these clients
    const { data: emails, error: emailError } = await supabase.rpc('get_users_email', {
      user_ids: clientIds
    });
    
    if (emailError) {
      console.error('Error fetching emails:', emailError);
    }
    
    const emailMap = new Map();
    if (emails) {
      emails.forEach((e: { id: string; email: string }) => {
        emailMap.set(e.id, e.email);
      });
    }
    console.log(`Fetched ${emails?.length || 0} emails`);
    
    // Get client workout info
    const { data: workoutInfo, error: workoutInfoError } = await supabase
      .from('client_workout_info')
      .select('*');
      
    if (workoutInfoError) {
      console.error('Error fetching client workout info:', workoutInfoError);
    }
    
    const workoutInfoMap = new Map();
    if (workoutInfo) {
      workoutInfo.forEach(wi => {
        workoutInfoMap.set(wi.user_id, wi);
      });
    }
    console.log(`Fetched ${workoutInfo?.length || 0} workout infos`);
    
    // Get program info
    const programIds = Array.from(workoutInfoMap.values())
      .filter((wi: any) => wi.current_program_id)
      .map((wi: any) => wi.current_program_id);
    
    let programMap = new Map();
    if (programIds.length > 0) {
      const { data: programs, error: programsError } = await supabase
        .from('workout_programs')
        .select('id, title');
      
      if (programsError) {
        console.error('Error fetching program titles:', programsError);
      } else if (programs) {
        programs.forEach(p => {
          programMap.set(p.id, p);
        });
        console.log(`Fetched ${programs.length} programs`);
      }
    }
    
    // Get client group associations for admin view
    const { data: groupMembers, error: groupMembersError } = await supabase
      .from('group_members')
      .select('user_id, group_id');
    
    if (groupMembersError) {
      console.error('Error fetching group members:', groupMembersError);
    }
    
    const groupMap = new Map();
    if (groupMembers) {
      for (const member of groupMembers) {
        if (!groupMap.has(member.user_id)) {
          groupMap.set(member.user_id, []);
        }
        groupMap.get(member.user_id).push(member.group_id);
      }
      console.log(`Fetched ${groupMembers.length} group memberships`);
    }
    
    // Transform the data to match expected format
    const results = clientProfiles.map(client => {
      const clientWorkoutInfo = workoutInfoMap.get(client.id);
      const clientProfileInfo = clientProfilesMap.get(client.id);
      
      // Get program info if available
      const programId = clientWorkoutInfo?.current_program_id;
      const program = programId ? programMap.get(programId) : null;
      
      // Calculate days since last workout
      let daysSinceLastWorkout = null;
      if (clientWorkoutInfo?.last_workout_at) {
        const lastWorkout = new Date(clientWorkoutInfo.last_workout_at);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - lastWorkout.getTime());
        daysSinceLastWorkout = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      
      const result = {
        id: client.id,
        email: emailMap.get(client.id) || 'Unknown',
        user_type: client.user_type,
        first_name: clientProfileInfo?.first_name || null,
        last_name: clientProfileInfo?.last_name || null,
        last_workout_at: clientWorkoutInfo?.last_workout_at || null,
        total_workouts_completed: clientWorkoutInfo?.total_workouts_completed || 0,
        current_program_id: clientWorkoutInfo?.current_program_id || null,
        current_program_title: program?.title || null,
        days_since_last_workout: daysSinceLastWorkout,
        group_ids: groupMap.get(client.id) || []
      };
      
      return result;
    });
    
    console.log(`Returning ${results.length} clients for admin`);
    return results;
  } catch (error) {
    console.error('Error in admin client fetch:', error);
    return [];
  }
};
