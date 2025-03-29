
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, UserRound, Trophy, Calendar, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import MoaiMemberItem from './MoaiMemberItem';
import { format } from 'date-fns';

interface MemberProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  state: string | null;
  birthday: string | null;
  height: string | null;
  weight: string | null;
  avatar_url: string | null;
  fitness_goals: string[] | null;
  favorite_movements: string[] | null;
  event_type: string | null;
  event_date: string | null;
  event_name: string | null;
}

const movementEmojis: Record<string, string> = {
  'Walking': '🚶',
  'Running': '🏃',
  'Swimming': '🏊',
  'Cycling': '🚴',
  'Weight Training': '🏋️',
  'Yoga': '🧘',
  'Dance': '💃',
  'Hiking': '🥾',
  'Basketball': '🏀',
  'Soccer': '⚽',
  'Tennis': '🎾',
  'Volleyball': '🏐',
  'Pilates': '🤸',
  'CrossFit': '💪',
  'Martial Arts': '🥋',
  'Rock Climbing': '🧗',
  'Skating': '⛸️',
  'Skiing': '⛷️',
  'Snowboarding': '🏂',
  'Rowing': '🚣',
  'Surfing': '🏄',
  'Golf': '🏌️',
  'Boxing': '🥊',
  'Paddleboarding': '🏄‍♂️',
  'Trail Running': '🏞️',
  'Badminton': '🏸',
  'Table Tennis': '🏓',
  'Baseball': '⚾',
  'Cricket': '🏏',
  'Rugby': '🏉',
  'Football': '🏈',
  'Archery': '🏹',
  'Horseback Riding': '🏇',
  'Gymnastics': '🤸‍♀️',
  'Parkour': '🧱',
  'Skateboarding': '🛹',
  'Ice Hockey': '🏒',
  'Handball': '🤾',
  'Diving': '🤿',
  'Fencing': '🤺',
};

interface MemberWorkout {
  id: string;
  workout_id: string;
  completed_at: string;
  rating: number | null;
  notes: string | null;
  workout: {
    title: string;
    description: string | null;
  } | null;
}

interface MoaiMembersTabProps {
  groupId: string;
}

