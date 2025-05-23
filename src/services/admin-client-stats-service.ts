
import { supabase } from '@/integrations/supabase/client';
import { formatInTimeZone } from 'date-fns-tz';
import { startOfWeek, addDays, format } from 'date-fns';

interface ClientStat {
  id: string;
  groups: { id: string; name: string }[];
  last_workout_date: string | null;
  assigned_workouts_this_week: number;
  activities_this_week: number;
  total_activities: number;
}

/**
 * Fetches workout statistics for all clients
 */
export const fetchClientWorkoutStats = async (): Promise<ClientStat[]> => {
  try {
    // Get today's date in Pacific Time
    const now = new Date();
    const todayPT = formatInTimeZone(now, 'America/Los_Angeles', 'yyyy-MM-dd');
    console.log('Today in Pacific Time:', todayPT);
    
    // Create a Date object for the current date in Pacific Time
    const datePT = new Date(todayPT + 'T00:00:00');
    
    // Calculate the day of week in Pacific Time (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = datePT.getDay(); 
    
    // Calculate days from Monday (if today is Sunday, it's 6 days from Monday)
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    // Calculate the Monday of the current week
    const startOfWeekPT = new Date(datePT);
    startOfWeekPT.setDate(datePT.getDate() - daysFromMonday);
    startOfWeekPT.setHours(0, 0, 0, 0);
    
    // Format the startOfWeek in ISO format to use in queries
    const startOfWeekISO = startOfWeekPT.toISOString();
    
    // Calculate end of week (Sunday)
    const endOfWeekPT = new Date(startOfWeekPT);
    endOfWeekPT.setDate(startOfWeekPT.getDate() + 7);
    const endOfWeekISO = endOfWeekPT.toISOString();
    
    console.log('Week (Pacific Time):', format(startOfWeekPT, 'yyyy-MM-dd'), 'to', format(endOfWeekPT, 'yyyy-MM-dd'));
    console.log('Week start ISO:', startOfWeekISO);
    console.log('Week end ISO:', endOfWeekISO);
    
    // Get all clients
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_type', 'client');
    
    if (profilesError) {
      console.error('Error fetching client profiles:', profilesError);
      throw profilesError;
    }
    
    if (!profiles || profiles.length === 0) {
      return [];
    }
    
    const clientIds = profiles.map(profile => profile.id);
    const clientStats: ClientStat[] = [];
    
    // For each client, get their workout and activity data
    for (const clientId of clientIds) {
      // Get client's groups
      const { data: groupMembers, error: groupError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', clientId);
        
      if (groupError) {
        console.error(`Error fetching groups for client ${clientId}:`, groupError);
      }
      
      const groupIds = groupMembers?.map(gm => gm.group_id) || [];
      
      // Get group names
      let groups: { id: string; name: string }[] = [];
      if (groupIds.length > 0) {
        const { data: groupData, error: groupDataError } = await supabase
          .from('groups')
          .select('id, name')
          .in('id', groupIds);
          
        if (groupDataError) {
          console.error(`Error fetching group info for client ${clientId}:`, groupDataError);
        } else {
          groups = groupData || [];
        }
      }
      
      // Get client's last workout date
      const { data: lastWorkout, error: lastWorkoutError } = await supabase
        .from('workout_completions')
        .select('completed_at')
        .eq('user_id', clientId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1);
        
      if (lastWorkoutError) {
        console.error(`Error fetching last workout for client ${clientId}:`, lastWorkoutError);
      }
      
      const lastWorkoutDate = lastWorkout && lastWorkout.length > 0 
        ? lastWorkout[0].completed_at 
        : null;
      
      // Get workouts completed this week - both assigned and custom
      const { data: weeklyWorkouts, error: weeklyWorkoutsError } = await supabase
        .from('workout_completions')
        .select('id, workout_id')
        .eq('user_id', clientId)
        .not('completed_at', 'is', null)
        .gte('completed_at', startOfWeekISO)
        .lt('completed_at', endOfWeekISO);
        
      if (weeklyWorkoutsError) {
        console.error(`Error fetching weekly workouts for client ${clientId}:`, weeklyWorkoutsError);
      }
      
      // Count assigned workouts (those with a workout_id)
      const assignedWorkoutsThisWeek = weeklyWorkouts 
        ? weeklyWorkouts.filter(w => w.workout_id !== null).length 
        : 0;
      
      // Total activities this week includes all workout completions
      const activitiesThisWeek = weeklyWorkouts ? weeklyWorkouts.length : 0;
      
      // Get total activities all time
      const { count: totalActivities, error: totalError } = await supabase
        .from('workout_completions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', clientId)
        .not('completed_at', 'is', null);
        
      if (totalError) {
        console.error(`Error fetching total activities for client ${clientId}:`, totalError);
      }
      
      clientStats.push({
        id: clientId,
        groups,
        last_workout_date: lastWorkoutDate,
        assigned_workouts_this_week: assignedWorkoutsThisWeek,
        activities_this_week: activitiesThisWeek,
        total_activities: totalActivities || 0
      });
    }
    
    return clientStats;
  } catch (error) {
    console.error('Error in fetchClientWorkoutStats:', error);
    throw error;
  }
};
