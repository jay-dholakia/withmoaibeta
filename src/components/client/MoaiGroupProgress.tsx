
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { WorkoutType } from './WorkoutTypeIcon';
import { useAuth } from '@/contexts/AuthContext';
import { format, isThisWeek } from 'date-fns';
import { WorkoutProgressCard } from './WorkoutProgressCard';

interface MemberProgressProps {
  groupId: string;
}

interface GroupMember {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  completedDates: Date[];
  lifeHappensDates: Date[];
  totalAssigned: number;
  isCurrentUser: boolean;
  workoutTypes?: Record<string, WorkoutType>;
}

const MoaiGroupProgress: React.FC<MemberProgressProps> = ({ groupId }) => {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch group members
  const { data: groupMembers, isLoading, refetch } = useQuery({
    queryKey: ['moai-members-progress', groupId],
    queryFn: async () => {
      try {
        // First get the members in this group
        const { data: members, error: membersError } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', groupId);
        
        if (membersError) {
          console.error('Error fetching group members:', membersError);
          throw membersError;
        }
        
        if (!members || members.length === 0) {
          return [];
        }
        
        // Fetch profile data for each member
        const memberDetails = await Promise.all(
          members.map(async (member) => {
            try {
              // Get basic profile info
              const { data: profile } = await supabase
                .from('client_profiles')
                .select('first_name, last_name, avatar_url')
                .eq('id', member.user_id)
                .maybeSingle();
              
              // Get workout completion data
              const { data: completions } = await supabase
                .from('workout_completions')
                .select('id, completed_at, life_happens_pass, rest_day, workout:workout_id(workout_type, title)')
                .eq('user_id', member.user_id)
                .not('completed_at', 'is', null);
              
              // Get assigned workouts count for the current week
              const { data: assignedCount, error: countError } = await supabase
                .rpc('count_workouts_for_user_and_week', {
                  user_id_param: member.user_id,
                  week_number_param: null // null means current week
                });
              
              const completedDates: Date[] = [];
              const lifeHappensDates: Date[] = [];
              const workoutTypes: Record<string, WorkoutType> = {};
              
              if (completions) {
                completions.forEach(completion => {
                  if (completion.completed_at) {
                    const date = new Date(completion.completed_at);
                    const dateKey = format(date, 'yyyy-MM-dd');
                    
                    if (completion.life_happens_pass || completion.rest_day) {
                      lifeHappensDates.push(date);
                      workoutTypes[dateKey] = 'rest_day';
                    } else {
                      completedDates.push(date);
                      
                      // Map workout types
                      if (completion.workout?.workout_type) {
                        const type = String(completion.workout.workout_type).toLowerCase();
                        if (type.includes('strength')) workoutTypes[dateKey] = 'strength';
                        else if (type.includes('cardio')) workoutTypes[dateKey] = 'cardio';
                        else if (type.includes('body')) workoutTypes[dateKey] = 'bodyweight';
                        else if (type.includes('flex')) workoutTypes[dateKey] = 'flexibility';
                        else workoutTypes[dateKey] = 'custom';
                      } else if (completion.workout?.title) {
                        // Try to determine from title
                        const title = completion.workout.title.toLowerCase();
                        if (title.includes('strength')) workoutTypes[dateKey] = 'strength';
                        else if (title.includes('cardio') || title.includes('run')) workoutTypes[dateKey] = 'cardio';
                        else if (title.includes('body') || title.includes('weight')) workoutTypes[dateKey] = 'bodyweight';
                        else if (title.includes('flex') || title.includes('yoga')) workoutTypes[dateKey] = 'flexibility';
                        else workoutTypes[dateKey] = 'strength'; // Default
                      } else {
                        workoutTypes[dateKey] = 'strength'; // Default
                      }
                    }
                  }
                });
              }
              
              // Count completions for this week only
              const thisWeekCompletedCount = completedDates.filter(date => 
                isThisWeek(date, { weekStartsOn: 1 })
              ).length;
              
              const thisWeekLifeHappensCount = lifeHappensDates.filter(date => 
                isThisWeek(date, { weekStartsOn: 1 })
              ).length;
              
              const totalThisWeek = thisWeekCompletedCount + thisWeekLifeHappensCount;
              
              return {
                userId: member.user_id,
                firstName: profile?.first_name || null,
                lastName: profile?.last_name || null,
                avatarUrl: profile?.avatar_url || null,
                completedDates,
                lifeHappensDates,
                workoutTypes,
                totalAssigned: assignedCount || 4, // Default to 4 if count not available
                totalThisWeek,
                isCurrentUser: member.user_id === user?.id
              };
            } catch (error) {
              console.error('Error fetching member data:', error);
              return null;
            }
          })
        );
        
        // Remove null entries and sort by name
        return memberDetails
          .filter(Boolean)
          .sort((a, b) => {
            if (a.isCurrentUser) return -1;
            if (b.isCurrentUser) return 1;
            return (a.firstName || '') > (b.firstName || '') ? 1 : -1;
          });
      } catch (error) {
        console.error('Error in fetchMembersProgress:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-[150px] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!groupMembers || groupMembers.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No members found in this group.</p>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm" 
            className="mt-4"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm" 
          className="text-xs"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-3 w-3 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {groupMembers.map((member) => (
        <WorkoutProgressCard
          key={member.userId}
          label="Progress"
          userName={member.firstName ? `${member.firstName} ${member.lastName?.charAt(0) || ''}` : 'Anonymous'}
          isCurrentUser={member.isCurrentUser}
          completedDates={member.completedDates.filter(date => isThisWeek(date, { weekStartsOn: 1 }))}
          lifeHappensDates={member.lifeHappensDates.filter(date => isThisWeek(date, { weekStartsOn: 1 }))}
          count={member.totalThisWeek || 0}
          total={member.totalAssigned}
          workoutTypesMap={member.workoutTypes}
        />
      ))}
    </div>
  );
};

export default MoaiGroupProgress;
