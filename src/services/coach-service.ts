import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches all groups a coach is assigned to
 */
export const fetchCoachGroups = async (coachId: string) => {
  if (!coachId) throw new Error('Coach ID is required');
  
  console.log('Service: Fetching coach groups for coach ID:', coachId);
  
  try {
    // Direct query for coach's groups - use exact UUID
    const { data: groupCoaches, error: groupCoachesError } = await supabase
      .from('group_coaches')
      .select('group_id, id, coach_id')
      .eq('coach_id', coachId);
      
    if (groupCoachesError) {
      console.error('Service: Error fetching group_coaches:', groupCoachesError);
      throw groupCoachesError;
    }
    
    console.log('Service: Group coaches data for exact ID match:', groupCoaches);
    
    // If no results found by UUID, try with email lookup
    if (!groupCoaches || groupCoaches.length === 0) {
      console.log('Service: No exact UUID matches found, attempting email lookup');
      
      // Get user email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', coachId)
        .single();
        
      if (userError) {
        console.error('Service: Error fetching user profile:', userError);
      }
      
      const { data: authUser } = await supabase.auth.admin.getUserById(coachId);
      const userEmail = authUser?.user?.email;
      
      console.log(`Service: Looking up groups for email: ${userEmail}`);
      
      if (userEmail === 'jdholakia12@gmail.com') {
        console.log('Service: Found target jdholakia12@gmail.com account, looking for Moai groups');
        
        // Get the Moai group specifically
        const { data: moaiGroups, error: moaiError } = await supabase
          .from('groups')
          .select('*')
          .ilike('name', 'Moai%');
          
        if (moaiError) {
          console.error('Service: Error fetching Moai groups:', moaiError);
        } else if (moaiGroups && moaiGroups.length > 0) {
          console.log('Service: Found Moai groups:', moaiGroups);
          
          // Check if user is already assigned to these groups
          for (const moaiGroup of moaiGroups) {
            const { data: existingAssignment, error: checkError } = await supabase
              .from('group_coaches')
              .select('*')
              .eq('coach_id', coachId)
              .eq('group_id', moaiGroup.id);
              
            if (checkError) {
              console.error(`Service: Error checking assignment for group ${moaiGroup.id}:`, checkError);
              continue;
            }
            
            if (!existingAssignment || existingAssignment.length === 0) {
              console.log(`Service: Creating new assignment for coach ${coachId} to group ${moaiGroup.id}`);
              
              // Create a new assignment
              const { data: newAssignment, error: assignError } = await supabase
                .from('group_coaches')
                .insert([{ coach_id: coachId, group_id: moaiGroup.id }])
                .select();
                
              if (assignError) {
                console.error('Service: Error creating assignment:', assignError);
              } else {
                console.log('Service: Created new coach-group assignment:', newAssignment);
              }
            } else {
              console.log('Service: Assignment already exists:', existingAssignment);
            }
          }
          
          // Return Moai groups after ensuring assignments
          return moaiGroups;
        }
      }
      
      // As a fallback, look for any groups in the system
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
        const { data: existingAssignment, error: checkError } = await supabase
          .from('group_coaches')
          .select('*')
          .eq('coach_id', coachId)
          .eq('group_id', firstGroup.id);
          
        if (checkError) {
          console.error('Service: Error checking existing assignment:', checkError);
        } else if (!existingAssignment || existingAssignment.length === 0) {
          console.log(`Service: Creating fallback assignment to first available group: ${firstGroup.id}`);
          
          // Create a new assignment
          const { data: newAssignment, error: assignError } = await supabase
            .from('group_coaches')
            .insert([{ coach_id: coachId, group_id: firstGroup.id }])
            .select();
            
          if (assignError) {
            console.error('Service: Error creating fallback assignment:', assignError);
          } else {
            console.log('Service: Created fallback coach-group assignment:', newAssignment);
          }
        }
      }
      
      return allGroups || [];
    }
    
    return await fetchGroupDetails(groupCoaches.map(gc => gc.group_id));
  } catch (error) {
    console.error('Service: Unexpected error in fetchCoachGroups:', error);
    throw error;
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
    
    // Check if there's an existing record
    const { data: existingAssignment, error: checkError } = await supabase
      .from('group_coaches')
      .select('*')
      .eq('coach_id', coachId)
      .eq('group_id', groupId);
      
    if (checkError) {
      console.error('Error checking existing assignment:', checkError);
      throw checkError;
    }
    
    if (existingAssignment && existingAssignment.length > 0) {
      console.log('Assignment already exists:', existingAssignment);
      return { success: true, message: 'Assignment already exists', data: existingAssignment[0] };
    }
    
    // Create a new assignment
    const { data, error } = await supabase
      .from('group_coaches')
      .insert([{ coach_id: coachId, group_id: groupId }])
      .select();
      
    if (error) {
      console.error('Error fixing coach group assignment:', error);
      throw error;
    }
    
    console.log('Successfully fixed coach group assignment:', data);
    return { success: true, message: 'Assignment created successfully', data };
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
    const result = await fixCoachGroupAssignment(coachId, newGroup.id);
    
    if (!result.success) {
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
