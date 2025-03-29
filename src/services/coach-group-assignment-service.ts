
import { supabase } from '@/integrations/supabase/client';
import { ensureCoachGroupAssignment } from './coach-group-service';

/**
 * Sync coach email with group assignments
 * Ensures that a coach with a specific email has the correct group assignments
 */
export const syncCoachEmailWithGroups = async () => {
  try {
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    const userEmail = session?.user?.email;
    const userId = session?.user?.id;
    
    if (!userEmail || !userId) {
      console.error('Cannot sync coach email with groups: No active session');
      return { success: false, message: 'No active user session' };
    }
    
    console.log(`Syncing groups for coach email: ${userEmail} with ID: ${userId}`);
    
    // Special handling for jdholakia12@gmail.com
    if (userEmail === 'jdholakia12@gmail.com') {
      return await handleMoaiCoachSync(userId);
    }
    
    // For other coaches, make sure they have at least one group assignment
    return await handleRegularCoachSync(userId, userEmail);
  } catch (error) {
    console.error('Error in syncCoachEmailWithGroups:', error);
    return { success: false, message: 'Failed to sync coach email with groups', error };
  }
};

/**
 * Handle Moai coach specific synchronization
 */
const handleMoaiCoachSync = async (coachId: string) => {
  // Find Moai groups
  const { data: moaiGroups, error: moaiError } = await supabase
    .from('groups')
    .select('*')
    .ilike('name', 'Moai%');
  
  if (moaiError) {
    console.error('Error finding Moai groups:', moaiError);
    return { success: false, message: 'Error finding Moai groups' };
  }
  
  // Create a Moai group if none exists
  if (!moaiGroups || moaiGroups.length === 0) {
    console.log('No Moai groups found, creating one');
    
    const { data: newGroup, error: createError } = await supabase
      .from('groups')
      .insert({
        name: 'Moai - Default',
        description: 'Default group for Moai coach',
        created_by: coachId
      })
      .select();
    
    if (createError) {
      console.error('Error creating Moai group:', createError);
      return { success: false, message: 'Failed to create Moai group' };
    }
    
    if (newGroup && newGroup.length > 0) {
      // Assign coach to the new group
      await ensureCoachGroupAssignment(coachId, newGroup[0].id);
      return { 
        success: true, 
        message: 'Created and assigned new Moai group', 
        data: newGroup[0] 
      };
    }
  } else {
    // Ensure the coach is assigned to all Moai groups
    let allAssigned = true;
    for (const group of moaiGroups) {
      const assigned = await ensureCoachGroupAssignment(coachId, group.id);
      if (!assigned) allAssigned = false;
    }
    
    return { 
      success: allAssigned, 
      message: allAssigned ? 'Successfully synced all Moai group assignments' : 'Some assignments failed',
      data: moaiGroups
    };
  }
  
  return { success: false, message: 'Failed to sync Moai coach groups' };
};

/**
 * Handle regular coach synchronization
 */
const handleRegularCoachSync = async (coachId: string, coachEmail: string) => {
  // Check if coach already has group assignments
  const { data: groupCoaches } = await supabase
    .from('group_coaches')
    .select('*')
    .eq('coach_id', coachId);
  
  if (!groupCoaches || groupCoaches.length === 0) {
    // This coach has no groups, assign or create one
    const { data: allGroups } = await supabase
      .from('groups')
      .select('*');
    
    if (allGroups && allGroups.length > 0) {
      // Assign to first available group
      const assigned = await ensureCoachGroupAssignment(coachId, allGroups[0].id);
      return {
        success: assigned,
        message: assigned ? 'Coach assigned to existing group' : 'Failed to assign coach to group',
        data: allGroups[0]
      };
    } else {
      // Create a new group
      const { data: newGroup, error: createError } = await supabase
        .from('groups')
        .insert({
          name: `${coachEmail.split('@')[0]}'s Group`,
          description: 'Default coach group',
          created_by: coachId
        })
        .select();
      
      if (createError) {
        console.error('Error creating default group:', createError);
        return { success: false, message: 'Failed to create default group' };
      }
      
      if (newGroup && newGroup.length > 0) {
        const assigned = await ensureCoachGroupAssignment(coachId, newGroup[0].id);
        return {
          success: assigned,
          message: assigned ? 'Created and assigned new group' : 'Created group but failed to assign coach',
          data: newGroup[0]
        };
      }
    }
  }
  
  return { 
    success: true, 
    message: 'Coach already has group assignments', 
    data: groupCoaches 
  };
};
