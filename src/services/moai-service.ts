
import { supabase } from '@/integrations/supabase/client';

/**
 * Verifies if a user belongs to any group
 */
export const verifyUserGroupMembership = async (userId: string) => {
  if (!userId) return false;
  
  try {
    console.log('Verifying group membership for user:', userId);
    
    // Check for network connectivity
    if (!navigator.onLine) {
      console.warn('Network offline: Cannot verify group membership');
      // Return the last known state or a safe default
      return false;
    }
    
    // Use maybeSingle() instead of single() to avoid errors when no records found
    const { data, error, count } = await supabase
      .from('group_members')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error verifying user group membership:', error);
      return false;
    }
    
    console.log('User group membership data:', data);
    console.log('User group membership count:', count);
    
    // Return true if we found any memberships
    return data && data.length > 0;
  } catch (err) {
    console.error('Unexpected error in verifyUserGroupMembership:', err);
    return false;
  }
};

/**
 * Fetch all groups a user belongs to
 */
export const fetchUserGroups = async (userId: string) => {
  if (!userId) return [];
  
  try {
    console.log('Fetching groups for user:', userId);
    
    // Check for network connectivity
    if (!navigator.onLine) {
      console.warn('Network offline: Cannot fetch user groups');
      // Return cached data if available or an empty array
      return [];
    }
    
    // Direct query for group memberships with inner join to groups
    // This is more reliable than the previous approach
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        id, 
        group_id,
        groups:group_id (
          id, 
          name, 
          description
        )
      `)
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error fetching user groups:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log('No groups found for user:', userId);
      return [];
    }
    
    // Map the results to extract group details
    const groups = data
      .map(item => item.groups)
      .filter(group => group !== null);
      
    console.log('Found groups for user:', groups);
    return groups;
  } catch (err) {
    console.error('Unexpected error in fetchUserGroups:', err);
    return [];
  }
};

/**
 * Detailed diagnostic function to check permissions and data access
 */
export const diagnoseGroupAccess = async (userId: string) => {
  if (!userId) {
    console.error('Cannot diagnose: User ID is missing');
    return { success: false, message: 'User ID is required' };
  }
  
  try {
    console.log('DIAGNOSIS: Starting group access diagnosis for user:', userId);
    
    // 1. Check if the user exists in the profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_type')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError) {
      console.error('DIAGNOSIS: User profile not found:', profileError);
      return { 
        success: false, 
        message: 'User profile not found', 
        details: profileError 
      };
    }
    
    console.log('DIAGNOSIS: User profile exists:', profileData);
    
    // 2. Direct check for group memberships with exact count
    const { data: groupMembersData, error: groupMembersError, count: membershipCount } = await supabase
      .from('group_members')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);
      
    if (groupMembersError) {
      console.error('DIAGNOSIS: Error accessing group_members table:', groupMembersError);
      return { 
        success: false, 
        message: 'Permission error accessing group_members', 
        details: groupMembersError 
      };
    }
    
    console.log('DIAGNOSIS: group_members access result:', groupMembersData);
    console.log('DIAGNOSIS: group_members count:', membershipCount);
    
    // 3. If memberships found, fetch the associated group details
    let groupDetails = [];
    if (groupMembersData && groupMembersData.length > 0) {
      const groupIds = groupMembersData.map(m => m.group_id);
      
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('id, name, description')
        .in('id', groupIds);
        
      if (groupsError) {
        console.error('DIAGNOSIS: Error fetching group details:', groupsError);
      } else {
        groupDetails = groups;
        console.log('DIAGNOSIS: Group details:', groups);
      }
    }
    
    // 4. Also directly query all available groups in the system
    const { data: availableGroups, error: availableGroupsError } = await supabase
      .from('groups')
      .select('id, name')
      .order('created_at', { ascending: false });
      
    if (availableGroupsError) {
      console.error('DIAGNOSIS: Error fetching available groups:', availableGroupsError);
    } else {
      console.log('DIAGNOSIS: Available groups in system:', availableGroups);
    }
    
    // Return comprehensive diagnosis including all details
    return {
      success: true,
      message: 'Diagnosis complete',
      hasGroupMemberships: membershipCount > 0,
      groupMembershipsCount: membershipCount || 0,
      groupMemberships: groupMembersData || [],
      groupDetails: groupDetails,
      availableGroups: availableGroups || []
    };
  } catch (err) {
    console.error('DIAGNOSIS: Unexpected error during diagnosis:', err);
    return { 
      success: false, 
      message: 'Unexpected error during diagnosis', 
      details: err 
    };
  }
};

/**
 * Assign a user to a group if they are not already assigned
 */
export const assignUserToGroup = async (userId: string, groupId: string) => {
  if (!userId || !groupId) {
    console.error('Cannot assign: User ID or Group ID is missing');
    return { success: false, message: 'User ID and Group ID are required' };
  }
  
  try {
    console.log(`Checking if user ${userId} is already in group ${groupId}`);
    
    // Check if the user is already in the group
    const { data: existingMembership, error: checkError } = await supabase
      .from('group_members')
      .select('*')
      .eq('user_id', userId)
      .eq('group_id', groupId);
      
    if (checkError) {
      console.error('Error checking group membership:', checkError);
      return { 
        success: false, 
        message: 'Error checking group membership', 
        details: checkError 
      };
    }
    
    // If user is already in the group, return success
    if (existingMembership && existingMembership.length > 0) {
      console.log('User is already a member of this group');
      return { 
        success: true, 
        message: 'User is already a member of this group',
        membership: existingMembership[0]
      };
    }
    
    // First, verify that the group exists
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('id, name')
      .eq('id', groupId)
      .maybeSingle();
      
    if (groupError || !groupData) {
      console.error('Error finding group:', groupError || 'Group not found');
      return { 
        success: false, 
        message: 'Group not found or error accessing group', 
        details: groupError 
      };
    }
    
    console.log(`Group found: ${groupData.name}, assigning user`);
    
    // Assign the user to the group
    const { data: newMembership, error: assignError } = await supabase
      .from('group_members')
      .insert([{ user_id: userId, group_id: groupId }])
      .select();
      
    if (assignError) {
      console.error('Error assigning user to group:', assignError);
      return { 
        success: false, 
        message: 'Error assigning user to group', 
        details: assignError 
      };
    }
    
    console.log('User successfully assigned to group:', newMembership);
    return { 
      success: true, 
      message: `User assigned to group: ${groupData.name}`,
      membership: newMembership[0]
    };
  } catch (err) {
    console.error('Unexpected error in assignUserToGroup:', err);
    return { 
      success: false, 
      message: 'Unexpected error assigning user to group', 
      details: err 
    };
  }
};

/**
 * Find available groups and assign user to the first one if needed
 */
export const ensureUserHasGroup = async (userId: string) => {
  if (!userId) {
    return { success: false, message: 'User ID is required' };
  }
  
  try {
    console.log('Checking if user needs group assignment:', userId);
    
    // First check if user already has any group assignments
    const { data: existingMemberships, error: membershipError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);
      
    if (membershipError) {
      console.error('Error checking existing memberships:', membershipError);
      return { 
        success: false, 
        message: 'Error checking existing memberships', 
        details: membershipError 
      };
    }
    
    // If user already has group assignments, no need to add more
    if (existingMemberships && existingMemberships.length > 0) {
      console.log('User already has group assignments:', existingMemberships);
      return { 
        success: true, 
        message: 'User already has group assignments',
        existingGroups: existingMemberships
      };
    }
    
    // Find available groups
    const { data: availableGroups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name')
      .order('created_at', { ascending: false });
      
    if (groupsError) {
      console.error('Error fetching available groups:', groupsError);
      return { 
        success: false, 
        message: 'Error fetching available groups', 
        details: groupsError 
      };
    }
    
    if (!availableGroups || availableGroups.length === 0) {
      console.log('No groups available to assign user to, will create a default group');
      
      // Create a default group
      const { data: newGroup, error: createError } = await supabase
        .from('groups')
        .insert([{ 
          name: 'Default Fitness Group', 
          description: 'A group for fitness enthusiasts',
          created_by: userId
        }])
        .select();
        
      if (createError) {
        console.error('Error creating default group:', createError);
        return { 
          success: false, 
          message: 'No groups available and failed to create one', 
          details: createError 
        };
      }
      
      console.log('Created default group:', newGroup);
      if (!newGroup || newGroup.length === 0) {
        return {
          success: false,
          message: 'Created group but received empty response',
          details: 'Empty group creation response'
        };
      }
      
      // Now assign the user to the newly created group
      return await assignUserToGroup(userId, newGroup[0].id);
    }
    
    // Assign user to the first available group
    const firstGroup = availableGroups[0];
    console.log(`Assigning user to group: ${firstGroup.name} (${firstGroup.id})`);
    
    return await assignUserToGroup(userId, firstGroup.id);
  } catch (err) {
    console.error('Unexpected error in ensureUserHasGroup:', err);
    return { 
      success: false, 
      message: 'Unexpected error ensuring user has group', 
      details: err 
    };
  }
};

/**
 * Clear all group memberships for a user and reassign to a new group
 * Use this to fix incorrect group assignments
 */
export const resetUserGroupMembership = async (userId: string, newGroupId?: string) => {
  if (!userId) {
    return { success: false, message: 'User ID is required' };
  }
  
  try {
    // Check for network connectivity
    if (!navigator.onLine) {
      return { 
        success: false, 
        message: 'Cannot reset group membership while offline',
        offline: true
      };
    }
    
    console.log(`Resetting group membership for user: ${userId}`);
    
    // First, get all current group memberships to check
    const { data: currentMemberships, error: fetchError } = await supabase
      .from('group_members')
      .select('id, group_id')
      .eq('user_id', userId);
      
    if (fetchError) {
      console.error('Error checking existing memberships:', fetchError);
      return { 
        success: false, 
        message: 'Error checking existing memberships', 
        details: fetchError 
      };
    }
    
    console.log('Current memberships:', currentMemberships);
    
    // Delete all existing group memberships
    if (currentMemberships && currentMemberships.length > 0) {
      const { error: deleteError } = await supabase
        .from('group_members')
        .delete()
        .eq('user_id', userId);
        
      if (deleteError) {
        console.error('Error deleting existing memberships:', deleteError);
        return { 
          success: false, 
          message: 'Error deleting existing memberships', 
          details: deleteError 
        };
      }
      
      console.log('Successfully deleted all existing group memberships');
    } else {
      console.log('No existing memberships to delete');
    }
    
    // If a new group ID is provided, assign the user to that group
    if (newGroupId) {
      return await assignUserToGroup(userId, newGroupId);
    } else {
      // Otherwise, let the system assign to any available group
      return await ensureUserHasGroup(userId);
    }
  } catch (err) {
    console.error('Unexpected error in resetUserGroupMembership:', err);
    return { 
      success: false, 
      message: 'Unexpected error resetting user group membership', 
      details: err 
    };
  }
};
