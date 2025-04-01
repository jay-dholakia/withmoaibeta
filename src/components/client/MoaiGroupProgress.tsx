
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
  
  // Query for assigned workout count
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
  
  // Get current user's profile data
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
  
  // Query for group members
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
  
  // Map to store member workout data
  const [memberWorkouts, setMemberWorkouts] = useState<Record<string, {
    completedDates: Date[];
    lifeHappensDates: Date[];
    workoutTypesMap: Record<string, WorkoutType>;
  }>>({});
  
  // Query client workouts for current user
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
  
  // Process current user workouts
  useEffect(() => {
    if (currentUserWorkouts && currentUserWorkouts.length > 0) {
      const newCompletedDates: Date[] = [];
      const newLifeHappensDates: Date[] = [];
      const newWorkoutTypesMap: Record<string, WorkoutType> = {};
      
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
                return;
              }
              
              newCompletedDates.push(completionDate);
              
              // Determine workout type
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
          } catch (error) {
            console.error('Error processing workout completion date:', error);
          }
        }
      });
      
      setCompletedDates(newCompletedDates);
      setLifeHappensDates(newLifeHappensDates);
      setWorkoutTypesMap(newWorkoutTypesMap);
    }
  }, [currentUserWorkouts]);
  
  // Fetch other group members' workouts
  useEffect(() => {
    if (groupMembers && groupMembers.length > 0) {
      const fetchMemberWorkouts = async () => {
        const memberWorkoutsData: Record<string, {
          completedDates: Date[];
          lifeHappensDates: Date[];
          workoutTypesMap: Record<string, WorkoutType>;
        }> = {};
        
        // Process each member (except current user)
        for (const member of groupMembers.filter(m => !m.isCurrentUser)) {
          try {
            const workouts = await fetchClientWorkoutHistory(member.userId);
            
            const completedDates: Date[] = [];
            const lifeHappensDates: Date[] = [];
            const workoutTypesMap: Record<string, WorkoutType> = {};
            
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
                      return;
                    }
                    
                    completedDates.push(completionDate);
                    
                    // Determine workout type
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
                } catch (error) {
                  console.error('Error processing member workout date:', error);
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
  
  // Get formatted display name for a member
  const getDisplayName = (member: GroupMember): string => {
    if (member.profileData?.first_name) {
      return member.profileData.first_name;
    }
    return member.email.split('@')[0];
  };
  
  // Get current user's display name
  const getCurrentUserDisplayName = (): string => {
    // First try to use the profile data from the dedicated query
    if (currentUserProfile?.first_name) {
      return currentUserProfile.first_name;
    }
    
    // Then try to use the profile data from Auth context
    if (profile?.user_type) {
      // This assumes there might be a first_name field in the profile
      const firstName = (profile as any).first_name;
      if (firstName) return firstName;
    }
    
    // Fall back to email if available
    if (user?.email) {
      return user.email.split('@')[0];
    }
    
    // Ultimate fallback
    return "You";
  };
  
  // Count workouts completed this week
  const completedThisWeek = completedDates.filter(date => isThisWeek(date, { weekStartsOn: 1 })).length;
  
  // Count life happens passes used this week
  const lifeHappensThisWeek = lifeHappensDates.filter(date => isThisWeek(date, { weekStartsOn: 1 })).length;
  
  // Total completed including life happens
  const totalCompletedThisWeek = completedThisWeek + lifeHappensThisWeek;
  
  const totalWorkouts = assignedWorkoutsCount || 6; // Default to 6 if undefined
  
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
          userName={getCurrentUserDisplayName()}
          isCurrentUser={true}
        />
      )}
      
      {/* Other group members progress cards */}
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
