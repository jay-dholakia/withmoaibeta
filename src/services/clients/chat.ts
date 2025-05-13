
import { supabase } from "@/integrations/supabase/client";
import { ClientData } from "@/services/coach-clients-service";

/**
 * Fetch all clients available for a coach to message
 */
export const fetchClientsForChat = async (coachId: string): Promise<ClientData[]> => {
  if (!coachId) return [];

  try {
    // First check if coach is an admin, as admins can message all clients
    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', coachId)
      .single();
    
    const isAdmin = profileData?.is_admin || false;
    
    if (isAdmin) {
      console.log('Coach is admin (from database), fetching all clients');
      return fetchAllClientsForAdmin();
    }
    
    // For regular coaches, get clients from their assigned groups
    // First get all groups the coach is assigned to
    const { data: coachGroups, error: groupError } = await supabase
      .from('group_coaches')
      .select('group_id')
      .eq('coach_id', coachId);

    if (groupError) {
      console.error('Error fetching coach groups:', groupError);
      return [];
    }

    if (!coachGroups || coachGroups.length === 0) {
      return [];
    }

    // Extract group IDs
    const groupIds = coachGroups.map(group => group.group_id);

    // Get client IDs from these groups and make sure they exist in auth.users
    // Using the "any" type to bypass TypeScript's strict checking on RPC functions
    const { data, error: validClientsError } = await supabase
      .rpc('get_valid_client_ids_for_chat', { group_ids: groupIds }) as any;

    if (validClientsError) {
      console.error('Error fetching valid client IDs:', validClientsError);
      return [];
    }

    // Force cast to string array with proper type assertion and safety checks
    let validClientIds: string[] = [];
    if (data && Array.isArray(data)) {
      validClientIds = data as string[];
    }
    
    if (validClientIds.length === 0) {
      return [];
    }

    // Now get client profile data
    const { data: clientProfiles, error: profilesError } = await supabase
      .from('client_profiles')
      .select('id, first_name, last_name, avatar_url')
      .in('id', validClientIds);

    if (profilesError) {
      console.error('Error fetching client profiles:', profilesError);
      return [];
    }

    // Create a map for quick lookup
    const profileMap: Record<string, any> = {};
    if (clientProfiles) {
      clientProfiles.forEach(profile => {
        profileMap[profile.id] = profile;
      });
    }

    // Get emails for these clients
    const { data: emailsData, error: emailsError } = await supabase
      .rpc('get_users_email', { user_ids: validClientIds }) as any;
    
    if (emailsError) {
      console.error('Error fetching emails:', emailsError);
    }

    // Create email map with proper type assertion
    const emailMap: Record<string, string> = {};
    if (emailsData && Array.isArray(emailsData)) {
      emailsData.forEach((item: { id: string, email: string }) => {
        emailMap[item.id] = item.email;
      });
    }

    // Transform to ClientData format
    const clientsData: ClientData[] = validClientIds.map(clientId => {
      const profile = profileMap[clientId] || {};
      return {
        id: clientId,
        user_type: 'client',
        first_name: profile.first_name || null,
        last_name: profile.last_name || null,
        avatar_url: profile.avatar_url || null,
        email: emailMap[clientId] || null,
        last_workout_at: null,
        total_workouts_completed: 0,
        current_program_id: null,
        current_program_title: null,
        days_since_last_workout: null,
        group_ids: []
      };
    });

    return clientsData;
  } catch (error) {
    console.error('Error fetching clients for chat:', error);
    return [];
  }
};

/**
 * Fetch all clients for an admin
 */
