import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { useQuery } from '@tanstack/react-query';
import { isThisWeek, format } from 'date-fns';
import { WorkoutType } from './WorkoutTypeIcon';
import { WorkoutProgressCard } from './WorkoutProgressCard';
import { getWeeklyAssignedWorkoutsCount } from '@/services/workout-history-service';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { detectWorkoutTypeFromText } from '@/services/workout-edit-service';

interface MoaiGroupProgressProps {
  groupId: string;
}

interface GroupMember {
  userId: string;
  email: string;
  isCurrentUser: boolean;
  profileData?: {
    first_name?: string | null;
    last_name?: string | null;
    avatar_url?: string | null;
  };
}

const MoaiGroupProgress = ({ groupId }: MoaiGroupProgressProps) => {
  const { user, profile } = useAuth();
  const [completedDates, setCompletedDates] = useState<Date[]>([]);
  const [lifeHappensDates, setLifeHappensDates] = useState<Date[]>([]);
  const [workoutTypesMap, setWorkoutTypesMap] = useState<Record<string, WorkoutType>>({});
  const [workoutTitlesMap, setWorkoutTitlesMap] = useState<Record<string, string>>({});
  
  const { data: assignedWorkoutsCount } = useQuery({
    queryKey: ['assigned-workouts-count', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User ID not available');
      try {
        const count = await getWeeklyAssignedWorkoutsCount(user.id);
        return count;
      } catch (error) {
        console.error("Error fetching workout count:", error);
        return 6; // Default to 6 as fallback
      }
    },
    enabled: !!user?.id,
  });
  
  const { data: currentUserProfile, isLoading: isLoadingCurrentUserProfile } = useQuery({
    queryKey: ['current-user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      try {
        const { data, error } = await supabase
          .from('client_profiles')
          .select('first_name, last_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();
          
        if (error) {
          console.error('Error fetching current user profile:', error);
          return null;
        }
        
        return data;
      } catch (error) {
        console.error('Error in current user profile query:', error);
        return null;
      }
    },
    enabled: !!user?.id,
  });
  
  const { data: groupMembers, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['moai-members', groupId],
    queryFn: async () => {
      if (!groupId) return [];
      
      try {
        const { data: groupMembers, error: membersError } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', groupId);
        
        if (membersError) {
          console.error('Error fetching group members:', membersError);
          throw membersError;
        }
        
        return Promise.all(
          groupMembers.map(async (member) => {
            try {
              const { data: profile } = await supabase
                .from('client_profiles')
                .select('first_name, last_name, avatar_url')
                .eq('id', member.user_id)
                .maybeSingle();
                
              return {
                userId: member.user_id,
                email: `user_${member.user_id.substring(0, 8)}@example.com`,
                isCurrentUser: member.user_id === user?.id,
                profileData: profile
              } as GroupMember;
            } catch (error) {
              console.error('Error fetching member profile:', error);
              return {
                userId: member.user_id,
                email: `user_${member.user_id.substring(0, 8)}@example.com`,
                isCurrentUser: member.user_id === user?.id
              } as GroupMember;
            }
          })
        );
      } catch (error) {
        console.error('Error in group members query:', error);
        return [];
      }
    },
    enabled: !!groupId,
  });
  
  const [memberWorkouts, setMemberWorkouts] = useState<Record<string, {
    completedDates: Date[];
    lifeHappensDates: Date[];
    workoutTypesMap: Record<string, WorkoutType>;
    workoutTitlesMap: Record<string, string>;
  }>>({});
  
  const { data: currentUserWorkouts, isLoading: isLoadingCurrentUser } = useQuery({
    queryKey: ['client-workouts-moai', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        return await fetchClientWorkoutHistory(user.id);
      } catch (error) {
        console.error('Error fetching client workout history:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });
  
  useEffect(() => {
    if (currentUserWorkouts && currentUserWorkouts.length > 0) {
      const newCompletedDates: Date[] = [];
      const newLifeHappensDates: Date[] = [];
      const newWorkoutTypesMap: Record<string, WorkoutType> = {};
      const newTitlesMap: Record<string, string> = {};
      
      currentUserWorkouts.forEach(workout => {
        if (workout.completed_at) {
          try {
            const completionDate = typeof workout.completed_at === 'string' 
              ? new Date(workout.completed_at) 
              : workout.completed_at;
              
            if (!isNaN(completionDate.getTime())) {
              const dateKey = format(completionDate, 'yyyy-MM-dd');
              
              if (workout.life_happens_pass || workout.rest_day) {
                newLifeHappensDates.push(completionDate);
                newWorkoutTypesMap[dateKey] = 'rest_day';
                return;
              }
              
              newCompletedDates.push(completionDate);
              
              if (workout.title) {
                newTitlesMap[dateKey] = workout.title;
              } else if (workout.workout?.title) {
                newTitlesMap[dateKey] = workout.workout.title;
              }
              
              if (workout.workout_type) {
                newWorkoutTypesMap[dateKey] = workout.workout_type as WorkoutType;
              } else if (workout.workout?.workout_type) {
                const type = String(workout.workout.workout_type).toLowerCase();
                if (type.includes('strength')) newWorkoutTypesMap[dateKey] = 'strength';
                else if (type.includes('cardio') || type.includes('run')) newWorkoutTypesMap[dateKey] = 'cardio';
                else if (type.includes('body') || type.includes('weight')) newWorkoutTypesMap[dateKey] = 'bodyweight';
                else if (type.includes('flex') || type.includes('yoga') || type.includes('stretch')) newWorkoutTypesMap[dateKey] = 'flexibility';
                else if (type.includes('rest')) newWorkoutTypesMap[dateKey] = 'rest_day';
                else if (type.includes('custom')) newWorkoutTypesMap[dateKey] = 'custom';
                else if (type.includes('one')) newWorkoutTypesMap[dateKey] = 'one_off';
                else if (type.includes('hiit')) newWorkoutTypesMap[dateKey] = 'hiit';
                else if (type.includes('sport')) newWorkoutTypesMap[dateKey] = 'sport';
                else if (type.includes('swim')) newWorkoutTypesMap[dateKey] = 'swimming';
                else if (type.includes('cycle') || type.includes('bike')) newWorkoutTypesMap[dateKey] = 'cycling';
                else if (type.includes('dance')) newWorkoutTypesMap[dateKey] = 'dance';
                else if (newTitlesMap[dateKey]) {
                  newWorkoutTypesMap[dateKey] = detectWorkoutTypeFromText(newTitlesMap[dateKey]);
                } else {
                  newWorkoutTypesMap[dateKey] = 'strength';
                }
              } else if (newTitlesMap[dateKey]) {
                newWorkoutTypesMap[dateKey] = detectWorkoutTypeFromText(newTitlesMap[dateKey]);
              } else {
                newWorkoutTypesMap[dateKey] = 'strength';
              }
            }
          } catch (error) {
            console.error('Error processing workout completion date:', error);
          }
        }
      });
      
      setCompletedDates(newCompletedDates);
      setLifeHappensDates(newLifeHappensDates);
      setWorkoutTypesMap(newWorkoutTypesMap);
      setWorkoutTitlesMap(newTitlesMap);
    }
  }, [currentUserWorkouts]);
  
  useEffect(() => {
    if (groupMembers && groupMembers.length > 0) {
      const fetchMemberWorkouts = async () => {
        const memberWorkoutsData: Record<string, {
          completedDates: Date[];
          lifeHappensDates: Date[];
          workoutTypesMap: Record<string, WorkoutType>;
          workoutTitlesMap: Record<string, string>;
        }> = {};
        
        for (const member of groupMembers.filter(m => !m.isCurrentUser)) {
          try {
            const workouts = await fetchClientWorkoutHistory(member.userId);
            
            const completedDates: Date[] = [];
            const lifeHappensDates: Date[] = [];
            const workoutTypesMap: Record<string, WorkoutType> = {};
            const titleMap: Record<string, string> = {};
            
            workouts.forEach(workout => {
              if (workout.completed_at) {
                try {
                  const completionDate = typeof workout.completed_at === 'string' 
                    ? new Date(workout.completed_at) 
                    : workout.completed_at;
                    
                  if (!isNaN(completionDate.getTime())) {
                    const dateKey = format(completionDate, 'yyyy-MM-dd');
                    
                    if (workout.life_happens_pass || workout.rest_day) {
                      lifeHappensDates.push(completionDate);
                      workoutTypesMap[dateKey] = 'rest_day';
                      return;
                    }
                    
                    completedDates.push(completionDate);
                    
                    if (workout.title) {
                      titleMap[dateKey] = workout.title;
                    } else if (workout.workout?.title) {
                      titleMap[dateKey] = workout.workout.title;
                    }
                    
                    if (workout.workout_type) {
                      workoutTypesMap[dateKey] = workout.workout_type as WorkoutType;
                    } else if (workout.workout?.workout_type) {
                      const type = String(workout.workout.workout_type).toLowerCase();
                      if (type.includes('strength')) workoutTypesMap[dateKey] = 'strength';
                      else if (type.includes('cardio') || type.includes('run')) workoutTypesMap[dateKey] = 'cardio';
                      else if (type.includes('body') || type.includes('weight')) workoutTypesMap[dateKey] = 'bodyweight';
                      else if (type.includes('flex') || type.includes('yoga') || type.includes('stretch')) workoutTypesMap[dateKey] = 'flexibility';
                      else if (type.includes('hiit')) workoutTypesMap[dateKey] = 'hiit';
                      else if (type.includes('sport')) workoutTypesMap[dateKey] = 'sport';
                      else if (type.includes('swim')) workoutTypesMap[dateKey] = 'swimming';
                      else if (type.includes('cycle') || type.includes('bike')) workoutTypesMap[dateKey] = 'cycling';
                      else if (type.includes('dance')) workoutTypesMap[dateKey] = 'dance';
                      else if (titleMap[dateKey]) {
                        workoutTypesMap[dateKey] = detectWorkoutTypeFromText(titleMap[dateKey]);
                      } else {
                        workoutTypesMap[dateKey] = 'strength';
                      }
                    } else if (titleMap[dateKey]) {
                      workoutTypesMap[dateKey] = detectWorkoutTypeFromText(titleMap[dateKey]);
                    } else {
                      workoutTypesMap[dateKey] = 'strength';
                    }
                  }
                } catch (error) {
                  console.error('Error processing member workout date:', error);
                }
              }
            });
            
            memberWorkoutsData[member.userId] = {
              completedDates,
              lifeHappensDates,
              workoutTypesMap,
              workoutTitlesMap: titleMap
            };
          } catch (error) {
            console.error(`Error fetching workouts for member ${member.userId}:`, error);
          }
        }
        
        setMemberWorkouts(memberWorkoutsData);
      };
      
      fetchMemberWorkouts();
    }
  }, [groupMembers]);
  
  const getDisplayName = (member: GroupMember): string => {
    if (member.profileData?.first_name) {
      return member.profileData.first_name;
    }
    return member.email.split('@')[0];
  };
  
  const getCurrentUserDisplayName = (): string => {
    if (currentUserProfile?.first_name) {
      return currentUserProfile.first_name;
    }
    
    if (profile?.user_type) {
      const firstName = (profile as any).first_name;
      if (firstName) return firstName;
    }
    
    if (user?.email) {
      return user.email.split('@')[0];
    }
    
    return "You";
  };
  
  const completedThisWeek = completedDates.filter(date => isThisWeek(date, { weekStartsOn: 1 })).length;
  
  const lifeHappensThisWeek = lifeHappensDates.filter(date => isThisWeek(date, { weekStartsOn: 1 })).length;
  
  const totalCompletedThisWeek = completedThisWeek + lifeHappensThisWeek;
  
  const totalWorkouts = assignedWorkoutsCount || 6;
  
  if (isLoadingCurrentUser || isLoadingMembers || isLoadingCurrentUserProfile) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-client mr-2" />
            <p className="text-sm text-muted-foreground">Loading your progress...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {user && (
        <WorkoutProgressCard 
          label="Your Workouts"
          completedDates={completedDates}
          lifeHappensDates={lifeHappensDates}
          count={totalCompletedThisWeek}
          total={totalWorkouts}
          workoutTypesMap={workoutTypesMap}
          workoutTitlesMap={workoutTitlesMap}
          userName={getCurrentUserDisplayName()}
          isCurrentUser={true}
        />
      )}
      
      {groupMembers && groupMembers.filter(m => !m.isCurrentUser).map(member => {
        const memberData = memberWorkouts[member.userId];
        
        if (!memberData) {
          return (
            <Card key={member.userId} className="p-4 animate-pulse">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
                <div className="h-4 w-36 bg-slate-200 rounded"></div>
              </div>
              <div className="mt-3 h-2 bg-slate-200 rounded-full"></div>
            </Card>
          );
        }
        
        const memberCompletedThisWeek = memberData.completedDates
          .filter(date => isThisWeek(date, { weekStartsOn: 1 })).length;
        
        const memberLifeHappensThisWeek = memberData.lifeHappensDates
          .filter(date => isThisWeek(date, { weekStartsOn: 1 })).length;
        
        const memberTotalCompletedThisWeek = memberCompletedThisWeek + memberLifeHappensThisWeek;
        
        return (
          <WorkoutProgressCard 
            key={member.userId}
            label=""
            completedDates={memberData.completedDates}
            lifeHappensDates={memberData.lifeHappensDates}
            count={memberTotalCompletedThisWeek}
            total={totalWorkouts}
            workoutTypesMap={memberData.workoutTypesMap}
            workoutTitlesMap={memberData.workoutTitlesMap}
            userName={getDisplayName(member)}
            isCurrentUser={false}
          />
        );
      })}
      
      {(!groupMembers || groupMembers.filter(m => !m.isCurrentUser).length === 0) && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          Other group members' progress will appear here soon.
        </p>
      )}
    </div>
  );
};

export default MoaiGroupProgress;
