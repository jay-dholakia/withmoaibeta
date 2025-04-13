
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday } from 'date-fns';
import { Loader2, Calendar } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { MonthlyCalendarView } from './MonthlyCalendarView';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MoaiGroupProgressProps {
  groupId: string;
  currentProgram?: any;
}

const MoaiGroupProgress: React.FC<MoaiGroupProgressProps> = ({ groupId, currentProgram }) => {
  const { user } = useAuth();
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  
  // Fetch group members
  const { isLoading: isLoadingMembers } = useQuery({
    queryKey: ['moai-group-members', groupId],
    queryFn: async () => {
      if (!groupId) return [];
      
      const { data: members, error } = await supabase
        .from('group_members')
        .select(`
          id,
          user_id,
          user:user_id (
            id, 
            email
          ),
          client_profile:user_id (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('group_id', groupId);
      
      if (error) {
        console.error('Error fetching group members:', error);
        return [];
      }
      
      setGroupMembers(members || []);
      return members || [];
    },
    enabled: !!groupId,
  });

  // Fetch workout data for all members
  const { data: memberWorkoutsMap, isLoading: isLoadingWorkouts } = useQuery({
    queryKey: ['member-workouts', groupMembers.map(m => m.user_id).join('-')],
    queryFn: async () => {
      if (!groupMembers.length) return {};
      
      const workoutsMap: Record<string, any[]> = {};
      
      // Fetch workout data for each member
      await Promise.all(
        groupMembers.map(async (member) => {
          try {
            const workouts = await fetchClientWorkoutHistory(member.user_id);
            workoutsMap[member.user_id] = workouts;
          } catch (error) {
            console.error(`Error fetching workouts for user ${member.user_id}:`, error);
            workoutsMap[member.user_id] = [];
          }
        })
      );
      
      return workoutsMap;
    },
    enabled: groupMembers.length > 0,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Generate workout types map for calendar visualization
  const generateWorkoutTypesMap = (workouts: any[]) => {
    const typesMap: Record<string, string> = {};
    
    workouts.forEach(workout => {
      if (workout.completed_at) {
        try {
          const dateKey = format(new Date(workout.completed_at), 'yyyy-MM-dd');
          
          if (workout.life_happens_pass || workout.rest_day) {
            typesMap[dateKey] = 'rest_day';
            return;
          }
          
          const workoutType = workout.workout_type || workout.workout?.workout_type;
          if (workoutType) {
            const type = workoutType.toLowerCase();
            if (type.includes('strength')) typesMap[dateKey] = 'strength';
            else if (type.includes('cardio') || type.includes('run')) typesMap[dateKey] = 'cardio';
            else if (type.includes('body') || type.includes('weight')) typesMap[dateKey] = 'bodyweight';
            else if (type.includes('flex') || type.includes('yoga')) typesMap[dateKey] = 'flexibility';
            else typesMap[dateKey] = 'custom';
          } else {
            typesMap[dateKey] = 'strength';
          }
        } catch (error) {
          console.error('Error processing workout date:', error);
        }
      }
    });
    
    return typesMap;
  };
  
  if (isLoadingMembers || isLoadingWorkouts) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-client" />
        <span className="ml-2">Loading team workout data...</span>
      </div>
    );
  }

  if (!groupMembers || groupMembers.length === 0) {
    return (
      <div className="p-6 text-center">
        <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <p className="text-muted-foreground">No members in this group yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      <h3 className="text-lg font-medium text-center mb-4">Team Workout Calendars</h3>
      
      {groupMembers.map((member) => {
        const memberWorkouts = memberWorkoutsMap?.[member.user_id] || [];
        const workoutTypesMap = generateWorkoutTypesMap(memberWorkouts);
        const firstName = member.client_profile?.first_name || '';
        const lastName = member.client_profile?.last_name || '';
        const displayName = `${firstName} ${lastName}`.trim() || member.user?.email?.split('@')[0] || 'Team Member';
        const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || displayName[0]?.toUpperCase() || 'TM';
        
        return (
          <Card key={member.user_id} className="mb-6">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={member.client_profile?.avatar_url} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-base">{displayName}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <MonthlyCalendarView 
                workouts={memberWorkouts}
                workoutTypesMap={workoutTypesMap}
                showWorkoutTooltips={true}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MoaiGroupProgress;
