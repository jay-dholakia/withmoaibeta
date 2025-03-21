
import { supabase } from '@/integrations/supabase/client';
import { ensureCoachGroupAssignment } from './coach-group-service';
import { ClientData } from './client-service';

/**
 * Fetches all clients associated with the coach's groups
 */
export const fetchCoachClients = async (coachId: string): Promise<ClientData[]> => {
  if (!coachId) throw new Error('Coach ID is required');
  
  try {
    // First try using RPC function - we'll fix the ambiguous coach_id error by using parameter name
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_coach_clients', {
      coach_id: coachId
    });
    
    if (rpcError) {
      console.error('Error with RPC client fetch:', rpcError);
      
      // Fallback to direct query if RPC fails
      console.log('Falling back to direct query for clients');
      
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
        .select('user_id')
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
          user_type,
          client_workout_info (
            last_workout_at,
            total_workouts_completed,
            current_program_id
          ),
          workout_programs (
            id,
            title
          )
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
      
      // Get emails for these clients
      const { data: emails } = await supabase.rpc('get_users_email', {
        user_ids: clientIds
      });
      
      // Create a map of id -> email
      const emailMap = new Map();
      if (emails) {
        emails.forEach(e => emailMap.set(e.id, e.email));
      }
      
      // Create a map of id -> group_ids
      const groupMap = new Map();
      for (const member of groupMembers) {
        if (!groupMap.has(member.user_id)) {
          groupMap.set(member.user_id, []);
        }
        groupMap.get(member.user_id).push(groupCoaches.find(gc => gc.group_id === member.group_id)?.group_id);
      }
      
      // Transform the data to match expected format
      return clientProfiles.map(client => {
        // Get workout info
        const workoutInfo = client.client_workout_info && 
          Array.isArray(client.client_workout_info) && 
          client.client_workout_info.length > 0 
            ? client.client_workout_info[0] 
            : { last_workout_at: null, total_workouts_completed: 0, current_program_id: null };
            
        // Get program info
        const program = client.workout_programs && 
          Array.isArray(client.workout_programs) && 
          client.workout_programs.length > 0 
            ? client.workout_programs[0] 
            : null;
          
        // Calculate days since last workout
        let daysSinceLastWorkout = null;
        if (workoutInfo && typeof workoutInfo === 'object' && workoutInfo.last_workout_at) {
          const lastWorkout = new Date(workoutInfo.last_workout_at);
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - lastWorkout.getTime());
          daysSinceLastWorkout = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
          
        return {
          id: client.id,
          email: emailMap.get(client.id) || 'Unknown',
          user_type: client.user_type,
          last_workout_at: workoutInfo && typeof workoutInfo === 'object' ? workoutInfo.last_workout_at || null : null,
          total_workouts_completed: workoutInfo && typeof workoutInfo === 'object' ? workoutInfo.total_workouts_completed || 0 : 0,
          current_program_id: workoutInfo && typeof workoutInfo === 'object' ? workoutInfo.current_program_id || null : null,
          current_program_title: program && typeof program === 'object' ? program.title || null : null,
          days_since_last_workout: daysSinceLastWorkout,
          group_ids: groupMap.get(client.id) || []
        };
      });
    }
    
    return rpcData || [];
  } catch (error) {
    console.error('Error fetching coach clients:', error);
    return [];
  }
};

/**
 * Sync coach email with group assignments
 * Ensures that a coach with a specific email has the correct group assignments
 */
export const syncCoachEmailWithGroups = async () => {
  try {
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    const userEmail = session?.user?.email;
    const userId = session?.user?.id;
    
    if (!userEmail || !userId) {
      console.error('Cannot sync coach email with groups: No active session');
      return { success: false, message: 'No active user session' };
    }
    
    console.log(`Syncing groups for coach email: ${userEmail} with ID: ${userId}`);
    
    // Special handling for jdholakia12@gmail.com
    if (userEmail === 'jdholakia12@gmail.com') {
      // Find Moai groups
      const { data: moaiGroups, error: moaiError } = await supabase
        .from('groups')
        .select('*')
        .ilike('name', 'Moai%');
      
      if (moaiError) {
        console.error('Error finding Moai groups:', moaiError);
        return { success: false, message: 'Error finding Moai groups' };
      }
      
      // Create a Moai group if none exists
      if (!moaiGroups || moaiGroups.length === 0) {
        console.log('No Moai groups found, creating one');
        
        const { data: newGroup, error: createError } = await supabase
          .from('groups')
          .insert({
            name: 'Moai - Default',
            description: 'Default group for Moai coach',
            created_by: userId
          })
          .select();
        
        if (createError) {
          console.error('Error creating Moai group:', createError);
          return { success: false, message: 'Failed to create Moai group' };
        }
        
        if (newGroup && newGroup.length > 0) {
          // Assign coach to the new group
          await ensureCoachGroupAssignment(userId, newGroup[0].id);
          return { 
            success: true, 
            message: 'Created and assigned new Moai group', 
            data: newGroup[0] 
          };
        }
      } else {
        // Ensure the coach is assigned to all Moai groups
        let allAssigned = true;
        for (const group of moaiGroups) {
          const assigned = await ensureCoachGroupAssignment(userId, group.id);
          if (!assigned) allAssigned = false;
        }
        
        return { 
          success: allAssigned, 
          message: allAssigned ? 'Successfully synced all Moai group assignments' : 'Some assignments failed',
          data: moaiGroups
        };
      }
    }
    
    // For other coaches, make sure they have at least one group assignment
    const { data: groupCoaches } = await supabase
      .from('group_coaches')
      .select('*')
      .eq('coach_id', userId);
    
    if (!groupCoaches || groupCoaches.length === 0) {
      // This coach has no groups, assign or create one
      const { data: allGroups } = await supabase
        .from('groups')
        .select('*');
      
      if (allGroups && allGroups.length > 0) {
        // Assign to first available group
        const assigned = await ensureCoachGroupAssignment(userId, allGroups[0].id);
        return {
          success: assigned,
          message: assigned ? 'Coach assigned to existing group' : 'Failed to assign coach to group',
          data: allGroups[0]
        };
      } else {
        // Create a new group
        const { data: newGroup, error: createError } = await supabase
          .from('groups')
          .insert({
            name: `${userEmail.split('@')[0]}'s Group`,
            description: 'Default coach group',
            created_by: userId
          })
          .select();
        
        if (createError) {
          console.error('Error creating default group:', createError);
          return { success: false, message: 'Failed to create default group' };
        }
        
        if (newGroup && newGroup.length > 0) {
          const assigned = await ensureCoachGroupAssignment(userId, newGroup[0].id);
          return {
            success: assigned,
            message: assigned ? 'Created and assigned new group' : 'Created group but failed to assign coach',
            data: newGroup[0]
          };
        }
      }
    }
    
    return { 
      success: true, 
      message: 'Coach already has group assignments', 
      data: groupCoaches 
    };
  } catch (error) {
    console.error('Error in syncCoachEmailWithGroups:', error);
    return { success: false, message: 'Failed to sync coach email with groups', error };
  }
};
