import { supabase } from '@/integrations/supabase/client';

export interface GroupLeaderboardItem {
  id: string;
  name: string;
  description?: string;
  totalFireBadges: number;
  activeMembersCount: number;
  iconOrEmoji?: string;
}

/**
 * Fetches the group leaderboard sorted by total fire badges
 */
export const fetchGroupLeaderboard = async (): Promise<GroupLeaderboardItem[]> => {
  try {
    // Get all groups
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, description');

    if (groupsError) {
      console.error('Error fetching groups:', groupsError);
      return [];
    }

    const leaderboardItems: GroupLeaderboardItem[] = [];
    for (const group of groups) {
      // Get members for each group
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', group.id);
      if (membersError) {
        console.error(`Error fetching members for group ${group.id}:`, membersError);
        continue;
      }

      const memberIds = members.map(m => m.user_id);
      if (memberIds.length === 0) {
        continue;
      }

      // Count fire badges
      const { count: totalFireBadges, error: badgesError } = await supabase
        .from('fire_badges')
        .select('id', { count: 'exact', head: false })
        .in('user_id', memberIds);
      if (badgesError) {
        console.error(`Error fetching fire badges for group ${group.id}:`, badgesError);
        continue;
      }

      leaderboardItems.push({
        id: group.id,
        name: group.name,
        description: group.description,
        totalFireBadges: totalFireBadges || 0,
        activeMembersCount: memberIds.length,
      });
    }

    return leaderboardItems.sort((a, b) => b.totalFireBadges - a.totalFireBadges);
  } catch (error) {
    console.error('Error in fetchGroupLeaderboard:', error);
    return [];
  }
};
