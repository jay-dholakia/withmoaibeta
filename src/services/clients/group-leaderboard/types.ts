
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
