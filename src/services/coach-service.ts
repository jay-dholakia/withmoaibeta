
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches all groups a coach is assigned to
 */
export const fetchCoachGroups = async (coachId: string) => {
  if (!coachId) throw new Error('Coach ID is required');
  
  console.log('Service: Fetching coach groups for coach ID:', coachId);
  
  try {
    // 1. Get user email from session - this is the most reliable source
    const { data: { session } } = await supabase.auth.getSession();
    const userEmail = session?.user?.email;
    
    console.log(`Service: Current user email from session: ${userEmail}`);
    
    // 2. First try the direct approach - look for existing assignments by coach ID
    const { data: groupCoaches, error: groupCoachesError } = await supabase
      .from('group_coaches')
      .select('group_id, id, coach_id')
      .eq('coach_id', coachId);
      
    if (groupCoachesError) {
      console.error('Service: Error fetching group_coaches:', groupCoachesError);
      throw groupCoachesError;
    }
    
    console.log('Service: Group coaches data for exact ID match:', groupCoaches);
    
    let groupsData = [];
    
    // 3. Special handling for jdholakia12@gmail.com account - maintain backward compatibility
    if (userEmail === 'jdholakia12@gmail.com') {
      console.log('Service: Found jdholakia12@gmail.com account, looking for Moai groups');
      
      // Look for existing Moai groups
      const { data: moaiGroups, error: moaiError } = await supabase
        .from('groups')
        .select('*')
        .ilike('name', 'Moai%');
        
      if (moaiError) {
        console.error('Service: Error fetching Moai groups:', moaiError);
      } else {
        console.log('Service: Found Moai groups:', moaiGroups);
        
        if (moaiGroups && moaiGroups.length > 0) {
          // Ensure this coach is assigned to all Moai groups
          for (const moaiGroup of moaiGroups) {
            await ensureCoachGroupAssignment(coachId, moaiGroup.id);
          }
          
          // Return Moai groups since assignments are now guaranteed
          groupsData = moaiGroups;
        } else if (groupCoaches && groupCoaches.length === 0) {
          // No Moai groups and no assignments - create a new Moai group
          console.log('Service: No Moai groups found, creating one');
          
          try {
            const { data: newGroup, error: createError } = await supabase
              .from('groups')
              .insert({
                name: 'Moai - Default',
                description: 'Default Moai group for testing',
                created_by: coachId
              })
              .select();
              
            if (createError) {
              console.error('Service: Error creating Moai group:', createError);
            } else if (newGroup && newGroup.length > 0) {
              console.log('Service: Created new Moai group:', newGroup);
              
              // Create assignment for the new group
              await ensureCoachGroupAssignment(coachId, newGroup[0].id);
              groupsData = newGroup;
            }
          } catch (err) {
            console.error('Service: Error in Moai group creation:', err);
          }
        }
      }
    }
    
    // 4. If we have groups by now (either from direct match or Moai special case), return them
    if (groupsData.length > 0) {
      return groupsData;
    }
    
    // 5. If we have existing assignments from step 2, fetch the group details
    if (groupCoaches && groupCoaches.length > 0) {
      return await fetchGroupDetails(groupCoaches.map(gc => gc.group_id));
    }
    
    // 6. Fallback - look for any groups in the system
    const { data: allGroups, error: allGroupsError } = await supabase
      .from('groups')
      .select('*');
      
    if (allGroupsError) {
      console.error('Service: Error fetching all groups:', allGroupsError);
      throw allGroupsError;
    }
    
    console.log('Service: All groups in system:', allGroups);
    
    // 7. If there are groups but no assignments, create one for the first group as a fallback
    if (allGroups && allGroups.length > 0) {
      const firstGroup = allGroups[0];
      await ensureCoachGroupAssignment(coachId, firstGroup.id);
      return allGroups;
    }
    
    // 8. Last resort - create a new default group and assign the coach
    console.log('Service: No groups found at all, creating a new default group');
    
    try {
      const { data: defaultGroup, error: defaultGroupError } = await supabase
        .from('groups')
        .insert({
          name: 'Default Group',
          description: 'Automatically created default group',
          created_by: coachId
        })
        .select();
        
      if (defaultGroupError) {
        console.error('Service: Error creating default group:', defaultGroupError);
        return [];
      }
      
      if (defaultGroup && defaultGroup.length > 0) {
        await ensureCoachGroupAssignment(coachId, defaultGroup[0].id);
        return defaultGroup;
      }
    } catch (err) {
      console.error('Service: Error in default group creation:', err);
    }
    
    return [];
  } catch (error) {
    console.error('Service: Unexpected error in fetchCoachGroups:', error);
    throw error;
  }
};

