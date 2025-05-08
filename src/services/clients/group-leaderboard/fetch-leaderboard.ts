
import { supabase } from '@/integrations/supabase/client';
import { GroupLeaderboardItem } from './types';

/**
 * Fetch the leaderboard data for a specific group
 */
export const fetchGroupLeaderboard = async (groupId: string): Promise<GroupLeaderboardItem[]> => {
  // Get the current user to ensure they have access to this group
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error('Not authenticated');

  // Use a simpler query approach instead of RPC
  const { data, error } = await supabase
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
    .eq('group_id', groupId);

  if (error) {
    console.error('Error fetching group members:', error);
    throw error;
  }

  // Get fire badges count for each user
  const memberData = await Promise.all(
    data.map(async (member: any) => {
      const { data: badgesData, error: badgesError } = await supabase
        .from('fire_badges')
        .select('id', { count: 'exact' })
        .eq('user_id', member.user_id);

      if (badgesError) {
        console.error('Error fetching fire badges:', badgesError);
      }

      const badgeCount = badgesData?.length || 0;
      const profile = member.client_profiles || {};
      
      return {
        user_id: member.user_id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        avatar_url: profile.avatar_url,
        fire_badges_count: badgeCount,
        city: profile.city,
        state: profile.state,
      };
    })
  );

  // Sort by fire badge count (descending)
  const sortedData = memberData.sort((a, b) => 
    b.fire_badges_count - a.fire_badges_count
  );

  // Add rank to each item
  return sortedData.map((item: GroupLeaderboardItem, index: number) => ({
    ...item,
    rank: index + 1
  }));
};
