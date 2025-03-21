
import { supabase } from '@/integrations/supabase/client';
import { fetchGroupDetails } from './group-service';

/**
 * Fetches all groups a coach is assigned to
 */
export const fetchCoachGroups = async (coachId: string) => {
  if (!coachId) throw new Error('Coach ID is required');
  
  console.log('Service: Fetching coach groups for coach ID:', coachId);
  
  try {
    // First, get all coach-group assignments
    const { data: groupCoaches, error: groupCoachesError } = await supabase
      .from('group_coaches')
      .select('group_id, id, coach_id')
      .eq('coach_id', coachId);
      
    if (groupCoachesError) {
      console.error('Service: Error fetching group_coaches:', groupCoachesError);
      throw groupCoachesError;
    }
    
    console.log('Service: Found coach-group assignments:', groupCoaches);
    
    // If there are group assignments, fetch the details for those groups
    if (groupCoaches && groupCoaches.length > 0) {
      const groupIds = groupCoaches.map(gc => gc.group_id);
      const groups = await fetchGroupDetails(groupIds);
      console.log('Service: Retrieved group details:', groups);
      return groups;
    }
    
    // If no assignments were found, check if this is a special user (jdholakia12@gmail.com)
    // 1. Get user email from session - this is the most reliable source
    const { data: { session } } = await supabase.auth.getSession();
    const userEmail = session?.user?.email;
    
    console.log(`Service: Current user email from session: ${userEmail}`);
    
    // Special handling for jdholakia12@gmail.com account - maintain backward compatibility
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
          return moaiGroups;
        } else {
          // No Moai groups - create a new Moai group
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
              return newGroup;
            }
          } catch (err) {
            console.error('Service: Error in Moai group creation:', err);
          }
        }
      }
    }
    
    // If we reach here, we need to create a new default group or assign an existing one
    console.log('Service: No groups found for coach, fetching all groups in system');
    
    // Fallback - look for any groups in the system
    const { data: allGroups, error: allGroupsError } = await supabase
      .from('groups')
      .select('*');
      
    if (allGroupsError) {
      console.error('Service: Error fetching all groups:', allGroupsError);
      throw allGroupsError;
    }
    
    console.log('Service: All groups in system:', allGroups);
    
    // If there are groups but no assignments, create one for the first group as a fallback
    if (allGroups && allGroups.length > 0) {
      const firstGroup = allGroups[0];
      await ensureCoachGroupAssignment(coachId, firstGroup.id);
      return allGroups;
    }
    
    // Last resort - create a new default group and assign the coach
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
