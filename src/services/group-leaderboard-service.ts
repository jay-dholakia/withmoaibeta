
import { supabase } from "@/integrations/supabase/client";

export interface GroupLeaderboardItem {
  id: string;
  name: string;
  description: string | null;
  totalFireBadges: number;
  activeMembersCount: number;
}

/**
 * Fetch groups for the leaderboard, ordered by fire badge count
 */
export const fetchGroupLeaderboard = async (): Promise<GroupLeaderboardItem[]> => {
  try {
    const { data: groupsRaw, error } = await supabase.rpc(
      'get_groups_with_fire_badges'
    );

    if (error) {
      console.error('Error fetching group leaderboard:', error);
      return [];
    }

    // Format the data to match the GroupLeaderboardItem interface
    const formattedGroups: GroupLeaderboardItem[] = groupsRaw.map((group: any) => ({
      id: group.group_id,
      name: group.group_name,
      description: group.group_description,
      totalFireBadges: parseInt(group.total_fire_badges) || 0,
      activeMembersCount: parseInt(group.active_members_count) || 0
    }));

    // Sort groups by total fire badges in descending order
    return formattedGroups.sort((a, b) => b.totalFireBadges - a.totalFireBadges);
  } catch (error) {
    console.error('Error in fetchGroupLeaderboard:', error);
    return [];
  }
};

/**
 * Fetch members of a group with their fire badge counts
 */
export const fetchGroupMembersWithBadges = async (groupId: string) => {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        user_id,
        user:user_id (
          email
        ),
        client_profiles:user_id (
          first_name,
          last_name,
          avatar_url
        ),
        fire_badges:user_id (
          id
        )
      `)
      .eq('group_id', groupId);

    if (error) {
      console.error('Error fetching group members:', error);
      throw error;
    }

    // Process and format the data
    return data.map((member: any) => {
      const profile = member.client_profiles;
      const firstName = profile?.first_name || '';
      const lastName = profile?.last_name || '';
      const displayName = firstName && lastName 
        ? `${firstName} ${lastName}` 
        : member.user?.email?.split('@')[0] || 'Unknown User';
      
      return {
        id: member.user_id,
        name: displayName,
        email: member.user?.email,
        profile_picture_url: profile?.avatar_url || '',
        fire_badges_count: (member.fire_badges || []).length,
      };
    });
  } catch (error) {
    console.error('Error in fetchGroupMembersWithBadges:', error);
    throw error;
  }
};
