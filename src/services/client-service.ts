
import { supabase } from '@/integrations/supabase/client';
import { GroupData } from '@/types/group';
import { startOfWeek, startOfMonth } from 'date-fns';

export interface LeaderboardEntry {
  user_id: string;
  email: string;
  total_workouts: number;
}

export interface TeamStreakEntry {
  group_id: string;
  group_name: string;
  current_streak: number;
  monthly_perfect_weeks: number;
  all_time_perfect_weeks: number;
}

export interface ClientProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  state?: string;
  birthday?: string;
  height?: string;
  weight?: string;
  fitness_goals?: string[];
  favorite_movements?: string[];
  avatar_url?: string;
  profile_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const fetchClientProfile = async (userId: string): Promise<ClientProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching client profile:', error);
      return null;
    }
    
    return data as ClientProfile;
  } catch (error) {
    console.error('Error in fetchClientProfile:', error);
    return null;
  }
};

export const fetchAllGroups = async (): Promise<GroupData[]> => {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*');

    if (error) {
      console.error('Error fetching groups:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching groups:', error);
    return [];
  }
};

export const fetchGroupLeaderboardWeekly = async (groupId: string): Promise<LeaderboardEntry[]> => {
  try {
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    
    const { data, error } = await supabase
      .rpc('get_group_weekly_leaderboard', { 
        group_id: groupId,
        start_date: currentWeekStart.toISOString()
      });
    
    if (error) {
      console.error('Error fetching weekly leaderboard:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchGroupLeaderboardWeekly:', error);
    return [];
  }
};

export const fetchGroupLeaderboardMonthly = async (groupId: string): Promise<LeaderboardEntry[]> => {
  try {
    const currentMonthStart = startOfMonth(new Date());
    
    const { data, error } = await supabase
      .rpc('get_group_monthly_leaderboard', { 
        group_id: groupId,
        start_date: currentMonthStart.toISOString()
      });
    
    if (error) {
      console.error('Error fetching monthly leaderboard:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchGroupLeaderboardMonthly:', error);
    return [];
  }
};

// New function to fetch team streak data
export const fetchTeamStreaks = async (): Promise<TeamStreakEntry[]> => {
  try {
    // Mock data for now - this would be replaced with actual DB call
    // In a real implementation, this would call a new RPC function that calculates streaks
    const mockTeamStreaks: TeamStreakEntry[] = [
      { 
        group_id: "1", 
        group_name: "Team Alpha", 
        current_streak: 3, 
        monthly_perfect_weeks: 3, 
        all_time_perfect_weeks: 12 
      },
      { 
        group_id: "2", 
        group_name: "Team Beta", 
        current_streak: 2, 
        monthly_perfect_weeks: 2, 
        all_time_perfect_weeks: 8 
      },
      { 
        group_id: "3", 
        group_name: "Team Gamma", 
        current_streak: 1, 
        monthly_perfect_weeks: 1, 
        all_time_perfect_weeks: 5 
      },
      { 
        group_id: "4", 
        group_name: "Team Delta", 
        current_streak: 0, 
        monthly_perfect_weeks: 0, 
        all_time_perfect_weeks: 3 
      }
    ];
    
    return mockTeamStreaks;
  } catch (error) {
    console.error('Error in fetchTeamStreaks:', error);
    return [];
  }
};
