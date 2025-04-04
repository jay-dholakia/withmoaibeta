
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
  data: { 
    name: string; 
    description?: string | null;
    program_type?: string;
    spotify_playlist_url?: string | null;
  }
) => {
  try {
    const { error } = await supabase
      .from('groups')
      .update({
        name: data.name,
        description: data.description || null,
        program_type: data.program_type || 'strength',
        spotify_playlist_url: data.spotify_playlist_url || null
      })
      .eq('id', groupId);

    if (error) {
      console.error('Error updating group:', error);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error in updateGroup:', err);
    return { success: false, message: 'An unexpected error occurred' };
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
export const createDefaultMoaiGroupIfNeeded = async (adminId: string) => {
  try {
    // Check if any Moai groups exist
    const { data: existingGroups, error: checkError } = await supabase
      .from('groups')
      .select('id, name, program_type')
      .ilike('name', 'Moai%');
      
    if (checkError) {
      console.error('Error checking for Moai groups:', checkError);
      return {
        success: false,
        message: 'Failed to check for existing Moai groups'
      };
    }
    
    // If Moai groups already exist, we don't need to create one
    if (existingGroups && existingGroups.length > 0) {
      console.log('Moai groups already exist:', existingGroups);
      return {
        success: true,
        message: 'Moai groups already exist',
        groups: existingGroups
      };
    }
    
    // Create a Moai Strength group
    const { data: strengthGroup, error: strengthError } = await supabase
      .from('groups')
      .insert({
        name: 'Moai Strength',
        description: 'Default Moai Strength group for workouts',
        program_type: 'strength',
        created_by: adminId
      })
      .select();
      
    if (strengthError) {
      console.error('Error creating Moai Strength group:', strengthError);
      return {
        success: false,
        message: 'Failed to create Moai Strength group'
      };
    }
    
    // Create a Moai Run group
    const { data: runGroup, error: runError } = await supabase
      .from('groups')
      .insert({
        name: 'Moai Run',
        description: 'Default Moai Run group for running programs',
        program_type: 'run',
        created_by: adminId
      })
      .select();
      
    if (runError) {
      console.error('Error creating Moai Run group:', runError);
      return {
        success: false,
        message: 'Failed to create Moai Run group'
      };
    }
    
    return {
      success: true,
      message: 'Successfully created default Moai Strength and Run groups',
      groups: [...strengthGroup || [], ...runGroup || []]
    };
  } catch (error) {
    console.error('Unexpected error in createDefaultMoaiGroupIfNeeded:', error);
    return {
      success: false,
      message: 'Unexpected error creating default Moai groups'
    };
  }
};
