
import { supabase } from '@/integrations/supabase/client';

/**
 * Represents a leaderboard item for a group member
 */
export interface GroupLeaderboardItem {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  fire_badges_count: number;
  rank?: number;
  profile_id?: string;
  completion_streak?: number;
  city?: string | null;
  state?: string | null;
}

/**
 * Fetch the leaderboard data for a specific group
 */
export const fetchGroupLeaderboard = async (groupId: string): Promise<GroupLeaderboardItem[]> => {
  // Get the current user to ensure they have access to this group
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('group_leaderboard')
    .select('*')
    .eq('group_id', groupId)
    .order('fire_badges_count', { ascending: false });

  if (error) {
    console.error('Error fetching group leaderboard:', error);
    throw error;
  }

  // Add rank to each item based on fire_badges_count
  return data.map((item, index) => ({
    ...item,
    rank: index + 1
  })) as GroupLeaderboardItem[];
};
