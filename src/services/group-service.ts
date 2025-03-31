
/**
 * Group service for managing groups and leaderboards
 */

import { supabase } from "@/integrations/supabase/client";

// Raw database group type that matches actual database columns
interface RawGroup {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  description?: string | null;
}

// Define the GroupData interface to explicitly include coach_id
export interface GroupData {
  id: string;
  name: string;
  coach_id: string;
  created_at: string;
  created_by: string;
  description?: string | null;
}

export interface LeaderboardEntry {
  user_id: string;
  email: string;
  total_workouts: number;
}

/**
 * Fetches all groups
 */
export const fetchAllGroups = async (coachId?: string) => {
  try {
    // Create the base query without executing it yet
    let queryBuilder = supabase
      .from('groups')
      .select('*');
    
    // Add coach filter if provided
    if (coachId) {
      queryBuilder = queryBuilder.eq('coach_id', coachId);
    }
    
    // Execute the query
    const { data, error } = await queryBuilder.order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching groups:", error);
      throw error;
    }
    
    // Transform the data to our GroupData interface
    const groups: GroupData[] = (data || []).map((item: RawGroup) => ({
      id: item.id,
      name: item.name,
      coach_id: coachId || item.created_by, // Use created_by as fallback
      created_at: item.created_at,
      created_by: item.created_by,
      description: item.description
    }));
    
    return groups;
  } catch (error) {
    console.error("Error in fetchAllGroups:", error);
    throw error;
  }
};

/**
 * Fetches the weekly group leaderboard
 */
export const fetchGroupLeaderboardWeekly = async (groupId: string) => {
  try {
    // This is a simplified implementation. In a real app, you would 
    // fetch this data from a view or function in your database
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const { data: groupMembers, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);
    
    if (membersError) {
      console.error("Error fetching group members:", membersError);
      throw membersError;
    }
    
    const memberIds = groupMembers.map(m => m.user_id);
    
    if (memberIds.length === 0) {
      return [];
    }
    
    // Get user emails
    const { data: users, error: usersError } = await supabase.rpc('get_users_email', {
      user_ids: memberIds
    });
    
    if (usersError) {
      console.error("Error fetching user emails:", usersError);
      throw usersError;
    }
    
    const emailMap = users.reduce((map: Record<string, string>, user: any) => {
      map[user.id] = user.email;
      return map;
    }, {});
    
    // Count workouts completed this week per user
    const { data: workouts, error: workoutsError } = await supabase
      .from('workout_completions')
      .select('user_id, count')
      .in('user_id', memberIds)
      .gte('completed_at', startOfWeek.toISOString())
      .not('completed_at', 'is', null)
      .order('count', { ascending: false });
    
    if (workoutsError) {
      console.error("Error counting workouts:", workoutsError);
      throw workoutsError;
    }
    
    // Transform to leaderboard entries
    const leaderboard: LeaderboardEntry[] = [];
    
    for (const user_id of memberIds) {
      const workoutCount = workouts.find(w => w.user_id === user_id)?.count || 0;
      leaderboard.push({
        user_id,
        email: emailMap[user_id] || 'Unknown',
        total_workouts: Number(workoutCount)
      });
    }
    
    return leaderboard.sort((a, b) => b.total_workouts - a.total_workouts);
  } catch (error) {
    console.error("Error in fetchGroupLeaderboardWeekly:", error);
    throw error;
  }
};

/**
 * Fetches the monthly group leaderboard
 */
export const fetchGroupLeaderboardMonthly = async (groupId: string) => {
  try {
    // Similar to weekly, but with month timeframe
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const { data: groupMembers, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);
    
    if (membersError) {
      console.error("Error fetching group members:", membersError);
      throw membersError;
    }
    
    const memberIds = groupMembers.map(m => m.user_id);
    
    if (memberIds.length === 0) {
      return [];
    }
    
    // Get user emails
    const { data: users, error: usersError } = await supabase.rpc('get_users_email', {
      user_ids: memberIds
    });
    
    if (usersError) {
      console.error("Error fetching user emails:", usersError);
      throw usersError;
    }
    
    const emailMap = users.reduce((map: Record<string, string>, user: any) => {
      map[user.id] = user.email;
      return map;
    }, {});
    
    // Count workouts completed this month per user
    const { data: workouts, error: workoutsError } = await supabase
      .from('workout_completions')
      .select('user_id, count')
      .in('user_id', memberIds)
      .gte('completed_at', startOfMonth.toISOString())
      .not('completed_at', 'is', null)
      .order('count', { ascending: false });
    
    if (workoutsError) {
      console.error("Error counting workouts:", workoutsError);
      throw workoutsError;
    }
    
    // Transform to leaderboard entries
    const leaderboard: LeaderboardEntry[] = [];
    
    for (const user_id of memberIds) {
      const workoutCount = workouts.find(w => w.user_id === user_id)?.count || 0;
      leaderboard.push({
        user_id,
        email: emailMap[user_id] || 'Unknown',
        total_workouts: Number(workoutCount)
      });
    }
    
    return leaderboard.sort((a, b) => b.total_workouts - a.total_workouts);
  } catch (error) {
    console.error("Error in fetchGroupLeaderboardMonthly:", error);
    throw error;
  }
};
