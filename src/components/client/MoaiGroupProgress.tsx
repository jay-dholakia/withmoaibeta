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
import { Loader2, WifiOff, AlertCircle } from 'lucide-react';

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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
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
    enabled: !!user?.id && isOnline,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
  
  const { data: currentUserProfile, isLoading: isLoadingCurrentUserProfile } = useQuery({
    queryKey: ['current-user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
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
    },
    enabled: !!user?.id && isOnline,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
  
  const { data: groupMembers, isLoading: isLoadingMembers, error: memberError } = useQuery({
    queryKey: ['moai-members', groupId],
    queryFn: async () => {
      if (!groupId) return [];
      
      if (!navigator.onLine) {
        throw new Error('Offline: Cannot fetch group members');
      }
      
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
    },
    enabled: !!groupId && isOnline,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: (failureCount, error) => {
      if (error.message?.includes('Offline')) {
        return false;
      }
      return failureCount < 3;
    }
  });
  
  const [memberWorkouts, setMemberWorkouts] = useState<Record<string, {
    completedDates: Date[];
    lifeHappensDates: Date[];
    workoutTypesMap: Record<string, WorkoutType>;
  }>>({});
  
  const { data: currentUserWorkouts, isLoading: isLoadingCurrentUser } = useQuery({
    queryKey: ['client-workouts-moai', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      if (!navigator.onLine) {
        throw new Error('Offline: Cannot fetch user workouts');
      }
      return fetchClientWorkoutHistory(user.id);
    },
    enabled: !!user?.id && isOnline,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: (failureCount, error) => {
      if (error.message?.includes('Offline')) {
        return false;
      }
      return failureCount < 3;
    }
  });
  
  useEffect(() => {
    if (currentUserWorkouts && currentUserWorkouts.length > 0) {
      const newCompletedDates: Date[] = [];
      const newLifeHappensDates: Date[] = [];
      const newWorkoutTypesMap: Record<string, WorkoutType> = {};
      
      currentUserWorkouts.forEach(workout => {
        if (workout.completed_at) {
          const completionDate = typeof workout.completed_at === 'string' 
            ? new Date(workout.completed_at) 
            : workout.completed_at;
            
          const dateKey = format(completionDate, 'yyyy-MM-dd');
          
          if (workout.life_happens_pass || workout.rest_day) {
            newLifeHappensDates.push(completionDate);
            return;
          }
          
          newCompletedDates.push(completionDate);
          
          if (workout.workout?.workout_type) {
            const type = String(workout.workout.workout_type).toLowerCase();
            if (type.includes('strength')) newWorkoutTypesMap[dateKey] = 'strength';
            else if (type.includes('cardio')) newWorkoutTypesMap[dateKey] = 'cardio';
            else if (type.includes('body')) newWorkoutTypesMap[dateKey] = 'bodyweight';
            else if (type.includes('flex')) newWorkoutTypesMap[dateKey] = 'flexibility';
            else newWorkoutTypesMap[dateKey] = 'strength';
          } else {
            newWorkoutTypesMap[dateKey] = 'strength';
          }
        }
      });
      
      setCompletedDates(newCompletedDates);
      setLifeHappensDates(newLifeHappensDates);
      setWorkoutTypesMap(newWorkoutTypesMap);
    }
  }, [currentUserWorkouts]);
  
  useEffect(() => {
    if (groupMembers && groupMembers.length > 0) {
      const fetchMemberWorkouts = async () => {
        const memberWorkoutsData: Record<string, {
          completedDates: Date[];
          lifeHappensDates: Date[];
          workoutTypesMap: Record<string, WorkoutType>;
        }> = {};
        
        for (const member of groupMembers.filter(m => !m.isCurrentUser)) {
          try {
            const workouts = await fetchClientWorkoutHistory(member.userId);
            
            const completedDates: Date[] = [];
            const lifeHappensDates: Date[] = [];
            const workoutTypesMap: Record<string, WorkoutType> = {};
            
            workouts.forEach(workout => {
              if (workout.completed_at) {
                const completionDate = typeof workout.completed_at === 'string' 
                  ? new Date(workout.completed_at) 
                  : workout.completed_at;
                  
                const dateKey = format(completionDate, 'yyyy-MM-dd');
                
                if (workout.life_happens_pass || workout.rest_day) {
                  lifeHappensDates.push(completionDate);
                  return;
                }
                
                completedDates.push(completionDate);
                
                if (workout.workout?.workout_type) {
                  const type = String(workout.workout.workout_type).toLowerCase();
                  if (type.includes('strength')) workoutTypesMap[dateKey] = 'strength';
                  else if (type.includes('cardio')) workoutTypesMap[dateKey] = 'cardio';
                  else if (type.includes('body')) workoutTypesMap[dateKey] = 'bodyweight';
                  else if (type.includes('flex')) workoutTypesMap[dateKey] = 'flexibility';
                  else workoutTypesMap[dateKey] = 'strength';
                } else {
                  workoutTypesMap[dateKey] = 'strength';
                }
              }
            });
            
            memberWorkoutsData[member.userId] = {
              completedDates,
              lifeHappensDates,
              workoutTypesMap
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
  
  if (!isOnline) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col items-center justify-center gap-2 py-4">
            <WifiOff className="h-10 w-10 text-muted-foreground" />
            <p className="text-center text-sm font-medium">You're currently offline</p>
            <p className="text-center text-xs text-muted-foreground">
              Moai group progress will be available when you're back online
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (memberError) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col items-center justify-center gap-2 py-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-center text-sm font-medium">Error loading group data</p>
            <p className="text-center text-xs text-muted-foreground">
              Please try again later or contact support if this persists
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoadingCurrentUser || isLoadingMembers || isLoadingCurrentUserProfile) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
            <p className="text-center text-sm text-muted-foreground">Loading your progress...</p>
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
