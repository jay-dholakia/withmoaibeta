import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, format } from 'date-fns';

export interface AccountabilityBuddy {
  id: string;
  group_id: string;
  user_id_1: string;
  user_id_2: string;
  user_id_3: string | null;
  week_start: string;
  created_at: string;
  updated_at: string;
}

export interface BuddyDisplayInfo {
  userId: string;
  name: string;
  avatarUrl: string | null;
  firstName: string | null;
  lastName: string | null;
}

/**
 * Get the current week's accountability buddy pairing for a specific group
 * @param groupId The ID of the group
 */
export const getGroupWeeklyBuddies = async (
  groupId: string
): Promise<AccountabilityBuddy[]> => {
  try {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekStartDate = format(monday, 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('accountability_buddies')
      .select('*')
      .eq('group_id', groupId)
      .eq('week_start', weekStartDate);
      
    if (error) {
      console.error('Error fetching accountability buddies:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Unexpected error in getGroupWeeklyBuddies:', err);
    return [];
  }
};

/**
 * Get the current user's accountability buddy
 * @param groupId The ID of the group
 * @param userId The current user's ID
 */
export const getUserBuddies = async (
  groupId: string,
  userId: string
): Promise<BuddyDisplayInfo[]> => {
  try {
    const buddyPairings = await getGroupWeeklyBuddies(groupId);
    
    if (!buddyPairings || buddyPairings.length === 0) {
      return [];
    }
    
    // Find the pairing that includes the current user
    const userPairing = buddyPairings.find(
      pairing => 
        pairing.user_id_1 === userId || 
        pairing.user_id_2 === userId ||
        pairing.user_id_3 === userId
    );
    
    if (!userPairing) {
      return [];
    }
    
    // Get the buddy IDs (not the current user)
    const buddyIds = [
      userPairing.user_id_1,
      userPairing.user_id_2,
      userPairing.user_id_3
    ].filter(id => id && id !== userId) as string[];
    
    if (buddyIds.length === 0) {
      return [];
    }
    
    // Fetch profile info for the buddies
    const { data: profiles, error } = await supabase
      .from('client_profiles')
      .select('id, first_name, last_name, avatar_url')
      .in('id', buddyIds);
      
    if (error) {
      console.error('Error fetching buddy profiles:', error);
      return [];
    }
    
    return profiles.map(profile => ({
      userId: profile.id,
      name: [profile.first_name, profile.last_name]
        .filter(Boolean)
        .join(' ') || 'Unknown User',
      avatarUrl: profile.avatar_url,
      firstName: profile.first_name,
      lastName: profile.last_name
    }));
  } catch (err) {
    console.error('Unexpected error in getUserBuddy:', err);
    return [];
  }
};

/**
 * Create or update weekly accountability buddy pairings for a group
 * @param groupId The ID of the group
 * @param forceRegenerate If true, will delete existing pairings for this week and regenerate
 */
export const generateWeeklyBuddies = async (
  groupId: string, 
  forceRegenerate: boolean = true
): Promise<boolean> => {
  try {
    // Get the start of the current week (Monday)
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekStartDate = format(monday, 'yyyy-MM-dd');
    
    // Check if pairings already exist for this week
    const { data: existingPairings, error: checkError } = await supabase
      .from('accountability_buddies')
      .select('id')
      .eq('group_id', groupId)
      .eq('week_start', weekStartDate);
      
    if (checkError) {
      console.error('Error checking existing pairings:', checkError);
      return false;
    }
    
    // If pairings exist and we don't want to force regeneration, return early
    if (existingPairings && existingPairings.length > 0) {
      if (!forceRegenerate) {
        console.log('Weekly pairings already exist for this group');
        return true;
      }
      
      // Delete existing pairings for this week and group
      const { error: deleteError } = await supabase
        .from('accountability_buddies')
        .delete()
        .eq('group_id', groupId)
        .eq('week_start', weekStartDate);
        
      if (deleteError) {
        console.error('Error deleting existing buddy pairings:', deleteError);
        return false;
      }
      
      console.log('Deleted existing buddy pairings for regeneration');
    }
    
    // Get all group members
    const { data: groupMembers, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);
      
    if (membersError) {
      console.error('Error fetching group members:', membersError);
      return false;
    }
    
    if (!groupMembers || groupMembers.length < 2) {
      console.log('Not enough members for buddy pairing');
      return false;
    }
    
    // Extract member IDs and shuffle them
    const memberIds = groupMembers.map(member => member.user_id);
    const shuffledMembers = [...memberIds].sort(() => Math.random() - 0.5);
    
    // Create pairings
    const pairings = [];
    
    if (shuffledMembers.length % 2 === 0) {
      // Even number of members - simple pairs
      for (let i = 0; i < shuffledMembers.length; i += 2) {
        pairings.push({
          group_id: groupId,
          user_id_1: shuffledMembers[i],
          user_id_2: shuffledMembers[i + 1],
          user_id_3: null,
          week_start: weekStartDate
        });
      }
    } else {
      // Odd number of members - create one triplet
      pairings.push({
        group_id: groupId,
        user_id_1: shuffledMembers[0],
        user_id_2: shuffledMembers[1],
        user_id_3: shuffledMembers[2],
        week_start: weekStartDate
      });
      
      // Create pairs with remaining members
      for (let i = 3; i < shuffledMembers.length; i += 2) {
        if (i + 1 < shuffledMembers.length) {
          pairings.push({
            group_id: groupId,
            user_id_1: shuffledMembers[i],
            user_id_2: shuffledMembers[i + 1],
            user_id_3: null,
            week_start: weekStartDate
          });
        }
      }
    }
    
    // Insert the pairings
    const { error: insertError } = await supabase
      .from('accountability_buddies')
      .insert(pairings);
      
    if (insertError) {
      console.error('Error creating buddy pairings:', insertError);
      return false;
    }
    
    console.log('Successfully created buddy pairings for the week');
    return true;
  } catch (err) {
    console.error('Unexpected error in generateWeeklyBuddies:', err);
    return false;
  }
};
