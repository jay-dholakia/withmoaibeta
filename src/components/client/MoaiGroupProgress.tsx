import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { getWeeklyRunProgress } from '@/services/run-goals-service';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { WorkoutTypeIcon, WorkoutType } from './WorkoutTypeIcon';

interface MoaiGroupProgressProps {
  groupId: string;
}

const MoaiGroupProgress: React.FC<MoaiGroupProgressProps> = ({ groupId }) => {
  const { user } = useAuth();
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  
  // Get the group details first to check if it's a run group
  const { data: groupData } = useQuery({
    queryKey: ['moai-group-data', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('name, description, program_type')
        .eq('id', groupId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });
  
  // Determine if this is a run group by name pattern
  const isRunGroup = groupData?.name?.toLowerCase().includes('run') || 
                    groupData?.program_type === 'run';
  
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
            .select('*, workout:workouts(*)')
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
            const workoutTypesMap: Record<string, WorkoutType> = {};
            const workoutTitlesMap: Record<string, string> = {};
            
            workouts.forEach(workout => {
              const dateStr = format(new Date(workout.completed_at), 'yyyy-MM-dd');
              
              if (!workout.rest_day && !workout.life_happens_pass) {
                const workoutType = determineWorkoutType(workout);
                workoutTypesMap[dateStr] = workoutType;
                
                // Use the actual title from the workout or the completion record
                const title = workout.title || 
                              (workout.workout && workout.workout.title) || 
                              'Workout';
                workoutTitlesMap[dateStr] = title;
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

  // Helper function to determine the workout type based on the workout data
  const determineWorkoutType = (workout: any): WorkoutType => {
    if (workout.rest_day || workout.life_happens_pass) {
      return 'rest_day';
    }
    
    // First check workout titles for specific activities
    const title = (workout.title || workout.workout?.title || '').toLowerCase();
    
    if (title.includes('tennis') || title.includes('soccer') || 
        title.includes('football') || title.includes('basketball') || 
        title.includes('volleyball') || title.includes('baseball') || 
        title.includes('golf') || title.includes('game') || 
        title.includes('match') || title.includes('play')) return 'sport';
      
    if (title.includes('run') || title.includes('jog')) return 'cardio';
    if (title.includes('swim')) return 'swimming';
    if (title.includes('cycl') || title.includes('bike')) return 'cycling';
    if (title.includes('dance')) return 'dance';
    if (title.includes('yoga') || title.includes('stretch')) return 'flexibility';
    if (title.includes('hiit')) return 'hiit';
    if (title.includes('strength') || title.includes('weight')) return 'strength';
    if (title.includes('bodyweight')) return 'bodyweight';
    
    // Then check explicit workout types
    if (workout.workout_type) {
      const type = workout.workout_type.toLowerCase();
      if (type === 'sport') return 'sport';
      if (type === 'strength') return 'strength';
      if (type === 'cardio') return 'cardio';
      if (type === 'bodyweight') return 'bodyweight';
      if (type === 'flexibility') return 'flexibility';
      if (type === 'hiit') return 'hiit';
      if (type === 'swimming') return 'swimming';
      if (type === 'cycling') return 'cycling';
      if (type === 'dance') return 'dance';
      if (type === 'custom') return 'custom';
      if (type === 'one_off') return 'one_off';
    }
    
    // Then check workout types from the workout object
    if (workout.workout?.workout_type) {
      const workoutType = workout.workout.workout_type.toLowerCase();
      if (workoutType.includes('sport') || 
          workoutType.includes('tennis') || 
          workoutType.includes('soccer') || 
          workoutType.includes('game') || 
          workoutType.includes('match')) {
        return 'sport';
      }
      
      if (workoutType === 'strength') return 'strength';
      if (workoutType === 'cardio') return 'cardio';
      if (workoutType === 'bodyweight') return 'bodyweight';
      if (workoutType === 'flexibility') return 'flexibility';
      if (workoutType === 'hiit') return 'hiit';
      if (workoutType === 'swimming') return 'swimming';
      if (workoutType === 'cycling') return 'cycling';
      if (workoutType === 'dance') return 'dance';
      if (workoutType === 'custom') return 'custom';
      if (workoutType === 'one_off') return 'one_off';
    }
    
    // Lastly check workout descriptions for keywords
    const description = (workout.description || workout.workout?.description || '').toLowerCase();
    
    if (description.includes('tennis') || 
        description.includes('soccer') || 
        description.includes('basketball') || 
        description.includes('sport') || 
        description.includes('game') || 
        description.includes('match') || 
        description.includes('play')) {
      return 'sport';
    }
    
    if (description.includes('dance')) return 'dance';
    if (description.includes('swim')) return 'swimming';
    if (description.includes('cycl') || description.includes('bike')) return 'cycling';
    if (description.includes('hiit')) return 'hiit';
    if (description.includes('strength')) return 'strength';
    if (description.includes('cardio') || description.includes('run')) return 'cardio';
    if (description.includes('flex') || description.includes('stretch') || description.includes('yoga')) return 'flexibility';
    if (description.includes('bodyweight')) return 'bodyweight';
    
    return 'custom';
  };
  
  // Fetch run progress for each member (only used for run groups)
  const { data: memberProgress } = useQuery({
    queryKey: ['moai-member-progress', groupId, groupMembers],
    queryFn: async () => {
      if (!groupMembers || groupMembers.length === 0) return {};
      
      const progressMap: Record<string, any> = {};
      
      for (const member of groupMembers) {
        try {
          const progress = await getWeeklyRunProgress(member.userId);
          progressMap[member.userId] = progress;
        } catch (error) {
          console.error(`Error fetching progress for member ${member.userId}:`, error);
          progressMap[member.userId] = {
            miles: { completed: 0, goal: 0 },
            exercises: { completed: 0, goal: 0 },
            cardio: { completed: 0, goal: 0 }
          };
        }
      }
      
      return progressMap;
    },
    enabled: !!groupMembers && groupMembers.length > 0 && isRunGroup
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
        <div className="p-4">
          <p className="text-muted-foreground">No member data available.</p>
        </div>
      </Card>
    );
  }
  
  // Function to render progress bars (for run groups)
  const renderProgressBars = (userId: string) => {
    if (!isRunGroup) return null;
    
    const progress = memberProgress?.[userId];
    if (!progress) return null;
    
    const metrics = [
      { 
        label: "Weekly Miles", 
        completed: progress.miles.completed, 
        goal: progress.miles.goal,
        color: "bg-blue-400" 
      },
      { 
        label: "Weekly Exercises", 
        completed: progress.exercises.completed, 
        goal: progress.exercises.goal,
        color: "bg-green-400" 
      },
      { 
        label: "Weekly Cardio Minutes", 
        completed: progress.cardio.completed, 
        goal: progress.cardio.goal,
        color: "bg-purple-400" 
      }
    ];
    
    return (
      <div className="space-y-4 mt-4">
        {metrics.map((metric, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{metric.label}</span>
              <span>{metric.completed}/{metric.goal}</span>
            </div>
            <Progress 
              value={metric.goal > 0 ? (metric.completed / metric.goal) * 100 : 0} 
              className="h-2" 
              indicatorColor={metric.color} 
            />
          </div>
        ))}
      </div>
    );
  };
  
  const renderWeeklyWorkouts = (userId: string) => {
    const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const workouts = memberWorkouts?.[userId];
    
    if (!workouts) return null;
    
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Start from Monday
    
    return (
      <div className="mt-4">
        <h4 className="font-medium text-sm mb-2">Weekly Workouts</h4>
        
        <div className="space-y-2">
          {weekDays.map((day, index) => {
            const currentDay = new Date(weekStart);
            currentDay.setDate(weekStart.getDate() + index);
            
            const dateStr = format(currentDay, 'yyyy-MM-dd');
            
            // Find all workouts completed on this day
            const workoutsForThisDay = workouts.completedDates.filter(date => 
              new Date(date).toDateString() === currentDay.toDateString()
            );
            
            const isLifeHappens = workouts.lifeHappensDates.some(date => 
              new Date(date).toDateString() === currentDay.toDateString()
            );
            
            if (workoutsForThisDay.length === 0 && !isLifeHappens) {
              return null;
            }
            
            const workoutType = workouts.workoutTypesMap[dateStr] || 'strength';
            const workoutTitle = workouts.workoutTitlesMap[dateStr] || 'Workout';
            
            return (
              <div key={`detail-${index}`} className="flex items-center p-2 bg-slate-50 rounded-md">
                <div className="w-8 text-xs font-medium text-slate-500">{day}</div>
                {isLifeHappens ? (
                  <div className="flex items-center">
                    <div className="bg-yellow-50 p-1 rounded-full mr-2">
                      <WorkoutTypeIcon type="rest_day" />
                    </div>
                    <span className="text-sm">Rest Day</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <div className="bg-client/10 p-1 rounded-full mr-2">
                      <WorkoutTypeIcon type={workoutType} />
                    </div>
                    <span className="text-sm">
                      {workoutTitle}
                      {workoutsForThisDay.length > 1 && (
                        <span className="text-xs text-slate-500 ml-1">
                          (+{workoutsForThisDay.length - 1} more)
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            );
          }).filter(Boolean)}
          
          {!workouts.completedDates.length && !workouts.lifeHappensDates.length && (
            <div className="text-center text-sm text-slate-500 py-2">
              No workouts completed this week
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render weekly progress bubbles
  const renderWeeklyBubbles = (userId: string) => {
    const workouts = memberWorkouts?.[userId];
    if (!workouts) return null;
    
    const weekDays = [
      { shortName: 'M', fullName: 'Monday' },
      { shortName: 'T', fullName: 'Tuesday' },
      { shortName: 'W', fullName: 'Wednesday' },
      { shortName: 'T', fullName: 'Thursday' },
      { shortName: 'F', fullName: 'Friday' },
      { shortName: 'S', fullName: 'Saturday' },
      { shortName: 'S', fullName: 'Sunday' }
    ];
    
    const displayTotal = 6;
    
    return (
      <div className="mt-3">
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-client h-full rounded-full"
            style={{ width: `${Math.min(100, (workouts.count / displayTotal) * 100)}%` }}
          />
        </div>
        
        <div className="flex justify-between items-center mt-4 px-1">
          {weekDays.map((day, index) => {
            const today = new Date();
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay() + 1); // Start from Monday
            
            const currentDay = new Date(weekStart);
            currentDay.setDate(weekStart.getDate() + index);
            
            // Count how many workouts were completed on this day
            const workoutsCompletedToday = workouts.completedDates.filter(date => 
              new Date(date).toDateString() === currentDay.toDateString()
            ).length;
            
            const isDayCompleted = workoutsCompletedToday > 0;
            
            const isLifeHappens = workouts.lifeHappensDates.some(date => 
              new Date(date).toDateString() === currentDay.toDateString()
            );
            
            const isToday = today.toDateString() === currentDay.toDateString();
            
            // Format date to get the correct workout type from map
            const dateStr = format(currentDay, 'yyyy-MM-dd');
            let workoutType: WorkoutType = workouts.workoutTypesMap[dateStr];
            
            // Fallback to defaults if no workout type
            if (!workoutType) {
              workoutType = isLifeHappens ? 'rest_day' : 'strength';
            }
            
            // Use lighter background colors for better emoji visibility
            let bgColor = 'bg-slate-50';
            
            if (isLifeHappens) {
              bgColor = 'bg-yellow-50';
            }
            
            if (isDayCompleted) {
              bgColor = 'bg-client/10';
            }
            
            return (
              <div key={index} className="flex flex-col items-center">
                <div className={`relative w-7 h-7 rounded-full flex items-center justify-center ${bgColor} border border-slate-200`}>
                  {(isDayCompleted || isLifeHappens) ? (
                    <WorkoutTypeIcon type={workoutType} size="sm" />
                  ) : (
                    <span></span>
                  )}
                  
                  {/* Make the superscript more visible with enhanced styling */}
                  {workoutsCompletedToday > 1 && (
                    <div className="absolute -top-1.5 -right-1.5 bg-client text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm z-10 font-bold">
                      {workoutsCompletedToday}
                    </div>
                  )}
                </div>
                
                {/* Day of week label moved below the circle */}
                <span className="text-xs font-medium text-slate-600 mt-1">{day.shortName}</span>
                
                {/* Current day indicator */}
                {isToday && (
                  <div className="w-1.5 h-1.5 bg-client rounded-full mt-0.5"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      {groupMembers.map(member => (
        <Card key={member.userId} className={member.isCurrentUser ? "border-client/30" : ""}>
          <div className={`p-4 ${expandedCards[member.userId] ? "pb-2" : "pb-4"} cursor-pointer`} onClick={() => toggleMemberCard(member.userId)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatarUrl || ''} alt={`${member.firstName} ${member.lastName}`} />
                  <AvatarFallback className="bg-client/80 text-white">
                    {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-base font-semibold">
                    {member.firstName} {member.lastName.charAt(0)}.
                    {member.isCurrentUser && <span className="text-xs text-muted-foreground ml-2">(You)</span>}
                  </h3>
                </div>
              </div>
              <div className="text-2xl">
                {expandedCards[member.userId] ? '−' : '+'}
              </div>
            </div>

            {/* Always show weekly bubbles */}
            {memberWorkouts && memberWorkouts[member.userId] && renderWeeklyBubbles(member.userId)}
          </div>
          
          {/* Show expanded content when card is expanded */}
          {expandedCards[member.userId] && (
            <div className="px-4 pb-4">
              {/* Progress Metrics - only show for Run groups */}
              {isRunGroup && renderProgressBars(member.userId)}
              
              {/* Weekly Workouts - show for all groups */}
              {renderWeeklyWorkouts(member.userId)}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default MoaiGroupProgress;
