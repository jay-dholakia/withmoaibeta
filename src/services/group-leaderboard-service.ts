
import { supabase } from "@/integrations/supabase/client";

export interface GroupLeaderboardItem {
  id: string;
  name: string;
  total_fire_badges: number;
  rank?: number;
  members?: MemberLeaderboardItem[];
}

export interface MemberLeaderboardItem {
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  fire_badges_count: number;
  city?: string | null;
  state?: string | null;
  completion_streak?: number;
}

/**
 * Fetches all groups ranked by their total fire badges
 */
export const fetchGroupLeaderboard = async (): Promise<GroupLeaderboardItem[]> => {
  try {
    // First fetch all groups
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name');
    
    if (groupsError) {
      console.error('Error fetching groups:', groupsError);
      throw groupsError;
    }
    
    if (!groups || groups.length === 0) {
      return [];
    }

    // For each group, fetch members and their fire badge counts
    const groupsWithBadges = await Promise.all(
      groups.map(async (group) => {
        // Get all members of the group
        const { data: members, error: membersError } = await supabase
          .from('group_members')
          .select(`
            user_id,
            client_profiles:user_id(
              id,
              first_name,
              last_name,
              avatar_url,
              city,
              state
            )
          `)
          .eq('group_id', group.id);
        
        if (membersError) {
          console.error(`Error fetching members for group ${group.id}:`, membersError);
          return {
            ...group,
            total_fire_badges: 0,
            members: []
          };
        }

        if (!members || members.length === 0) {
          return {
            ...group,
            total_fire_badges: 0,
            members: []
          };
        }

        // Get user IDs from members
        const userIds = members.map(member => member.user_id);
        
        // Fetch fire badge counts for each user
        const membersWithBadges = await Promise.all(
          members.map(async (member) => {
            const { data: badgesCount, error: badgeError } = await supabase
              .rpc('count_user_fire_badges', { user_id_param: member.user_id });
            
            if (badgeError) {
              console.error(`Error counting fire badges for user ${member.user_id}:`, badgeError);
            }
            
            const profile = member.client_profiles || {};
            
            return {
              user_id: member.user_id,
              first_name: profile.first_name || 'Unknown',
              last_name: profile.last_name || 'User',
              avatar_url: profile.avatar_url,
              city: profile.city,
              state: profile.state,
              fire_badges_count: badgesCount || 0,
              // Add stub for completion streak - this would need to be calculated
              completion_streak: 0
            };
          })
        );

        // Calculate total fire badges for the group
        const totalFireBadges = membersWithBadges.reduce(
          (sum, member) => sum + member.fire_badges_count, 
          0
        );

        return {
          ...group,
          total_fire_badges: totalFireBadges,
          members: membersWithBadges
        };
      })
    );

    // Sort groups by total fire badges (descending)
    const sortedGroups = groupsWithBadges.sort(
      (a, b) => b.total_fire_badges - a.total_fire_badges
    );

    // Add rank to each group
    return sortedGroups.map((group, index) => ({
      ...group,
      rank: index + 1
    }));
  } catch (error) {
    console.error('Error fetching group leaderboard:', error);
    throw error;
  }
};
