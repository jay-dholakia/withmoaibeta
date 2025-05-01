
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { supabase } from '@/integrations/supabase/client';
import { detectWorkoutTypeFromText } from '@/services/workout-edit-service';
import { WorkoutType } from '@/components/client/WorkoutTypeIcon';
import { formatInTimeZone } from 'date-fns-tz';
import { isThisWeek } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface GroupMemberProfileData {
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
}

interface GroupMember {
  userId: string;
  email: string;
  isCurrentUser: boolean;
  profileData?: GroupMemberProfileData;
}

interface MemberWorkoutData {
  completedDates: Date[];
  lifeHappensDates: Date[];
  workoutTypesMap: Record<string, WorkoutType>;
  workoutTitlesMap: Record<string, string>;
}

export const useGroupProgressData = (groupId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isFetchingBackground, setIsFetchingBackground] = useState(false);

  // Get group members with profiles
  const { 
    data: groupMembers, 
    isLoading: isLoadingMembers,
    refetch: refetchMembers
  } = useQuery({
    queryKey: ['moai-members', groupId],
    queryFn: async () => {
      if (!groupId) return [];
      
      try {
        const { data: groupMembers, error: membersError } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', groupId);
        
        if (membersError) throw membersError;
        
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!groupId,
  });

  // Get current user profile
  const { 
    data: currentUserProfile,
    isLoading: isLoadingCurrentUserProfile 
  } = useQuery({
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
    staleTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!user?.id,
  });

  // Get current user workouts
  const { 
    data: currentUserWorkouts,
    isLoading: isLoadingCurrentUser,
    refetch: refetchCurrentUserWorkouts
  } = useQuery({
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
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!user?.id,
  });

  // Process current user workout data
  const processUserWorkouts = (workouts: any[]) => {
    if (!workouts || workouts.length === 0) {
      return {
        completedDates: [],
        lifeHappensDates: [],
        workoutTypesMap: {},
        workoutTitlesMap: {}
      };
    }

    const completedDates: Date[] = [];
    const lifeHappensDates: Date[] = [];
    const typesMap: Record<string, WorkoutType> = {};
    const titlesMap: Record<string, string> = {};
    
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
              typesMap[dateKey] = 'rest_day';
              return;
            }
            
            completedDates.push(completionDate);
            
            if (workout.title) {
              titlesMap[dateKey] = workout.title;
            } else if (workout.workout?.title) {
              titlesMap[dateKey] = workout.workout.title;
            }
            
            // Determine workout type
            if (workout.workout_type) {
              typesMap[dateKey] = workout.workout_type as WorkoutType;
            } else if (workout.workout?.workout_type) {
              const type = String(workout.workout.workout_type).toLowerCase();
              if (type.includes('strength')) typesMap[dateKey] = 'strength';
              else if (type.includes('cardio') || type.includes('run')) typesMap[dateKey] = 'cardio';
              else if (type.includes('body') || type.includes('weight')) typesMap[dateKey] = 'bodyweight';
              else if (type.includes('flex') || type.includes('yoga') || type.includes('stretch')) typesMap[dateKey] = 'flexibility';
              else if (type.includes('hiit')) typesMap[dateKey] = 'hiit';
              else if (type.includes('sport')) typesMap[dateKey] = 'sport';
              else if (type.includes('swim')) typesMap[dateKey] = 'swimming';
              else if (type.includes('cycle') || type.includes('bike')) typesMap[dateKey] = 'cycling';
              else if (type.includes('dance')) typesMap[dateKey] = 'dance';
              else if (titlesMap[dateKey]) {
                typesMap[dateKey] = detectWorkoutTypeFromText(titlesMap[dateKey]);
              } else {
                typesMap[dateKey] = 'strength';
              }
            } else if (titlesMap[dateKey]) {
              typesMap[dateKey] = detectWorkoutTypeFromText(titlesMap[dateKey]);
            } else {
              typesMap[dateKey] = 'strength';
            }
          }
        } catch (error) {
          console.error('Error processing workout completion date:', error);
        }
      }
    });
    
    return {
      completedDates,
      lifeHappensDates,
      workoutTypesMap: typesMap,
      workoutTitlesMap: titlesMap
    };
  };

  // Get member workouts data
  const { 
    data: memberWorkoutsData,
    isLoading: isLoadingMemberWorkouts,
    refetch: refetchMemberWorkouts
  } = useQuery({
    queryKey: ['moai-members-workouts', groupId],
    queryFn: async () => {
      if (!groupMembers || groupMembers.length === 0) return {};
      
      const result: Record<string, MemberWorkoutData> = {};
      
      for (const member of groupMembers.filter(m => !m.isCurrentUser)) {
        try {
          const workouts = await fetchClientWorkoutHistory(member.userId);
          result[member.userId] = processUserWorkouts(workouts);
        } catch (error) {
          console.error(`Error fetching workouts for member ${member.userId}:`, error);
          result[member.userId] = {
            completedDates: [],
            lifeHappensDates: [],
            workoutTypesMap: {},
            workoutTitlesMap: {}
          };
        }
      }
      
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!groupMembers && groupMembers.length > 0,
  });

  // Function to refresh data in background
  const refreshDataInBackground = async () => {
    if (isFetchingBackground) return;
    
    setIsFetchingBackground(true);
    try {
      await Promise.all([
        refetchMembers(),
        refetchCurrentUserWorkouts(),
        refetchMemberWorkouts()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsFetchingBackground(false);
    }
  };

  // Process current user workouts data
  const currentUserData = processUserWorkouts(currentUserWorkouts || []);

  // Effect to refresh data when component remounts
  useEffect(() => {
    // When component mounts, if we have cached data, trigger a background refresh
    const hasCache = queryClient.getQueryData(['moai-members', groupId]) !== undefined;
    if (hasCache && groupId) {
      refreshDataInBackground();
    }
  }, [groupId]);
  
  return {
    groupMembers,
    currentUserProfile,
    currentUserData,
    memberWorkoutsData: memberWorkoutsData || {},
    isLoading: isLoadingMembers || isLoadingCurrentUserProfile || isLoadingCurrentUser || isLoadingMemberWorkouts,
    isFetchingBackground,
    refreshDataInBackground
  };
};
