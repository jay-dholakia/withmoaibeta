
import { supabase } from '@/integrations/supabase/client';
import { fetchGroupLeaderboard as fetchGroupLeaderboardFromClient } from './clients/group-leaderboard';

/**
 * Fetch group leaderboard data for all groups
 * This is used by admin dashboards to show data for multiple groups
 */
export const fetchAllGroupsLeaderboard = async () => {
  const { data: user } = await supabase.auth.getUser();
  if (!user || !user.user) throw new Error('Not authenticated');

  // Ensure user is an admin
  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', {
    check_user_id: user.user.id
  });

  if (adminError || !isAdmin) {
    throw new Error('Unauthorized access - admin privileges required');
  }

  // Use a direct query instead of RPC
  const { data: groups, error } = await supabase
    .from('groups')
    .select(`
      id,
      name,
      description,
      created_at,
      group_members:group_members(
        user_id,
        fire_badges:user_id(id)
      )
    `);
  
  if (error) {
    console.error('Error fetching group leaderboard data:', error);
    throw new Error(error.message);
  }

  // Process the data to include fire badge counts
  const processedGroups = groups.map(group => {
    let totalFireBadges = 0;
    const members = group.group_members || [];
    
    members.forEach(member => {
      if (member.fire_badges) {
        totalFireBadges += member.fire_badges.length;
      }
    });

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      created_at: group.created_at,
      member_count: members.length,
      fire_badges_count: totalFireBadges
    };
  });

  return processedGroups;
};

// Re-export client leaderboard functions for backward compatibility
export { fetchGroupLeaderboardFromClient as fetchGroupLeaderboard };
export type { GroupLeaderboardItem } from './clients/group-leaderboard';
