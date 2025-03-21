
import { supabase } from '@/integrations/supabase/client';

/**
 * Verifies if a user belongs to any group
 */
export const verifyUserGroupMembership = async (userId: string) => {
  if (!userId) return false;
  
  try {
    console.log('Verifying group membership for user:', userId);
    
    const { data, error } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error verifying user group membership:', error);
      return false;
    }
    
    console.log('User group membership data:', data);
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
