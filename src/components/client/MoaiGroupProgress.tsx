import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { useQuery } from '@tanstack/react-query';
import { isThisWeek, format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { WorkoutType } from './WorkoutTypeIcon';
import { WorkoutProgressCard } from './WorkoutProgressCard';
import { getWeeklyAssignedWorkoutsCount } from '@/services/workout-history-service';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { detectWorkoutTypeFromText } from '@/services/workout-edit-service';
import { getCurrentWeekNumber } from '@/services/assigned-workouts-service';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface MoaiGroupProgressProps {
  groupId: string;
  currentProgram?: any; // Program details with start date
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

const MoaiGroupProgress = ({ groupId, currentProgram }: MoaiGroupProgressProps) => {
  const { user, profile } = useAuth();
  const [completedDates, setCompletedDates] = useState<Date[]>([]);
  const [lifeHappensDates, setLifeHappensDates] = useState<Date[]>([]);
  const [workoutTypesMap, setWorkoutTypesMap] = useState<Record<string, WorkoutType>>({});
  const [workoutTitlesMap, setWorkoutTitlesMap] = useState<Record<string, string>>({});
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  
  useEffect(() => {
    if (currentProgram?.start_date) {
      const startDatePT = new Date(formatInTimeZone(new Date(currentProgram.start_date), 'America/Los_Angeles', 'yyyy-MM-dd'));
      const nowPT = new Date();
      const msInDay = 1000 * 60 * 60 * 24;
      const daysElapsed = Math.floor((nowPT.getTime() - startDatePT.getTime()) / msInDay);
      const weekNumber = Math.max(1, Math.floor(daysElapsed / 7) + 1);
      setCurrentWeek(weekNumber);
      console.log(`Current program week: ${weekNumber} (start date: ${startDatePT})`);
    }
  }, [currentProgram]);
  
  const { data: assignedWorkoutsCount } = useQuery({
    queryKey: ['assigned-workouts-count', user?.id, currentWeek],
    queryFn: async () => {
      if (!user?.id) throw new Error('User ID not available');
      try {
        if (currentWeek > 0) {
          return await getWeeklyAssignedWorkoutsCount(user.id, currentWeek);
        }
        const count = await getWeeklyAssignedWorkoutsCount(user.id);
        return count;
      } catch (error) {
        console.error("Error fetching workout count:", error);
        return 6; // Default to 6 as fallback
      }
    },
    enabled: !!user?.id,
  });

  const isThisWeekPT = (date: Date) => {
    const ptDateStr = formatInTimeZone(date, 'America/Los_Angeles', 'yyyy-MM-dd');
    const ptDate = new Date(ptDateStr);
    return isThisWeek(ptDate, { weekStartsOn: 1 });
  };
  
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
              const dateKey = formatInTimeZone(completionDate, 'America/Los_Angeles', 'yyyy-MM-dd');
              
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
                    const dateKey = formatInTimeZone(completionDate, 'America/Los_Angeles', 'yyyy-MM-dd');
                    
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
  
  const completedThisWeek = completedDates.filter(date => isThisWeekPT(date)).length;
  
  const lifeHappensThisWeek = lifeHappensDates.filter(date => isThisWeekPT(date)).length;
  
  const totalCompletedThisWeek = completedThisWeek;
  
  const totalWorkouts = assignedWorkoutsCount || 6;
  
  if (isLoadingCurrentUser || isLoadingMembers || isLoadingCurrentUserProfile) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-client mr-2" />
        <p className="text-sm text-muted-foreground">Loading your progress...</p>
      </div>
    );
  }
  
  const allMembers = [
    ...(user ? [{
      userId: user.id,
      email: user.email || '',
      isCurrentUser: true,
      profileData: {
        first_name: currentUserProfile?.first_name || null,
        last_name: currentUserProfile?.last_name || null,
        avatar_url: currentUserProfile?.avatar_url || null
      }
    }] : []),
    ...(groupMembers?.filter(m => !m.isCurrentUser) || [])
  ];
  
  const today = new Date();
  const todayIndex = (today.getDay() === 0 ? 6 : today.getDay() - 1);
  
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Weekly Progress</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-4">
        <div className="ml-11 mb-2">
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: 7 }).map((_, i) => {
              const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
              const isToday = i === todayIndex;
              
              return (
                <div key={`day-${i}`} className={cn(
                  "text-xs text-center px-1 py-0.5",
                  isToday 
                    ? "text-client font-medium" 
                    : "text-muted-foreground"
                )}>
                  <span className={cn(
                    "inline-flex items-center justify-center w-5 h-5 rounded-full",
                    isToday ? "border-2 border-client" : ""
                  )}>
                    {days[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="space-y-0.5">
          {allMembers.map((member, index) => {
            const isCurrentUser = member.isCurrentUser;
            const memberData = isCurrentUser 
              ? { 
                  completedDates, 
                  lifeHappensDates, 
                  workoutTypesMap, 
                  workoutTitlesMap 
                } 
              : memberWorkouts[member.userId];
            
            if (!memberData && !isCurrentUser) {
              return (
                <div key={member.userId} className="flex items-center gap-3 animate-pulse">
                  <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
                  <div className="flex-1 h-6 bg-slate-200 rounded"></div>
                </div>
              );
            }
            
            const memberCompletedThisWeek = isCurrentUser
              ? totalCompletedThisWeek
              : memberData.completedDates.filter(date => isThisWeekPT(date)).length;
            
            return (
              <div key={member.userId}>
                <WorkoutProgressCard 
                  completedDates={isCurrentUser ? completedDates : memberData.completedDates}
                  lifeHappensDates={isCurrentUser ? lifeHappensDates : memberData.lifeHappensDates}
                  count={memberCompletedThisWeek}
                  total={totalWorkouts}
                  workoutTypesMap={isCurrentUser ? workoutTypesMap : memberData.workoutTypesMap}
                  workoutTitlesMap={isCurrentUser ? workoutTitlesMap : memberData.workoutTitlesMap}
                  userName={isCurrentUser ? getCurrentUserDisplayName() : getDisplayName(member)}
                  isCurrentUser={isCurrentUser}
                  avatarUrl={member.profileData?.avatar_url}
                  firstName={member.profileData?.first_name}
                  lastName={member.profileData?.last_name}
                  showLabelsBelow={false}
                  className="py-1"
                />
                {index < allMembers.length - 1 && (
                  <div className="py-1">
                    <Separator className="opacity-30" />
                  </div>
                )}
              </div>
            );
          })}
          
          {(!allMembers || allMembers.length === 0) && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No group members found.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MoaiGroupProgress;