const MoaiMembersTab: React.FC<MoaiMembersTabProps> = ({ groupId }) => {
  const { user } = useAuth();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  
  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['moai-members', groupId],
    queryFn: async () => {
      const { data: groupMembers, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);
      
      if (membersError) {
        console.error('Error fetching group members:', membersError);
        throw membersError;
      }
      
      const memberData = await Promise.all(
        groupMembers.map(async (member) => {
          try {
            const { data: profile } = await supabase
              .from('client_profiles')
              .select('first_name, last_name, avatar_url')
              .eq('id', member.user_id)
              .maybeSingle();
              
            const email = `user_${member.user_id.substring(0, 8)}@example.com`;
            
            return {
              userId: member.user_id,
              email,
              isCurrentUser: member.user_id === user?.id,
              profileData: profile
            };
          } catch (error) {
            console.error('Error fetching member profile:', error);
            return {
              userId: member.user_id,
              email: `user_${member.user_id.substring(0, 8)}@example.com`,
              isCurrentUser: member.user_id === user?.id
            };
          }
        })
      );
      
      return memberData;
    }
  });
  
  const { data: memberProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['member-profile', selectedMember],
    queryFn: async () => {
      if (!selectedMember) throw new Error('No member selected');
      
      const { data, error } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('id', selectedMember)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching member profile:', error);
        throw error;
      }
      
      return data as MemberProfile;
    },
    enabled: !!selectedMember
  });
  
  const { data: memberWorkouts, isLoading: isLoadingWorkouts } = useQuery({
    queryKey: ['member-workouts', selectedMember],
    queryFn: async () => {
      if (!selectedMember) throw new Error('No member selected');
      
      const { data, error } = await supabase
        .from('workout_completions')
        .select(`
          *,
          workout:workout_id (
            title,
            description
          )
        `)
        .eq('user_id', selectedMember)
        .order('completed_at', { ascending: false })
        .limit(10);
        
      if (error) {
        console.error('Error fetching member workouts:', error);
        throw error;
      }
      
      return data as MemberWorkout[];
    },
    enabled: !!selectedMember
  });
  
  const formatDisplayName = (firstName: string | null, lastName: string | null): string => {
    if (!firstName) return '';
    // Format name to first name and first initial of last name with period
    const formattedLastName = lastName ? `${lastName.charAt(0)}.` : '';
    return `${firstName} ${formattedLastName}`.trim();
  };

  const formatEventDate = (dateString: string | null): string => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Determine if the current user is viewing their own profile
  const isOwnProfile = selectedMember === user?.id;

  if (isLoadingMembers) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-8 h-8 animate-spin text-client" />
      </div>
    );
  }
  
  if (!members || members.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No members found in this group.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (selectedMember) {
    return (
      <div className="space-y-4 mt-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-2"
          onClick={() => setSelectedMember(null)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Members
        </Button>
        
        {isLoadingProfile ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-client" />
          </div>
        ) : (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="profile">
                <UserRound className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="workouts">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Workouts</span>
              </TabsTrigger>
              <TabsTrigger value="progress">
                <Trophy className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Progress</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-xl font-semibold text-center">
                    {formatDisplayName(memberProfile?.first_name, memberProfile?.last_name)}
                    {isOwnProfile && <Badge className="ml-2">You</Badge>}
                  </CardTitle>
                  {(memberProfile?.city || memberProfile?.state) && (
                    <p className="text-muted-foreground text-center mt-1">
                      {memberProfile.city}{memberProfile.city && memberProfile.state ? ', ' : ''}{memberProfile.state}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {memberProfile ? (
                    <>
                      {/* Event preparation section - should always be visible */}
                      {memberProfile.event_type && memberProfile.event_type !== 'none' && (
                        <div className="text-center">
                          <p className="text-sm font-medium">
                            Preparing for{' '}
                            {memberProfile.event_name ? (
                              <span className="font-semibold">{memberProfile.event_name}</span>
                            ) : (
                              <span>{memberProfile.event_type}</span>
                            )}
                            {memberProfile.event_date && (
                              <> on {formatEventDate(memberProfile.event_date)}</>
                            )}
                          </p>
                        </div>
                      )}
                    
                      {/* Height and weight section - only show if looking at own profile or if data exists */}
                      {(isOwnProfile || (memberProfile.height || memberProfile.weight)) && (
                        <div className="flex justify-center gap-6">
                          {memberProfile.height && (
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Height</p>
                              <p className="font-medium">{memberProfile.height}</p>
                            </div>
                          )}
                          
                          {memberProfile.weight && (
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Weight</p>
                              <p className="font-medium">{memberProfile.weight}</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {!isOwnProfile && !(memberProfile.height || memberProfile.weight) && (
                        <div className="flex justify-center py-2">
                          <div className="flex items-center text-muted-foreground text-sm">
                            <ShieldCheck className="h-4 w-4 mr-1.5" />
                            <span>Physical stats are private</span>
                          </div>
                        </div>
                      )}
                      
                      <Separator className="my-4" />
                      
                      {memberProfile.fitness_goals && memberProfile.fitness_goals.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 text-center">Fitness Goals</h4>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {memberProfile.fitness_goals.map(goal => (
                              <Badge key={goal} variant="secondary">{goal}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {memberProfile.favorite_movements && memberProfile.favorite_movements.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 text-center">Favorite Movements</h4>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {memberProfile.favorite_movements.map(movement => (
                              <Badge key={movement} variant="outline">
                                {movementEmojis[movement] || ''} {movement}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground">Profile information not available.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="workouts">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Workouts</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingWorkouts ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-client" />
                    </div>
                  ) : memberWorkouts && memberWorkouts.length > 0 ? (
                    <div className="space-y-3">
                      {memberWorkouts.map(workout => (
                        <Card key={workout.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">
                                  {workout.workout?.title || 'Untitled Workout'}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(workout.completed_at).toLocaleDateString(undefined, {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                              
                              {workout.rating && (
                                <Badge variant="outline">
                                  Rating: {workout.rating}/5
                                </Badge>
                              )}
                            </div>
                            
                            {workout.notes && (
                              <div className="mt-2 text-sm border-l-2 border-client/30 pl-3 italic">
                                {workout.notes}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-6">No workout history available.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="progress">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Progress & Achievements</CardTitle>
                </CardHeader>
                <CardContent className="py-6 text-center">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Progress tracking coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-3 mt-4">
      {members.map(member => (
        <MoaiMemberItem 
          key={member.userId} 
          member={member} 
          onClick={() => setSelectedMember(member.userId)}
        />
      ))}
    </div>
  );
};

export default MoaiMembersTab;
