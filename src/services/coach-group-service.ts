import { supabase } from '@/integrations/supabase/client';
import { fetchGroupDetails } from './group-service';

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
export const ensureCoachGroupAssignment = async (coachId: string, groupId: string) => {
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
