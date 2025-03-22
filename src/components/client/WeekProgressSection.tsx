
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchClientWorkoutHistory } from '@/services/workout-history-service';
import { supabase } from '@/integrations/supabase/client';
import { WeekProgressBar } from './WeekProgressBar';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const WeekProgressSection = () => {
  const { user } = useAuth();
  
  // Fetch client's workout completions
  const { data: clientWorkouts, isLoading: isLoadingClientWorkouts } = useQuery({
    queryKey: ['client-workouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return fetchClientWorkoutHistory(user.id);
    },
    enabled: !!user?.id,
  });
  
  // Get client's group members
  const { data: groupMembers, isLoading: isLoadingGroupMembers } = useQuery({
    queryKey: ['client-group-members', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // First get the groups the client belongs to
      const { data: memberGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);
        
      if (!memberGroups || memberGroups.length === 0) return [];
      
      // Get the first group's members
      const groupId = memberGroups[0].group_id;
      
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)
        .neq('user_id', user.id); // Exclude the current user
        
      if (!members || members.length === 0) return [];
      
      // Get workout completions for all group members
      const memberIds = members.map(m => m.user_id);
      
      const { data: completions } = await supabase
        .from('workout_completions')
        .select('completed_at, user_id')
        .in('user_id', memberIds)
        .not('completed_at', 'is', null);
        
      return completions || [];
    },
    enabled: !!user?.id,
  });
  
  // Extract dates of completed workouts
  const clientCompletedDates = React.useMemo(() => {
    if (!clientWorkouts) return [];
    return clientWorkouts
      .filter(workout => workout.completed_at)
      .map(workout => new Date(workout.completed_at));
  }, [clientWorkouts]);
  
  // Extract dates for group members' completed workouts
  const groupCompletedDates = React.useMemo(() => {
    if (!groupMembers) return [];
    return groupMembers
      .filter(workout => workout.completed_at)
      .map(workout => new Date(workout.completed_at));
  }, [groupMembers]);
  
  if (isLoadingClientWorkouts || isLoadingGroupMembers) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-client" />
      </div>
    );
  }
  
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Weekly Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <WeekProgressBar 
          completedDates={clientCompletedDates}
          label="Your Workouts" 
          color="bg-client"
        />
        
        <WeekProgressBar 
          completedDates={groupCompletedDates}
          label="Your Moai's Workouts" 
          color="bg-blue-500"
        />
      </CardContent>
    </Card>
  );
};
