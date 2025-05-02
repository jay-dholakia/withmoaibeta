
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch all groups assigned to a coach
 * If the coach is an admin, fetch all groups
 */
export const fetchCoachGroups = async (coachId: string, isAdmin = false) => {
  try {
    console.log(`Fetching groups for coach ${coachId}, isAdmin: ${isAdmin}`);
    
    let groupsData;
    
    // If coach is an admin, fetch all groups
    if (isAdmin) {
      console.log('Coach is admin, fetching all groups');
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('name');
        
      if (error) {
        console.error('Error fetching all groups:', error);
        throw error;
      }
      
      groupsData = data;
    } else {
      // Regular coach, fetch only assigned groups
      console.log('Fetching groups for regular coach');
      const { data, error } = await supabase
        .from('group_coaches')
        .select(`
          group_id,
          groups:group_id (
            id,
            name,
            description,
            created_at,
            created_by
          )
        `)
        .eq('coach_id', coachId);
        
      if (error) {
        console.error('Error fetching coach groups:', error);
        throw error;
      }
      
      // Extract the groups data from the join
      groupsData = data?.map(item => item.groups).filter(Boolean) || [];
    }
    
    console.log('Groups data retrieved:', groupsData);
    return groupsData;
  } catch (error) {
    console.error('Error in fetchCoachGroups:', error);
    throw error;
  }
};

/**
 * Ensure that a coach is assigned to a group
 */
export const ensureCoachGroupAssignment = async (coachId: string, groupId: string) => {
  try {
    // Check if the assignment already exists
    const { data: existingAssignment, error: checkError } = await supabase
      .from('group_coaches')
      .select('*')
      .eq('coach_id', coachId)
      .eq('group_id', groupId)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking existing coach group assignment:', checkError);
      throw checkError;
    }
    
    // If assignment exists, we're done
    if (existingAssignment) {
      console.log('Coach is already assigned to this group');
      return true;
    }
    
    // Create the assignment
    const { error: insertError } = await supabase
      .from('group_coaches')
      .insert({
        coach_id: coachId,
        group_id: groupId
      });
      
    if (insertError) {
      console.error('Error assigning coach to group:', insertError);
      throw insertError;
    }
    
    console.log('Coach successfully assigned to group');
    return true;
  } catch (error) {
    console.error('Error in ensureCoachGroupAssignment:', error);
    return false;
  }
};

/**
 * Remove a coach from a group
 */
export const removeCoachFromGroup = async (coachId: string, groupId: string) => {
  try {
    const { error } = await supabase
      .from('group_coaches')
      .delete()
      .eq('coach_id', coachId)
      .eq('group_id', groupId);
      
    if (error) {
      console.error('Error removing coach from group:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in removeCoachFromGroup:', error);
    throw error;
  }
};