// Helper function to ensure a coach is assigned to a group
const ensureCoachGroupAssignment = async (coachId: string, groupId: string) => {
  try {
    // Check if assignment already exists
    const { data: existingAssignment, error: checkError } = await supabase
      .from('group_coaches')
      .select('*')
      .eq('coach_id', coachId)
      .eq('group_id', groupId);
      
    if (checkError) {
      console.error(`Service: Error checking assignment for group ${groupId}:`, checkError);
      return false;
    }
    
    if (!existingAssignment || existingAssignment.length === 0) {
      console.log(`Service: Creating new assignment for coach ${coachId} to group ${groupId}`);
      
      // Create a new assignment
      const { data: newAssignment, error: assignError } = await supabase
        .from('group_coaches')
        .insert({ coach_id: coachId, group_id: groupId })
        .select();
        
      if (assignError) {
        console.error('Service: Error creating assignment:', assignError);
        return false;
      } else {
        console.log('Service: Created new coach-group assignment:', newAssignment);
        return true;
      }
    } else {
      console.log('Service: Assignment already exists:', existingAssignment);
      return true;
    }
  } catch (err) {
    console.error('Service: Error in ensureCoachGroupAssignment:', err);
    return false;
  }
};

// Helper function to fetch group details by IDs
const fetchGroupDetails = async (groupIds: string[]) => {
  if (!groupIds || groupIds.length === 0) return [];
  
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupIds);
    
  if (groupsError) {
    console.error('Service: Error fetching groups:', groupsError);
    throw groupsError;
  }
  
  console.log('Service: Groups data:', groups);
  return groups || [];
};

/**
 * Fetches all clients associated with the coach's groups
 */
export const fetchCoachClients = async (coachId: string) => {
  if (!coachId) throw new Error('Coach ID is required');
  
  try {
    const { data, error } = await supabase.rpc('get_coach_clients', {
      coach_id: coachId
    });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching coach clients:', error);
    throw error;
  }
};

/**
 * Fix coach-group assignment issues by verifying the coach ID format
 */
export const fixCoachGroupAssignment = async (coachId: string, groupId: string) => {
  try {
    console.log('Fixing coach group assignment:', coachId, groupId);
    return await ensureCoachGroupAssignment(coachId, groupId);
  } catch (error) {
    console.error('Error in fixCoachGroupAssignment:', error);
    return { success: false, message: 'Failed to fix coach group assignment', error };
  }
};

/**
 * Create a new group for a coach
 */
export const createGroupForCoach = async (
  coachId: string, 
  groupName: string, 
  groupDescription?: string
) => {
  try {
    // 1. Create the group
    const { data: newGroup, error: groupError } = await supabase
      .from('groups')
      .insert([{
        name: groupName,
        description: groupDescription || '',
        created_by: coachId
      }])
      .select()
      .single();
      
    if (groupError) {
      console.error('Error creating group:', groupError);
      throw groupError;
    }
    
    // 2. Assign the coach to the group
    const result = await ensureCoachGroupAssignment(coachId, newGroup.id);
    
    if (!result) {
      throw new Error('Failed to assign coach to the newly created group');
    }
    
    return { 
      success: true, 
      message: 'Group created and coach assigned successfully', 
      data: newGroup 
    };
  } catch (error) {
    console.error('Error in createGroupForCoach:', error);
    return { 
      success: false, 
      message: 'Failed to create group for coach', 
      error 
    };
  }
};

/**
 * Fetch all available groups in the system
 */
export const fetchAllGroups = async () => {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*');
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching all groups:', error);
    throw error;
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
