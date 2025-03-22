
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchClientWorkoutHistory } from '@/services/workout-history-service';
import { supabase } from '@/integrations/supabase/client';
import { WeekProgressBar } from './WeekProgressBar';
import { Loader2, Users, User } from 'lucide-react';
import MoaiMemberItem from './MoaiMemberItem';

interface WeekProgressSectionProps {
  showTeam?: boolean;
  showPersonal?: boolean;
}

export const WeekProgressSection = ({ 
  showTeam = true, 
  showPersonal = true 
}: WeekProgressSectionProps) => {
  const { user } = useAuth();
  
  const { data: clientWorkouts, isLoading: isLoadingClientWorkouts } = useQuery({
    queryKey: ['client-workouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return fetchClientWorkoutHistory(user.id);
    },
    enabled: !!user?.id && showPersonal,
  });
  
  const { data: groupData, isLoading: isLoadingGroupData } = useQuery({
    queryKey: ['client-group-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return { members: [], groupName: "" };
      
      const { data: memberGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);
        
      if (!memberGroups || memberGroups.length === 0) return { members: [], groupName: "" };
      
      const groupId = memberGroups[0].group_id;
      
      const { data: groupInfo } = await supabase
        .from('groups')
        .select('name')
        .eq('id', groupId)
        .single();

      const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);
        
      if (!members || members.length === 0) return { members: [], groupName: groupInfo?.name || "My Moai" };
      
      const memberIds = members.map(m => m.user_id);
      
      const { data: completions } = await supabase
        .from('workout_completions')
        .select('completed_at, user_id')
        .in('user_id', memberIds)
        .not('completed_at', 'is', null);

      const { data: userEmails } = await supabase
        .rpc('get_users_email', { user_ids: memberIds });
        
      const { data: profiles } = await supabase
        .from('client_profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', memberIds);
      
      const profileMap = {};
      if (profiles) {
        profiles.forEach(profile => {
          profileMap[profile.id] = profile;
        });
      }
      
      const memberWorkoutsMap = {};
      if (completions) {
        completions.forEach(completion => {
          if (!memberWorkoutsMap[completion.user_id]) {
            memberWorkoutsMap[completion.user_id] = [];
          }
          memberWorkoutsMap[completion.user_id].push(new Date(completion.completed_at));
        });
      }
      
      const memberData = memberIds.map(memberId => {
        const email = userEmails?.find(u => u.id === memberId)?.email || '';
        return {
          userId: memberId,
          email,
          isCurrentUser: memberId === user.id,
          profileData: profileMap[memberId] || null,
          completedWorkouts: memberWorkoutsMap[memberId] || []
        };
      });
      
      return { 
        members: memberData,
        groupName: groupInfo?.name || "My Moai",
        completions: completions || [],
        userEmails: userEmails || []
      };
    },
    enabled: !!user?.id && showTeam,
  });
  
  const clientCompletedDates = React.useMemo(() => {
    if (!clientWorkouts) return [];
    return clientWorkouts
      .filter(workout => workout.completed_at)
      .map(workout => new Date(workout.completed_at));
  }, [clientWorkouts]);
  
  const groupCompletedDates = React.useMemo(() => {
    if (!groupData?.completions) return [];
    return groupData.completions
      .map(workout => new Date(workout.completed_at));
  }, [groupData?.completions]);
  
  if ((showPersonal && isLoadingClientWorkouts) || (showTeam && isLoadingGroupData)) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-client" />
      </div>
    );
  }
  
  // Calculate total workouts completed by the group this week
  const totalGroupWorkoutsThisWeek = groupData?.completions?.length || 0;
  const totalGroupMembers = groupData?.members?.length || 0;
  // Total possible workouts (each member doing one workout per day)
  const maxPossibleWorkouts = totalGroupMembers * 7;
  
  return (
    <div className="space-y-4">
      {!showTeam && !showPersonal && (
        <div className="text-center text-muted-foreground py-8">
          No progress data to display
        </div>
      )}
      
      {showPersonal && (
        <>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-client" />
            Your Progress
          </h2>
          
          <WeekProgressBar 
            completedDates={clientCompletedDates}
            label="Your Workouts" 
            color="bg-client"
            textColor="text-client"
          />
        </>
      )}
      
      {showTeam && groupData?.members?.length > 0 && (
        <>
          {showPersonal && (
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 mt-6">
              <Users className="h-5 w-5 text-client" />
              Team Progress
            </h2>
          )}
          
          <WeekProgressBar 
            completedDates={groupCompletedDates}
            label={`${groupData.groupName} Progress`}
            count={totalGroupWorkoutsThisWeek}
            total={maxPossibleWorkouts > 0 ? maxPossibleWorkouts : 1}
            color="bg-blue-500"
            textColor="text-blue-500"
          />
          
          {/* Only show individual member progress when on the Team tab */}
          {showTeam && !showPersonal && (
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-medium">Member Progress</h3>
              <div className="grid grid-cols-1 gap-4">
                {groupData.members.map(member => (
                  <div key={member.userId} className="space-y-2">
                    <MoaiMemberItem 
                      member={member} 
                      onClick={() => {}} // No action needed here
                    />
                    <WeekProgressBar 
                      completedDates={member.completedWorkouts}
                      label={member.isCurrentUser ? "Your Workouts" : `${member.profileData?.first_name || (member.email ? member.email.split('@')[0] : 'Unknown')}`}
                      color={member.isCurrentUser ? "bg-client" : "bg-blue-500"}
                      textColor={member.isCurrentUser ? "text-client" : "text-blue-500"}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
