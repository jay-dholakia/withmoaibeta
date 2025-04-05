
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import RunGoalsProgressCard from './RunGoalsProgressCard';
import { WorkoutProgressCard } from './WorkoutProgressCard';
import { format } from 'date-fns';

interface MoaiGroupProgressProps {
  groupId: string;
}

const MoaiGroupProgress: React.FC<MoaiGroupProgressProps> = ({ groupId }) => {
  const { user } = useAuth();
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  
  const { data: groupMembers, isLoading } = useQuery({
    queryKey: ['moai-group-members', groupId],
    queryFn: async () => {
      try {
        // Get members of the group
        const { data: memberData, error: memberError } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', groupId);
          
        if (memberError) throw memberError;
        
        if (!memberData || memberData.length === 0) {
          return [];
        }
        
        // Get profile information for each member
        const membersWithProfiles = await Promise.all(
          memberData.map(async (member) => {
            try {
              const { data: profile } = await supabase
                .from('client_profiles')
                .select('first_name, last_name, avatar_url')
                .eq('id', member.user_id)
                .maybeSingle();
                
              // Get this week's completed workouts
              const { data: workouts } = await supabase
                .from('workout_completions')
                .select('*')
                .eq('user_id', member.user_id)
                .gte('completed_at', new Date(new Date().setDate(new Date().getDate() - 7)).toISOString());
              
              return {
                userId: member.user_id,
                isCurrentUser: member.user_id === user?.id,
                firstName: profile?.first_name || 'Unknown',
                lastName: profile?.last_name || 'User',
                avatarUrl: profile?.avatar_url,
                workoutsCompleted: workouts?.length || 0
              };
            } catch (error) {
              console.error('Error fetching member details:', error);
              return {
                userId: member.user_id,
                isCurrentUser: member.user_id === user?.id,
                firstName: 'Unknown',
                lastName: 'User',
                workoutsCompleted: 0
              };
            }
          })
        );
        
        // Sort members with current user first, then by name
        return membersWithProfiles.sort((a, b) => {
          if (a.isCurrentUser) return -1;
          if (b.isCurrentUser) return 1;
          
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
          
          return nameA.localeCompare(nameB);
        });
      } catch (error) {
        console.error('Error fetching group progress data:', error);
        throw error;
      }
    }
  });
  
  // Fetch completed workouts for each member
  const { data: memberWorkouts } = useQuery({
    queryKey: ['moai-member-workouts', groupId, groupMembers],
    queryFn: async () => {
      if (!groupMembers || groupMembers.length === 0) return {};
      
      const workoutsMap: Record<string, any> = {};
      
      for (const member of groupMembers) {
        try {
          // Get workouts completed in the last 7 days
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          
          const { data: workouts } = await supabase
            .from('workout_completions')
            .select('*')
            .eq('user_id', member.userId)
            .gte('completed_at', startDate.toISOString());
            
          if (workouts) {
            // Process workouts for WorkoutProgressCard component
            const completedDates = workouts
              .filter(w => !w.rest_day && !w.life_happens_pass)
              .map(w => new Date(w.completed_at));
              
            const lifeHappensDates = workouts
              .filter(w => w.rest_day || w.life_happens_pass)
              .map(w => new Date(w.completed_at));
            
            // Create a map of workout types for each day
            const workoutTypesMap: Record<string, string> = {};
            const workoutTitlesMap: Record<string, string> = {};
            
            workouts.forEach(workout => {
              const dateStr = format(new Date(workout.completed_at), 'yyyy-MM-dd');
              
              if (!workout.rest_day && !workout.life_happens_pass) {
                workoutTypesMap[dateStr] = workout.workout_type || 'custom';
                workoutTitlesMap[dateStr] = workout.title || 'Workout';
              }
            });
            
            workoutsMap[member.userId] = {
              completedDates,
              lifeHappensDates,
              count: completedDates.length,
              workoutTypesMap,
              workoutTitlesMap
            };
          }
        } catch (error) {
          console.error(`Error fetching workouts for member ${member.userId}:`, error);
          workoutsMap[member.userId] = {
            completedDates: [],
            lifeHappensDates: [],
            count: 0,
            workoutTypesMap: {},
            workoutTitlesMap: {}
          };
        }
      }
      
      return workoutsMap;
    },
    enabled: !!groupMembers && groupMembers.length > 0
  });
  
  const { data: workoutHistory } = useQuery({
    queryKey: ['moai-workout-history', groupId, expandedCards],
    queryFn: async () => {
      const history: Record<string, any[]> = {};
      
      // Only fetch workout history for expanded cards
      const userIdsToFetch = Object.entries(expandedCards)
        .filter(([, isExpanded]) => isExpanded)
        .map(([userId]) => userId);
        
      if (userIdsToFetch.length === 0) return history;
      
      try {
        for (const userId of userIdsToFetch) {
          const { data: workouts } = await supabase
            .from('workout_completions')
            .select(`
              *,
              workout:workout_id (
                title,
                description
              )
            `)
            .eq('user_id', userId)
            .order('completed_at', { ascending: false })
            .limit(5);
            
          history[userId] = workouts || [];
        }
        
        return history;
      } catch (error) {
        console.error('Error fetching workout history:', error);
        return history;
      }
    },
    enabled: Object.values(expandedCards).some(isExpanded => isExpanded)
  });
  
  const toggleMemberCard = (userId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-8 h-8 animate-spin text-client" />
      </div>
    );
  }
  
  if (!groupMembers || groupMembers.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <p className="text-muted-foreground">No member data available.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {groupMembers.map(member => (
        <Card key={member.userId} className={member.isCurrentUser ? "border-client/30" : ""}>
          <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleMemberCard(member.userId)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatarUrl || ''} alt={`${member.firstName} ${member.lastName}`} />
                  <AvatarFallback className="bg-client/80 text-white">
                    {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">
                    {member.firstName} {member.lastName.charAt(0)}.
                    {member.isCurrentUser && <span className="text-xs text-muted-foreground ml-2">(You)</span>}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {member.workoutsCompleted} workout{member.workoutsCompleted !== 1 ? 's' : ''} this week
                  </p>
                </div>
              </div>
              <div className="text-2xl">
                {expandedCards[member.userId] ? '−' : '+'}
              </div>
            </div>
          </CardHeader>
          
          {!expandedCards[member.userId] && memberWorkouts && memberWorkouts[member.userId] && (
            <CardContent className="pt-0 pb-4">
              <WorkoutProgressCard
                label={`${member.firstName}'s Progress`}
                count={memberWorkouts[member.userId].count}
                total={6}
                completedDates={memberWorkouts[member.userId].completedDates || []}
                lifeHappensDates={memberWorkouts[member.userId].lifeHappensDates || []}
                workoutTypesMap={memberWorkouts[member.userId].workoutTypesMap || {}}
                workoutTitlesMap={memberWorkouts[member.userId].workoutTitlesMap || {}}
                userName={`${member.firstName} ${member.lastName.charAt(0)}.`}
                isCurrentUser={member.isCurrentUser}
              />
            </CardContent>
          )}
          
          {expandedCards[member.userId] && (
            <CardContent>
              <RunGoalsProgressCard userId={member.userId} showTitle={false} />
              
              <div className="mt-4">
                <WorkoutProgressCard
                  label={`${member.firstName}'s Progress`}
                  count={memberWorkouts?.[member.userId]?.count || 0}
                  total={6}
                  completedDates={memberWorkouts?.[member.userId]?.completedDates || []}
                  lifeHappensDates={memberWorkouts?.[member.userId]?.lifeHappensDates || []}
                  workoutTypesMap={memberWorkouts?.[member.userId]?.workoutTypesMap || {}}
                  workoutTitlesMap={memberWorkouts?.[member.userId]?.workoutTitlesMap || {}}
                  userName={`${member.firstName} ${member.lastName.charAt(0)}.`}
                  isCurrentUser={member.isCurrentUser}
                />
              </div>
              
              <div className="mt-4 pt-2 border-t">
                <h4 className="text-sm font-medium mb-2">Recent Workouts</h4>
                
                {workoutHistory?.[member.userId]?.length ? (
                  <div className="space-y-3">
                    {workoutHistory[member.userId].map(workout => (
                      <div key={workout.id} className="bg-muted/40 p-3 rounded-md">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium text-sm">
                              {workout.workout?.title || "Custom Workout"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(workout.completed_at).toLocaleDateString(undefined, { 
                                weekday: 'short',
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                        {workout.notes && (
                          <p className="text-xs italic mt-1 text-muted-foreground">{workout.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center py-4 text-muted-foreground">
                    No recent workout history
                  </p>
                )}
                
                {member.isCurrentUser && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3 flex items-center justify-center"
                    onClick={() => window.location.href = '/client-dashboard/workouts'}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Log Workout
                  </Button>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

export default MoaiGroupProgress;
