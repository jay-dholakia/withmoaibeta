
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WeekProgressBar } from './WeekProgressBar';
import { Loader2, Users, UserRound, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { WorkoutType } from './WorkoutTypeIcon';

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
}

const MoaiGroupProgress: React.FC<MemberProgressProps> = ({ groupId }) => {
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
                .select('id, completed_at, life_happens_pass')
                .eq('user_id', member.user_id)
                .not('completed_at', 'is', null);
              
              // Get assigned workouts count for the current week
              const { data: assignedCount, error: countError } = await supabase
                .rpc('count_workouts_for_user_and_week', {
                  user_id: member.user_id,
                  week_number: null // null means current week
                });
              
              const completedDates: Date[] = [];
              const lifeHappensDates: Date[] = [];
              
              if (completions) {
                completions.forEach(completion => {
                  if (completion.completed_at) {
                    const date = new Date(completion.completed_at);
                    if (completion.life_happens_pass) {
                      lifeHappensDates.push(date);
                    } else {
                      completedDates.push(date);
                    }
                  }
                });
              }
              
              return {
                userId: member.user_id,
                firstName: profile?.first_name || null,
                lastName: profile?.last_name || null,
                avatarUrl: profile?.avatar_url || null,
                completedDates,
                lifeHappensDates,
                totalAssigned: assignedCount || 4, // Default to 4 if count not available
                isCurrentUser: false // Will be set later
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
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!groupMembers || groupMembers.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Users className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
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
        <div key={member.userId} className="space-y-1">
          <div className="flex items-center mb-2">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src={member.avatarUrl || ''} />
              <AvatarFallback className="bg-client/80 text-white">
                {member.firstName ? member.firstName.charAt(0) : '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {member.firstName ? `${member.firstName} ${member.lastName?.charAt(0) || ''}` : 'Anonymous'}
                {member.isCurrentUser && <span className="text-xs text-muted-foreground ml-1">(You)</span>}
              </p>
            </div>
          </div>
          
          <WeekProgressBar 
            completedDates={member.completedDates}
            lifeHappensDates={member.lifeHappensDates}
            count={member.completedDates.length + member.lifeHappensDates.length}
            total={member.totalAssigned}
            showProgressBar={true}
            showDayCircles={false}
            compact={true}
          />
        </div>
      ))}
    </div>
  );
};

export default MoaiGroupProgress;
