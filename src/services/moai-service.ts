
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
