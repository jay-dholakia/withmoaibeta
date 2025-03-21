
import { supabase } from '@/integrations/supabase/client';

/**
 * Verifies if a user belongs to any group
 */
export const verifyUserGroupMembership = async (userId: string) => {
  if (!userId) return false;
  
  try {
    console.log('Verifying group membership for user:', userId);
    
    // First try directly fetching memberships
    const { data, error } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error verifying user group membership:', error);
      return false;
    }
    
    console.log('User group membership data:', data);
    
    // If no memberships found, check for available groups to join
    if (!data || data.length === 0) {
      // Check if there are any groups in the system
      const { data: availableGroups, error: groupsError } = await supabase
        .from('groups')
        .select('id, name')
        .limit(1);
        
      if (groupsError) {
        console.error('Error checking for available groups:', groupsError);
      } else {
        console.log('Available groups to join:', availableGroups);
        
        // If there are groups available, create a membership for this user
        if (availableGroups && availableGroups.length > 0) {
          const groupId = availableGroups[0].id;
          console.log(`Attempting to assign user ${userId} to group ${groupId}`);
          
          // Insert the user into the group_members table
          const { data: newMembership, error: insertError } = await supabase
            .from('group_members')
            .insert([{ user_id: userId, group_id: groupId }])
            .select();
            
          if (insertError) {
            console.error('Error auto-assigning user to group:', insertError);
          } else {
            console.log('User automatically assigned to group:', newMembership);
            // Return true since we've now created a membership
            return true;
          }
        }
      }
    }
    
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
    
    // First, check if the user has any group memberships
    const { data: memberships, error: membershipError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);
      
    if (membershipError) {
      console.error('Error checking user memberships:', membershipError);
      return [];
    }
    
    // If user has no memberships, try to assign them to a group
    if (!memberships || memberships.length === 0) {
      console.log('No existing memberships found, trying to assign user to a group');
      const assignResult = await ensureUserHasGroup(userId);
      
      if (assignResult.success) {
        console.log('User was successfully assigned to a group:', assignResult);
        // If assignment was successful, re-fetch the groups
        return fetchUserGroups(userId);
      } else {
        console.log('Could not assign user to a group:', assignResult.message);
        return [];
      }
    }
    
    // Fetch the group details for all memberships
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        group_id,
        group:group_id (
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
    
    // Filter out any null groups and return
    const groups = data
      .map(item => item.group)
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
      .single();
      
    if (profileError) {
      console.error('DIAGNOSIS: User profile not found:', profileError);
      return { 
        success: false, 
        message: 'User profile not found', 
        details: profileError 
      };
    }
    
    console.log('DIAGNOSIS: User profile exists:', profileData);
    
    // 2. Check direct access to group_members table
    const { data: groupMembersData, error: groupMembersError } = await supabase
      .from('group_members')
      .select('*')
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
    
    // 3. If no group assignments found, check if there's any data in group_members at all
    if (!groupMembersData || groupMembersData.length === 0) {
      const { count, error: countError } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true });
        
      console.log('DIAGNOSIS: Total group_members count:', count);
      
      if (countError) {
        console.error('DIAGNOSIS: Error counting group_members:', countError);
      }
      
      // Also check available groups 
      const { data: availableGroups, error: groupsError } = await supabase
        .from('groups')
        .select('id, name');
        
      if (groupsError) {
        console.error('DIAGNOSIS: Error checking available groups:', groupsError);
      } else {
        console.log('DIAGNOSIS: Available groups:', availableGroups);
        
        // If groups exist but user isn't in any, try to add them
        if (availableGroups && availableGroups.length > 0) {
          console.log('DIAGNOSIS: Found groups but user isn\'t assigned, attempting assignment');
          
          const groupId = availableGroups[0].id;
          console.log(`DIAGNOSIS: Attempting to assign user ${userId} to group ${groupId}`);
          
          // Insert the user into the group_members table
          const { data: newMembership, error: insertError } = await supabase
            .from('group_members')
            .insert([{ user_id: userId, group_id: groupId }])
            .select();
            
          if (insertError) {
            console.error('DIAGNOSIS: Error auto-assigning user to group:', insertError);
          } else {
            console.log('DIAGNOSIS: User automatically assigned to group:', newMembership);
            
            // Return updated diagnosis with the new membership
            return {
              success: true,
              message: 'User was automatically assigned to a group',
              hasGroupMemberships: true,
              groupMembershipsCount: 1,
              groupMemberships: newMembership,
              autoAssigned: true
            };
          }
        }
      }
    }
    
    // 4. For each group membership, check if we can access the group data
    if (groupMembersData && groupMembersData.length > 0) {
      for (const membership of groupMembersData) {
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('id, name, description')
          .eq('id', membership.group_id)
          .single();
          
        if (groupError) {
          console.error(`DIAGNOSIS: Cannot access group (${membership.group_id}):`, groupError);
        } else {
          console.log(`DIAGNOSIS: Successfully accessed group:`, groupData);
        }
      }
    }
    
    return {
      success: true,
      message: 'Diagnosis complete',
      hasGroupMemberships: groupMembersData && groupMembersData.length > 0,
      groupMembershipsCount: groupMembersData?.length || 0,
      groupMemberships: groupMembersData
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
      console.log('No groups available to assign user to');
      // Create a default group if none exists
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
      return assignUserToGroup(userId, newGroup[0].id);
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
