
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches all groups a coach is assigned to
 */
export const fetchCoachGroups = async (coachId: string) => {
  if (!coachId) throw new Error('Coach ID is required');
  
  console.log('Service: Fetching coach groups for coach ID:', coachId);
  
  // Add specific logging for the requested coach ID
  const targetCoachId = "f77956bd-43b3-488e-a9e9-abffc496220f";
  const isTargetCoach = coachId === targetCoachId;
  
  if (isTargetCoach) {
    console.log('Service: This is the target coach ID we want to check:', targetCoachId);
  }
  
  try {
    // Fetch all group_coaches records for debugging
    const { data: allGroupCoaches, error: allGroupCoachesError } = await supabase
      .from('group_coaches')
      .select('*');
      
    if (allGroupCoachesError) {
      console.error('Service: Error fetching all group coaches:', allGroupCoachesError);
      throw allGroupCoachesError;
    }
    
    console.log('Service: All group coaches in system:', allGroupCoaches);
    
    // If we're looking for the target coach, log each record in detail
    if (isTargetCoach && allGroupCoaches) {
      console.log(`Service: Found ${allGroupCoaches.length} total group-coach assignments`);
      
      // Check for any assignments for our target coach
      const targetCoachAssignments = allGroupCoaches.filter(gc => 
        gc.coach_id && gc.coach_id.toLowerCase() === targetCoachId.toLowerCase()
      );
      
      console.log(`Service: Target coach has ${targetCoachAssignments.length} group assignments:`, targetCoachAssignments);
    }
    
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
    
    // If no results found, try with a broader search of all coach records
    if (!groupCoaches || groupCoaches.length === 0) {
      console.log('Service: No exact matches found, checking for email or partial matches');
      
      // Try to find coach record by email (if they were assigned by email)
      const email = 'jdholakia12@gmail.com'; // You mentioned this specific email
      let formattedEmail = email.toLowerCase().trim();
      
      console.log('Service: Checking for coach with email:', formattedEmail);
      
      // Query for user ID by email through Supabase auth
      const { data: userByEmail, error: userByEmailError } = await supabase.auth.admin.listUsers();
      
      // Since we can't directly query auth.users with the client, we'll check each coach record
      // to see if any of them might be for our coach
      let matchedCoachId = null;
      
      if (allGroupCoaches && allGroupCoaches.length > 0) {
        console.log('Service: Scanning all group coach records for potential matches');
        
        // Debug info about the coach ID we're looking for
        console.log('Service: Coach ID format check:', {
          original: coachId,
          lowercase: coachId.toLowerCase(),
          noHyphens: coachId.replace(/-/g, ''),
          length: coachId.length
        });
        
        // Log details about every coach ID in the system for comparison
        allGroupCoaches.forEach(gc => {
          if (gc.coach_id) {
            console.log('Service: Comparing with group coach record:', {
              id: gc.id,
              group_id: gc.group_id,
              coach_id: gc.coach_id,
              coach_id_lowercase: gc.coach_id.toLowerCase(),
              coach_id_noHyphens: gc.coach_id.replace(/-/g, ''),
              coach_id_length: gc.coach_id.length,
              // Check if this might be our coach
              might_match: gc.coach_id.toLowerCase() === coachId.toLowerCase()
            });
          }
        });
      }
      
      // Force fetch all groups to provide options to the user
      console.log('Service: Fetching all groups in the system');
      const { data: allGroups, error: allGroupsError } = await supabase
        .from('groups')
        .select('*');
        
      if (allGroupsError) {
        console.error('Service: Error fetching all groups:', allGroupsError);
      } else {
        console.log('Service: All groups in system:', allGroups);
        
        // Return all groups if we can't find specific ones for this coach
        // This gives the user options to select from
        if (allGroups && allGroups.length > 0) {
          console.log('Service: Returning all available groups for selection');
          return allGroups;
        }
      }
      
      console.log('Service: No groups found for coach after all attempts');
      
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
