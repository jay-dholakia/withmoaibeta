
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
  buddy_pairing_id: string;
}

export interface BuddyDisplayInfo {
  userId: string;
  name: string;
  avatarUrl: string | null;
  firstName: string | null;
  lastName: string | null;
}

/**
 * Get the current week's start date (Monday) in YYYY-MM-DD format
 */
export const getCurrentWeekStart = (): string => {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  return format(monday, 'yyyy-MM-dd');
};

export const getGroupWeeklyBuddies = async (
  groupId: string
): Promise<AccountabilityBuddy[]> => {
  try {
    const weekStartDate = getCurrentWeekStart();

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

export const getUserBuddies = async (
  groupId: string,
  userId: string
): Promise<BuddyDisplayInfo[]> => {
  try {
    const buddyPairings = await getGroupWeeklyBuddies(groupId);

    if (!buddyPairings || buddyPairings.length === 0) {
      return [];
    }

    const userPairing = buddyPairings.find(
      pairing =>
        pairing.user_id_1 === userId ||
        pairing.user_id_2 === userId ||
        pairing.user_id_3 === userId
    );

    if (!userPairing) {
      return [];
    }

    const buddyIds = [
      userPairing.user_id_1,
      userPairing.user_id_2,
      userPairing.user_id_3
    ].filter(id => id && id !== userId) as string[];

    if (buddyIds.length === 0) {
      return [];
    }

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

export const generateWeeklyBuddies = async (
  groupId: string,
  forceRegenerate: boolean = true
): Promise<boolean> => {
  try {
    const weekStartDate = getCurrentWeekStart();
    console.log(`Generating buddies for week starting ${weekStartDate}`);

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

    console.log(`Found ${groupMembers.length} members for group ${groupId}`);

    // Delete existing pairings for this week if forceRegenerate is true
    if (forceRegenerate) {
      console.log(`Force regenerate is ${forceRegenerate}, deleting existing pairings`);
      const { error: deleteError } = await supabase
        .from('accountability_buddies')
        .delete()
        .eq('group_id', groupId)
        .eq('week_start', weekStartDate);

      if (deleteError) {
        console.error('Error deleting existing buddy pairings:', deleteError);
        return false;
      }
    } else {
      // Check if pairings already exist
      const { data: existingPairings, error: checkError } = await supabase
        .from('accountability_buddies')
        .select('id')
        .eq('group_id', groupId)
        .eq('week_start', weekStartDate);
        
      if (checkError) {
        console.error('Error checking existing pairings:', checkError);
        return false;
      }
      
      if (existingPairings && existingPairings.length > 0) {
        console.log('Pairings already exist for this week and force regenerate is false');
        return true; // Pairings exist and we're not forcing regeneration
      }
    }

    const memberIds = groupMembers.map(member => member.user_id);
    // Shuffle the array of member IDs for random pairing
    const shuffled = [...memberIds].sort(() => Math.random() - 0.5);
    const pairings: any[] = [];

    console.log(`Creating pairings for ${shuffled.length} shuffled members`);

    // Handle groups with odd number of members
    if (shuffled.length % 2 !== 0) {
      const trio = shuffled.slice(0, 3);
      const rest = shuffled.slice(3);

      console.log(`Odd number of members. Creating trio with: ${trio.join(', ')}`);
      
      pairings.push({
        group_id: groupId,
        user_id_1: trio[0],
        user_id_2: trio[1],
        user_id_3: trio[2],
        week_start: weekStartDate
      });

      for (let i = 0; i < rest.length; i += 2) {
        if (i + 1 < rest.length) {
          console.log(`Creating pair with: ${rest[i]} and ${rest[i + 1]}`);
          pairings.push({
            group_id: groupId,
            user_id_1: rest[i],
            user_id_2: rest[i + 1],
            user_id_3: null,
            week_start: weekStartDate
          });
        }
      }
    } else {
      // Even number of members - create pairs
      for (let i = 0; i < shuffled.length; i += 2) {
        console.log(`Creating pair with: ${shuffled[i]} and ${shuffled[i + 1]}`);
        pairings.push({
          group_id: groupId,
          user_id_1: shuffled[i],
          user_id_2: shuffled[i + 1],
          user_id_3: null,
          week_start: weekStartDate
        });
      }
    }

    console.log(`Inserting ${pairings.length} buddy pairings`);

    // Insert all pairings one by one to better identify issues
    for (const pairing of pairings) {
      const { error: insertError } = await supabase
        .from('accountability_buddies')
        .insert(pairing);
        
      if (insertError) {
        console.error('Error inserting buddy pairing:', insertError, 'Pairing data:', pairing);
        return false;
      }
    }
      
    console.log('Successfully inserted all buddy pairings');
    return true;
  } catch (err) {
    console.error('Unexpected error in generateWeeklyBuddies:', err);
    return false;
  }
};
