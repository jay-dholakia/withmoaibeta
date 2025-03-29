
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchClientWorkoutHistory, getWeeklyAssignedWorkoutsCount } from '@/services/workout-history-service';
import { supabase } from '@/integrations/supabase/client';
import { WeekProgressBar } from './WeekProgressBar';
import { Loader2, Users, User, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { isThisWeek, getWeek, startOfWeek, format, isFuture } from 'date-fns';
import { WorkoutType } from './WorkoutTypeIcon';

interface WeekProgressSectionProps {
  showTeam?: boolean;
  showPersonal?: boolean;
  workoutTypesMap?: Record<string, WorkoutType>;
}

export const WeekProgressSection = ({ 
  showTeam = true, 
  showPersonal = true,
  workoutTypesMap = {}
}: WeekProgressSectionProps) => {
  const { user } = useAuth();
  
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = getWeek(now, { weekStartsOn: 1 });
  
  const { data: programWeekData } = useQuery({
    queryKey: ['program-week', user?.id],
    queryFn: async () => {
      if (!user?.id) return { weekNumber: 1 };
      
      const { data: assignments } = await supabase
        .from('program_assignments')
        .select('start_date')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false })
        .limit(1);
      
      if (!assignments || assignments.length === 0) {
        return { weekNumber: 1 };
      }
      
      const startDate = new Date(assignments[0].start_date);
      
      // Check if program hasn't started yet
      if (isFuture(startDate)) {
        return { weekNumber: 0 };
      }
      
      const startOfProgramWeek = startOfWeek(startDate, { weekStartsOn: 1 });
      const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 });
      
      const diffTime = Math.abs(startOfCurrentWeek.getTime() - startOfProgramWeek.getTime());
      const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
      
      return { weekNumber: diffWeeks + 1 };
    },
    enabled: !!user?.id
  });
  
  const { data: clientWorkouts, isLoading: isLoadingClientWorkouts } = useQuery({
    queryKey: ['client-workouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return fetchClientWorkoutHistory(user.id);
    },
    enabled: !!user?.id && showPersonal,
  });
  
  const { data: assignedWorkoutsCount, isLoading: isLoadingAssignedCount } = useQuery({
    queryKey: ['assigned-workouts-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const count = await getWeeklyAssignedWorkoutsCount(user.id);
      console.log('Assigned workouts count:', count);
      return count;
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
        .select('completed_at, user_id, life_happens_pass')
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
      const memberLifeHappensMap = {}; 
      
      if (completions) {
        completions.forEach(completion => {
          const completionDate = new Date(completion.completed_at);
          
          if (!memberWorkoutsMap[completion.user_id]) {
            memberWorkoutsMap[completion.user_id] = [];
          }
          
          if (!memberLifeHappensMap[completion.user_id]) {
            memberLifeHappensMap[completion.user_id] = [];
          }
          
          if (completion.life_happens_pass) {
            memberLifeHappensMap[completion.user_id].push(completionDate);
          } else {
            memberWorkoutsMap[completion.user_id].push(completionDate);
          }
        });
      }
      
      const memberData = memberIds.map(memberId => {
        const email = userEmails?.find(u => u.id === memberId)?.email || '';
        return {
          userId: memberId,
          email,
          isCurrentUser: memberId === user.id,
          profileData: profileMap[memberId] || null,
          completedWorkouts: memberWorkoutsMap[memberId] || [],
          lifeHappensWorkouts: memberLifeHappensMap[memberId] || []
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
      .filter(workout => workout.completed_at && !workout.life_happens_pass)
      .map(workout => new Date(workout.completed_at));
  }, [clientWorkouts]);
  
  const clientLifeHappensDates = React.useMemo(() => {
    if (!clientWorkouts) return [];
    return clientWorkouts
      .filter(workout => workout.completed_at && workout.life_happens_pass)
      .map(workout => new Date(workout.completed_at));
  }, [clientWorkouts]);
  
  const groupCompletedDates = React.useMemo(() => {
    if (!groupData?.completions) return [];
    return groupData.completions
      .filter(workout => workout.completed_at && !workout.life_happens_pass)
      .map(workout => new Date(workout.completed_at));
  }, [groupData?.completions]);
  
  const groupLifeHappensDates = React.useMemo(() => {
    if (!groupData?.completions) return [];
    return groupData.completions
      .filter(workout => workout.completed_at && workout.life_happens_pass)
      .map(workout => new Date(workout.completed_at));
  }, [groupData?.completions]);
  
  const calculatedWorkoutTypesMap = React.useMemo(() => {
    const typesMap: Record<string, WorkoutType> = {};
    
    if (clientWorkouts) {
      clientWorkouts.forEach(workout => {
        if (!workout.completed_at) return;
        
        const date = new Date(workout.completed_at);
        const dateKey = format(date, 'yyyy-MM-dd');
        
        if (workout.life_happens_pass) {
          typesMap[dateKey] = 'rest_day';
          return;
        }
        
        if (workout.rest_day) {
          typesMap[dateKey] = 'rest_day';
          return;
        }
        
        if (workout.workout?.workout_exercises && workout.workout.workout_exercises.length > 0) {
          const firstExercise = workout.workout.workout_exercises[0];
          if (firstExercise.exercise?.exercise_type) {
            const exerciseType = firstExercise.exercise.exercise_type.toLowerCase();
            
            if (exerciseType.includes('strength')) typesMap[dateKey] = 'strength';
            else if (exerciseType.includes('body') || exerciseType.includes('weight')) typesMap[dateKey] = 'bodyweight';
            else if (exerciseType.includes('cardio') || exerciseType.includes('hiit')) typesMap[dateKey] = 'cardio';
            else if (exerciseType.includes('flex') || exerciseType.includes('yoga')) typesMap[dateKey] = 'flexibility';
            else typesMap[dateKey] = 'custom';
            
            return;
          }
        }
        
        const title = workout.workout?.title?.toLowerCase() || '';
        if (title.includes('strength')) {
          typesMap[dateKey] = 'strength';
        } else if (title.includes('cardio') || title.includes('run')) {
          typesMap[dateKey] = 'cardio';
        } else if (title.includes('flex') || title.includes('stretch') || title.includes('yoga')) {
          typesMap[dateKey] = 'flexibility';
        } else if (title.includes('bodyweight')) {
          typesMap[dateKey] = 'bodyweight';
        } else {
          typesMap[dateKey] = 'custom';
        }
      });
    }
    
    return typesMap;
  }, [clientWorkouts]);
  
  React.useEffect(() => {
    if (clientWorkouts && clientWorkouts.length > 0) {
      console.log("Client Workouts:", clientWorkouts);
      console.log("Client Completed Dates:", clientCompletedDates);
      console.log("Client Life Happens Dates:", clientLifeHappensDates);
    }
  }, [clientWorkouts, clientCompletedDates, clientLifeHappensDates]);
  
  if ((showPersonal && (isLoadingClientWorkouts || isLoadingAssignedCount)) || (showTeam && isLoadingGroupData)) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-client" />
      </div>
    );
  }
  
  const thisWeekWorkouts = clientCompletedDates.filter(date => isThisWeek(date, { weekStartsOn: 1 })).length;
  const thisWeekLifeHappens = clientLifeHappensDates.filter(date => isThisWeek(date, { weekStartsOn: 1 })).length;
  const totalThisWeek = thisWeekWorkouts + thisWeekLifeHappens;
  
  console.log('[Debug] assignedWorkoutsCount in WeekProgressSection:', assignedWorkoutsCount);
  
  const totalWeeklyWorkouts = assignedWorkoutsCount > 0 ? assignedWorkoutsCount : 7;
  
  const totalGroupWorkoutsThisWeek = groupData?.completions?.length || 0;
  const totalGroupMembers = groupData?.members?.length || 0;
  const maxPossibleWorkouts = totalGroupMembers * 7;
  
  return (
    <div className="space-y-4 text-center">
      {!showTeam && !showPersonal && (
        <div className="text-center text-muted-foreground py-8">
          No progress data to display
        </div>
      )}
      
      {showPersonal && (
        <>
          <h2 className="text-xl font-bold mb-4 flex items-center justify-center gap-2">
            <User className="h-5 w-5 text-client" />
            Your Progress
          </h2>
          
          <WeekProgressBar 
            completedDates={clientCompletedDates}
            lifeHappensDates={clientLifeHappensDates}
            label="Your Workouts" 
            count={thisWeekWorkouts + thisWeekLifeHappens}
            total={totalWeeklyWorkouts}
            color="bg-client"
            textColor="text-client"
            showDayCircles={true}
            showProgressBar={true}
            weekNumber={programWeekData?.weekNumber}
            workoutTypes={workoutTypesMap || calculatedWorkoutTypesMap}
          />
        </>
      )}
      
      {showTeam && groupData?.members?.length > 0 && (
        <>
          {showPersonal && (
            <h2 className="text-xl font-bold mb-4 flex items-center justify-center gap-2 mt-6">
              <Users className="h-5 w-5 text-client" />
              Team Progress
            </h2>
          )}
          
          <WeekProgressBar 
            completedDates={groupCompletedDates}
            lifeHappensDates={groupLifeHappensDates}
            label={`${groupData.groupName}`}
            count={totalGroupWorkoutsThisWeek}
            total={maxPossibleWorkouts > 0 ? maxPossibleWorkouts : 1}
            color="bg-blue-500"
            textColor="text-blue-500"
            showDayCircles={false}
            showProgressBar={false}
            weekNumber={programWeekData?.weekNumber}
            workoutTypes={workoutTypesMap || calculatedWorkoutTypesMap}
          />
          
          {showTeam && !showPersonal && (
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-medium text-center mb-2">Member Progress</h3>
              <div className="grid grid-cols-1 gap-4">
                {groupData.members.map(member => {
                  const memberWorkoutTypes: Record<string, WorkoutType> = {};
                  
                  member.completedWorkouts.forEach(date => {
                    memberWorkoutTypes[format(date, 'yyyy-MM-dd')] = 'strength';
                  });
                  
                  member.lifeHappensWorkouts.forEach(date => {
                    memberWorkoutTypes[format(date, 'yyyy-MM-dd')] = 'rest_day';
                  });
                  
                  return (
                    <Card key={member.userId} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={member.profileData?.avatar_url || ''} alt={member.profileData?.first_name || 'Member'} />
                              <AvatarFallback className="bg-client/80 text-white">
                                {member.profileData?.first_name ? member.profileData.first_name.charAt(0) : ''}
                                {member.profileData?.last_name ? member.profileData.last_name.charAt(0) : ''}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center">
                                <span className="font-medium">
                                  {member.profileData?.first_name 
                                    ? `${member.profileData.first_name} ${member.profileData.last_name || ''}` 
                                    : member.email.split('@')[0]}
                                </span>
                                {member.isCurrentUser && (
                                  <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <WeekProgressBar 
                            completedDates={member.completedWorkouts}
                            lifeHappensDates={member.lifeHappensWorkouts}
                            label=""
                            count={(member.completedWorkouts.filter(date => isThisWeek(date, { weekStartsOn: 1 })).length) + 
                                  (member.lifeHappensWorkouts.filter(date => isThisWeek(date, { weekStartsOn: 1 })).length)}
                            total={7}
                            color={member.isCurrentUser ? "bg-client" : "bg-blue-500"}
                            textColor={member.isCurrentUser ? "text-client" : "text-blue-500"}
                            showDayCircles={true}
                            showProgressBar={false}
                            weekNumber={programWeekData?.weekNumber}
                            compact={true}
                            workoutTypes={memberWorkoutTypes}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
