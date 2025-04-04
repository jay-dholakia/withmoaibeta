
import { supabase } from '@/integrations/supabase/client';
import { ensureCoachGroupAssignment } from './coach-group-service';

/**
 * Fetches all groups in the system
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
 * Create a new group for a coach
 */
export const createGroupForCoach = async (
  coachId: string, 
  groupName: string, 
  groupDescription?: string,
  spotifyPlaylistUrl?: string,
  programType: string = 'strength'
) => {
  try {
    // 1. Create the group
    const { data: newGroup, error: groupError } = await supabase
      .from('groups')
      .insert([{
        name: groupName,
        description: groupDescription || '',
        created_by: coachId,
        spotify_playlist_url: spotifyPlaylistUrl || null,
        program_type: programType
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
 * Update an existing group
 */
export const updateGroup = async (
  groupId: string,
  updates: { 
    name?: string; 
    description?: string; 
    spotify_playlist_url?: string | null;
    program_type?: string;
  }
) => {
  try {
    const { data, error } = await supabase
      .from('groups')
      .update(updates)
      .eq('id', groupId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating group:', error);
      throw error;
    }
    
    return { 
      success: true, 
      message: 'Group updated successfully', 
      data 
    };
  } catch (error) {
    console.error('Error in updateGroup:', error);
    return { 
      success: false, 
      message: 'Failed to update group', 
      error 
    };
  }
};

// Helper function to fetch group details by IDs
export const fetchGroupDetails = async (groupIds: string[]) => {
  if (!groupIds || groupIds.length === 0) return [];
  
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupIds);
    
  if (groupsError) {
    console.error('Error fetching groups:', groupsError);
    throw groupsError;
  }
  
  console.log('Groups data:', groups);
  return groups || [];
};

/**
 * Create a default Moai group if none exists
 */
export const createDefaultMoaiGroupIfNeeded = async (adminId: string, programType: string = 'strength') => {
  try {
    const groupName = programType === 'run' ? 'Moai Run Group' : 'Moai Strength Group';
    const description = programType === 'run' 
      ? 'A supportive community for your running journey' 
      : 'A supportive community for your strength training journey';
    
    // Check if any similar Moai groups exist
    const { data: existingGroups, error: checkError } = await supabase
      .from('groups')
      .select('id, name, program_type')
      .ilike('name', `Moai%`)
      .eq('program_type', programType);
      
    if (checkError) {
      console.error(`Error checking for Moai ${programType} groups:`, checkError);
      return {
        success: false,
        message: `Failed to check for existing Moai ${programType} groups`,
        created: false
      };
    }
    
    // If Moai groups of this type already exist, we don't need to create one
    if (existingGroups && existingGroups.length > 0) {
      console.log(`Moai ${programType} groups already exist:`, existingGroups);
      return {
        success: true,
        message: `Moai ${programType} groups already exist`,
        groups: existingGroups,
        created: false
      };
    }
    
    // Create a new Moai group
    const { data: newGroup, error: createError } = await supabase
      .from('groups')
      .insert({
        name: groupName,
        description: description,
        created_by: adminId,
        program_type: programType
      })
      .select();
      
    if (createError) {
      console.error(`Error creating Moai ${programType} group:`, createError);
      return {
        success: false,
        message: `Failed to create Moai ${programType} group`,
        created: false
      };
    }
    
    return {
      success: true,
      message: `Successfully created default Moai ${programType} group`,
      group: newGroup[0],
      created: true
    };
  } catch (error) {
    console.error(`Unexpected error in createDefaultMoaiGroupIfNeeded for ${programType}:`, error);
    return {
      success: false,
      message: `Unexpected error creating default Moai ${programType} group`,
      created: false
    };
  }
};

/**
 * Get user's program type based on their group membership
 * This will throw an error if user belongs to multiple groups with different program types
 */
export const getUserProgramType = async (userId: string) => {
  try {
    // Get the user's groups
    const { data: memberships, error: membershipError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);
      
    if (membershipError) throw membershipError;
    
    if (!memberships || memberships.length === 0) {
      return { 
        success: false, 
        message: 'User is not a member of any group', 
        programType: 'strength',
        multipleGroups: false 
      };
    }
    
    const groupIds = memberships.map(m => m.group_id);
    
    // Get the groups' program types
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, program_type')
      .in('id', groupIds);
      
    if (groupsError) throw groupsError;
    
    if (!groups || groups.length === 0) {
      return { 
        success: false, 
        message: 'No groups found for user', 
        programType: 'strength',
        multipleGroups: false 
      };
    }
    
    // Check if user belongs to multiple groups with different program types
    const programTypes = [...new Set(groups.map(g => g.program_type))];
    
    if (programTypes.length > 1) {
      return { 
        success: false, 
        message: 'User belongs to multiple groups with different program types', 
        programType: programTypes[0],
        multipleGroups: true,
        groups 
      };
    }
    
    return { 
      success: true, 
      programType: programTypes[0] || 'strength', 
      multipleGroups: false,
      groups 
    };
  } catch (error) {
    console.error('Error in getUserProgramType:', error);
    return { 
      success: false, 
      message: 'Failed to get user program type', 
      programType: 'strength', 
      multipleGroups: false,
      error 
    };
  }
};