const fetchAllClientsForAdmin = async (): Promise<ClientData[]> => {
  try {
    console.log('Fetching all clients for admin');
    
    // First, get valid client IDs that exist in auth.users
    // Using the "any" type to bypass TypeScript's strict checking on RPC functions
    const { data, error: validClientsError } = await supabase
      .rpc('get_all_valid_client_ids') as any;

    if (validClientsError) {
      console.error('Error fetching valid client IDs:', validClientsError);
      return [];
    }

    // Safely handle the response with proper type checking and assertion
    let validClientIds: string[] = [];
    if (data && Array.isArray(data)) {
      validClientIds = data as string[];
    }
    
    if (validClientIds.length === 0) {
      console.log('No valid clients found');
      return [];
    }

    console.log(`Found ${validClientIds.length} clients`);

    // Now get client profile data
    const { data: clientProfiles, error: profilesError } = await supabase
      .from('client_profiles')
      .select('id, first_name, last_name, avatar_url')
      .in('id', validClientIds);

    if (profilesError) {
      console.error('Error fetching client profiles:', profilesError);
    }

    console.log(`Fetched ${clientProfiles?.length || 0} client profiles`);

    // Create a map for quick lookup
    const profileMap: Record<string, any> = {};
    if (clientProfiles) {
      clientProfiles.forEach(profile => {
        profileMap[profile.id] = profile;
      });
    }

    // Get emails for these clients
    const { data: emailsData, error: emailsError } = await supabase
      .rpc('get_users_email', { user_ids: validClientIds }) as any;
    
    if (emailsError) {
      console.error('Error fetching emails:', emailsError);
    } else {
      console.log(`Fetched ${emailsData ? (Array.isArray(emailsData) ? emailsData.length : 0) : 0} emails`);
    }

    // Create email map with proper type handling
    const emailMap: Record<string, string> = {};
    if (emailsData && Array.isArray(emailsData)) {
      emailsData.forEach((item: { id: string, email: string }) => {
        emailMap[item.id] = item.email;
      });
    }

    // Get workout information
    const { data: workoutInfo, error: workoutError } = await supabase
      .from('client_workout_info')
      .select('*')
      .in('user_id', validClientIds);

    if (workoutError) {
      console.error('Error fetching workout info:', workoutError);
    } else {
      console.log(`Fetched ${workoutInfo?.length || 0} workout infos`);
    }

    // Create workout info map
    const workoutInfoMap: Record<string, any> = {};
    if (workoutInfo) {
      workoutInfo.forEach(info => {
        workoutInfoMap[info.user_id] = info;
      });
    }

    // Get program titles
    const programIds = workoutInfo
      ?.map(info => info.current_program_id)
      .filter(id => id) || [];

    let programTitles: Record<string, string> = {};
    if (programIds.length > 0) {
      const { data: programs } = await supabase
        .from('workout_programs')
        .select('id, title')
        .in('id', programIds);
      
      if (programs) {
        console.log(`Fetched ${programs.length} programs`);
        programs.forEach(program => {
          programTitles[program.id] = program.title;
        });
      }
    }

    // Get group memberships
    const { data: groupMemberships, error: groupError } = await supabase
      .from('group_members')
      .select('user_id, group_id')
      .in('user_id', validClientIds);

    if (groupError) {
      console.error('Error fetching group memberships:', groupError);
    } else {
      console.log(`Fetched ${groupMemberships?.length || 0} group memberships`);
    }

    // Create group map
    const groupMap: Record<string, string[]> = {};
    if (groupMemberships) {
      groupMemberships.forEach(membership => {
        if (!groupMap[membership.user_id]) {
          groupMap[membership.user_id] = [];
        }
        groupMap[membership.user_id].push(membership.group_id);
      });
    }

    // Transform to ClientData format
    const clientsData: ClientData[] = validClientIds.map(clientId => {
      const profile = profileMap[clientId] || {};
      const info = workoutInfoMap[clientId] || {};
      
      return {
        id: clientId,
        user_type: 'client',
        first_name: profile.first_name || null,
        last_name: profile.last_name || null,
        avatar_url: profile.avatar_url || null,
        email: emailMap[clientId] || null,
        last_workout_at: info.last_workout_at || null,
        total_workouts_completed: info.total_workouts_completed || 0,
        current_program_id: info.current_program_id || null,
        current_program_title: info.current_program_id ? programTitles[info.current_program_id] || null : null,
        days_since_last_workout: info.last_workout_at ? 
          Math.floor((Date.now() - new Date(info.last_workout_at).getTime()) / (1000 * 60 * 60 * 24)) : null,
        group_ids: groupMap[clientId] || []
      };
    });

    console.log(`Returning ${clientsData.length} clients for admin`);
    return clientsData;
  } catch (error) {
    console.error('Error in fetchAllClientsForAdmin:', error);
    return [];
  }
};
