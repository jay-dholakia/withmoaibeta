
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
    user_id: user.user.id
  });

  if (adminError || !isAdmin) {
    throw new Error('Unauthorized access - admin privileges required');
  }

  // We use RPC to get the data from the server to ensure proper RLS checks
  const { data: groups, error } = await supabase.rpc('get_groups_with_fire_badges');
  
  if (error) {
    console.error('Error fetching group leaderboard data:', error);
    throw new Error(error.message);
  }

  return groups;
};

// Re-export client leaderboard functions for backward compatibility
export { fetchGroupLeaderboardFromClient as fetchGroupLeaderboard };
export { GroupLeaderboardItem } from './clients/group-leaderboard';
