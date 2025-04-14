
import { supabase } from '@/integrations/supabase/client';
import { formatInTimeZone } from 'date-fns-tz';

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
    const today = new Date();
    // Get the date in Pacific Time
    const todayPT = formatInTimeZone(today, 'America/Los_Angeles', 'yyyy-MM-dd');
    
    // Create a Date object for the current date in Pacific Time
    const datePT = new Date(todayPT);
    
    // Calculate Monday of the current week (weekStartsOn: 1 for Monday)
    const dayOfWeek = datePT.getDay(); 
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If today is Sunday, it's 6 days from Monday
    
    // Create a Date object for the start of week in Pacific Time
    const startOfWeekPT = new Date(datePT);
    startOfWeekPT.setDate(datePT.getDate() - daysFromMonday);
    startOfWeekPT.setHours(0, 0, 0, 0);
    
    // Format the startOfWeek in ISO format to use in queries
    const startOfWeekISO = startOfWeekPT.toISOString();
    
    console.log('Using Pacific Time week starting:', startOfWeekISO);
    
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
      const { data: workoutCompletions, error: workoutError } = await supabase
        .from('workout_completions')
        .select('completed_at')
        .eq('user_id', clientId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1);
        
      if (workoutError) {
        console.error(`Error fetching last workout for client ${clientId}:`, workoutError);
      }
      
      const lastWorkoutDate = workoutCompletions && workoutCompletions.length > 0 
        ? workoutCompletions[0].completed_at 
        : null;
      
      // Get assigned workouts completed this week - using Pacific Time week boundaries
      const { count: assignedWorkoutsThisWeek, error: assignedError } = await supabase
        .from('workout_completions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', clientId)
        .not('workout_id', 'is', null)
        .not('completed_at', 'is', null)
        .gte('completed_at', startOfWeekISO);
        
      if (assignedError) {
        console.error(`Error fetching assigned workouts for client ${clientId}:`, assignedError);
      }
      
      // Get activities logged this week - using Pacific Time week boundaries
      const { count: activitiesThisWeek, error: activitiesWeekError } = await supabase
        .from('workout_completions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', clientId)
        .not('completed_at', 'is', null)
        .gte('completed_at', startOfWeekISO);
        
      if (activitiesWeekError) {
        console.error(`Error fetching weekly activities for client ${clientId}:`, activitiesWeekError);
      }
      
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
        assigned_workouts_this_week: assignedWorkoutsThisWeek || 0,
        activities_this_week: activitiesThisWeek || 0,
        total_activities: totalActivities || 0
      });
    }
    
    return clientStats;
  } catch (error) {
    console.error('Error in fetchClientWorkoutStats:', error);
    throw error;
  }
};
