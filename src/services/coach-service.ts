
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches all groups a coach is assigned to
 */
export const fetchCoachGroups = async (coachId: string) => {
  if (!coachId) throw new Error('Coach ID is required');
  
  console.log('Service: Fetching coach groups for coach ID:', coachId);
  
  try {
    // First, log all group coaches to see if there's any data
    const { data: allGroupCoaches, error: allGroupCoachesError } = await supabase
      .from('group_coaches')
      .select('*');
      
    if (allGroupCoachesError) {
      console.error('Service: Error fetching all group coaches:', allGroupCoachesError);
      throw allGroupCoachesError;
    }
    
    console.log('Service: All group coaches in system:', allGroupCoaches);
    
    // Check for possible UUID format issues and inconsistencies
    let possibleMatchingCoachRecords = [];
    
    if (allGroupCoaches && allGroupCoaches.length > 0) {
      // Try different formats of the coach ID for matching
      const normalizedCoachId = coachId.toLowerCase().replace(/-/g, '');
      
      possibleMatchingCoachRecords = allGroupCoaches.filter(gc => {
        if (!gc.coach_id) return false;
        
        // Check various possible formats
        const normalizedGcCoachId = gc.coach_id.toLowerCase().replace(/-/g, '');
        return normalizedGcCoachId === normalizedCoachId || 
               gc.coach_id.toLowerCase() === coachId.toLowerCase();
      });
      
      if (possibleMatchingCoachRecords.length > 0) {
        console.log('Service: Found possible matching coach records with different formats:', possibleMatchingCoachRecords);
      }
    }
    
    // Get groups the coach is assigned to using standard query
    const { data: groupCoaches, error: groupCoachesError } = await supabase
      .from('group_coaches')
      .select('group_id, id, coach_id')
      .eq('coach_id', coachId);
      
    if (groupCoachesError) {
      console.error('Service: Error fetching group_coaches:', groupCoachesError);
      throw groupCoachesError;
    }
    
    console.log('Service: Group coaches data:', groupCoaches);
    
    // Try alternate query with different case formatting
    if (!groupCoaches || groupCoaches.length === 0) {
      console.log('Service: Trying case-insensitive query for coach ID');
      
      const { data: altGroupCoaches, error: altGroupCoachesError } = await supabase
        .from('group_coaches')
        .select('group_id, id, coach_id')
        .ilike('coach_id', coachId);
        
      if (altGroupCoachesError) {
        console.error('Service: Error fetching with case-insensitive query:', altGroupCoachesError);
      } else if (altGroupCoaches && altGroupCoaches.length > 0) {
        console.log('Service: Found groups with case-insensitive query:', altGroupCoaches);
        return await fetchGroupDetails(altGroupCoaches.map(gc => gc.group_id));
      }
    }
    
    // If we didn't find records with the exact ID, but found possible matches
    let finalGroupCoaches = groupCoaches || [];
    if ((finalGroupCoaches.length === 0) && possibleMatchingCoachRecords.length > 0) {
      console.log('Service: Using alternative matched coach records');
      
      // Extract the group IDs from the possible matches
      const matchedGroupIds = possibleMatchingCoachRecords.map(record => record.group_id);
      
      console.log('Service: Using these group IDs from alternative matching:', matchedGroupIds);
      
      // Construct a compatible data structure
      finalGroupCoaches = possibleMatchingCoachRecords.map(record => ({
        group_id: record.group_id,
        id: record.id,
        coach_id: record.coach_id
      }));
    }
    
    if (!finalGroupCoaches || finalGroupCoaches.length === 0) {
      console.log('Service: No groups found for coach after all attempts');
      
      // Additional debugging: log the specific coach ID we're using and its format
      console.log('Service: Coach ID format check:', {
        original: coachId,
        lowercase: coachId.toLowerCase(),
        noHyphens: coachId.replace(/-/g, ''),
        length: coachId.length
      });
      
      // Check if the coach exists in the profiles table
      const { data: coachProfile, error: coachProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', coachId)
        .single();
        
      if (coachProfileError) {
        console.error('Service: Error checking coach profile:', coachProfileError);
      } else {
        console.log('Service: Coach profile exists:', coachProfile);
      }
      
      return [];
    }
    
    return await fetchGroupDetails(finalGroupCoaches.map(gc => gc.group_id));
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
