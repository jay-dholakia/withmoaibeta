
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, format, subWeeks } from 'date-fns';

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
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekStartDate = format(monday, 'yyyy-MM-dd');
    const lastWeek = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
    const lastWeekStartDate = format(lastWeek, 'yyyy-MM-dd');

    // First check if there are any existing pairings
    const { data: existingPairings, error: checkError } = await supabase
      .from('accountability_buddies')
      .select('id')
      .eq('group_id', groupId)
      .eq('week_start', weekStartDate);

    if (checkError) {
      console.error('Error checking existing pairings:', checkError);
      return false;
    }

    // If pairings exist and we need to regenerate, delete them first
    if (existingPairings && existingPairings.length > 0) {
      if (!forceRegenerate) {
        console.log('Weekly pairings already exist for this group');
        return true;
      }

      // Delete existing pairings for this week before creating new ones
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

    // Get all members of this group
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

    const memberIds = groupMembers.map(member => member.user_id);

    // Get last week's pairings to avoid repeats
    const { data: lastWeekPairings, error: lastWeekError } = await supabase
      .from('accountability_buddies')
      .select('user_id_1, user_id_2, user_id_3')
      .eq('group_id', groupId)
      .eq('week_start', lastWeekStartDate);

    if (lastWeekError) {
      console.error("Error fetching last week's pairings:", lastWeekError);
      return false;
    }

    // Create a set of last week's pairs for quick lookup
    const lastWeekPairs = new Set<string>();
    if (lastWeekPairings) {
      lastWeekPairings.forEach(p => {
        const ids = [p.user_id_1, p.user_id_2, p.user_id_3].filter(Boolean);
        if (ids.length === 2) {
          lastWeekPairs.add(ids.sort().join('-'));
        } else if (ids.length === 3) {
          lastWeekPairs.add([ids[0], ids[1]].sort().join('-'));
          lastWeekPairs.add([ids[0], ids[2]].sort().join('-'));
          lastWeekPairs.add([ids[1], ids[2]].sort().join('-'));
        }
      });
    }

    // Make several attempts to create pairings without repeating last week's
    let attempts = 0;
    let pairings: any[] = [];
    
    while (attempts < 10) {
      attempts++;
      const shuffled = [...memberIds].sort(() => Math.random() - 0.5);
      const tempPairs: any[] = [];
      let repeatFound = false;

      // Handle even number of members - create pairs
      if (shuffled.length % 2 === 0) {
        for (let i = 0; i < shuffled.length; i += 2) {
          const ids = [shuffled[i], shuffled[i + 1]].sort();
          if (lastWeekPairs.has(ids.join('-'))) {
            repeatFound = true;
            break;
          }
          tempPairs.push({
            group_id: groupId,
            user_id_1: ids[0],
            user_id_2: ids[1],
            user_id_3: null,
            week_start: weekStartDate
          });
        }
      } else {
        // Handle odd number of members - create one trio and pairs
        const trio = shuffled.slice(0, 3);
        const rest = shuffled.slice(3);
        const trioCombos = [
          [trio[0], trio[1]],
          [trio[0], trio[2]],
          [trio[1], trio[2]]
        ].map(pair => pair.sort().join('-'));

        if (trioCombos.some(combo => lastWeekPairs.has(combo))) {
          repeatFound = true;
        } else {
          tempPairs.push({
            group_id: groupId,
            user_id_1: trio[0],
            user_id_2: trio[1],
            user_id_3: trio[2],
            week_start: weekStartDate
          });

          for (let i = 0; i < rest.length; i += 2) {
            if (i + 1 < rest.length) {
              const ids = [rest[i], rest[i + 1]].sort();
              if (lastWeekPairs.has(ids.join('-'))) {
                repeatFound = true;
                break;
              }
              tempPairs.push({
                group_id: groupId,
                user_id_1: ids[0],
                user_id_2: ids[1],
                user_id_3: null,
                week_start: weekStartDate
              });
            }
          }
        }
      }

      if (!repeatFound) {
        pairings = tempPairs;
        break;
      }
    }

    if (pairings.length > 0) {
      // First, ensure all existing pairings are truly deleted
      const { data: remainingPairings } = await supabase
        .from('accountability_buddies')
        .select('id')
        .eq('group_id', groupId)
        .eq('week_start', weekStartDate);
        
      if (remainingPairings && remainingPairings.length > 0) {
        console.log('Found remaining pairings, retrying delete...');
        await supabase
          .from('accountability_buddies')
          .delete()
          .eq('group_id', groupId)
          .eq('week_start', weekStartDate);
      }
      
      // Try bulk insert first - this is more efficient if it works
      try {
        const { error: bulkInsertError } = await supabase
          .from('accountability_buddies')
          .insert(pairings);
          
        if (!bulkInsertError) {
          console.log('Successfully created buddy pairings for the week');
          return true;
        } else {
          console.log('Bulk insert failed, falling back to individual inserts');
        }
      } catch (bulkError) {
        console.error('Bulk insert error:', bulkError);
      }
      
      // Fall back to individual inserts if bulk insert fails
      let successCount = 0;
      for (const pairing of pairings) {
        try {
          const { error: insertError } = await supabase
            .from('accountability_buddies')
            .insert(pairing);
            
          if (!insertError) {
            successCount++;
          } else {
            console.error('Error creating buddy pairing:', insertError, pairing);
          }
        } catch (err) {
          console.error('Unexpected error inserting pairing:', err);
        }
      }
      
      if (successCount > 0) {
        console.log(`Successfully created ${successCount} buddy pairings`);
        return true;
      } else {
        console.error('No buddy pairings were created');
        return false;
      }
    } else {
      console.error('No valid buddy pairings could be generated');
      return false;
    }
  } catch (err) {
    console.error('Unexpected error in generateWeeklyBuddies:', err);
    return false;
  }
};
