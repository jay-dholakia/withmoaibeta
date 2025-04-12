import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { WeekProgressBar } from './WeekProgressBar';
import { useAuth } from '@/contexts/AuthContext';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { getWeeklyAssignedWorkoutsCount } from '@/services/workout-history-service';
import { useQuery } from '@tanstack/react-query';
import { format, isThisWeek } from 'date-fns';
import { WorkoutType } from './WorkoutTypeIcon';
import { WorkoutProgressCard } from './WorkoutProgressCard';
import { detectWorkoutTypeFromText } from '@/services/workout-edit-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface WeekProgressSectionProps {
  showTeam?: boolean;
  showPersonal?: boolean;
  weekNumber?: number;
  assignedWorkoutsCount?: number;
  workoutTypesMap?: Record<string, WorkoutType>;
  showGroupMembers?: boolean;
  enableMemberClick?: boolean;
}

export const WeekProgressSection = ({ 
  showTeam = true, 
  showPersonal = true,
  weekNumber,
  assignedWorkoutsCount,
  workoutTypesMap = {},
  showGroupMembers = false,
  enableMemberClick = false
}: WeekProgressSectionProps) => {
  const { user, profile } = useAuth();
  const [completedDates, setCompletedDates] = useState<Date[]>([]);
  const [lifeHappensDates, setLifeHappensDates] = useState<Date[]>([]);
  const [typesMap, setTypesMap] = useState<Record<string, WorkoutType>>(workoutTypesMap);
  const [titlesMap, setTitlesMap] = useState<Record<string, string>>({});
  
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  console.log(`User timezone in WeekProgressSection: ${userTimeZone}`);
  
  const { data: clientWorkouts, isLoading: isLoadingWorkouts } = useQuery({
    queryKey: ['client-workouts-week-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return fetchClientWorkoutHistory(user.id);
    },
    enabled: !!user?.id,
  });
  
  const { data: totalAssignedWorkouts, isError: isWorkoutsCountError } = useQuery({
    queryKey: ['weekly-assigned-workouts-count', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User ID not available');
      try {
        const count = await getWeeklyAssignedWorkoutsCount(user.id);
        return count;
      } catch (error) {
        console.error("Error fetching workout count:", error);
        return 6;
      }
    },
    enabled: !!user?.id && assignedWorkoutsCount === undefined,
  });
  
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile-week-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('client_profiles')
        .select('first_name, last_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });
  
  const finalAssignedWorkoutsCount = assignedWorkoutsCount !== undefined ? 
    assignedWorkoutsCount : 
    totalAssignedWorkouts || 6;
  
  useEffect(() => {
    if (clientWorkouts && clientWorkouts.length > 0) {
      const newCompletedDates: Date[] = [];
      const newLifeHappensDates: Date[] = [];
      const newTypesMap: Record<string, WorkoutType> = {};
      const newTitlesMap: Record<string, string> = {};
      
      clientWorkouts.forEach(workout => {
        if (workout.completed_at) {
          try {
            const completionDate = typeof workout.completed_at === 'string' 
              ? new Date(workout.completed_at) 
              : workout.completed_at;
              
            const dateKey = format(completionDate, 'yyyy-MM-dd');
            console.log(`Processing workout for date: ${dateKey} in timezone ${userTimeZone}`);
            
            if (workout.life_happens_pass || workout.rest_day) {
              newLifeHappensDates.push(completionDate);
              newTypesMap[dateKey] = 'rest_day';
              return;
            }
            
            newCompletedDates.push(completionDate);
            
            if (workout.title) {
              newTitlesMap[dateKey] = workout.title;
            } else if (workout.workout?.title) {
              newTitlesMap[dateKey] = workout.workout.title;
            }
            
            if (workout.workout_type) {
              newTypesMap[dateKey] = workout.workout_type as WorkoutType;
            } else if (workout.workout?.workout_type) {
              const type = String(workout.workout.workout_type).toLowerCase();
              if (type.includes('strength')) newTypesMap[dateKey] = 'strength';
              else if (type.includes('cardio') || type.includes('run')) newTypesMap[dateKey] = 'cardio';
              else if (type.includes('body') || type.includes('weight')) newTypesMap[dateKey] = 'bodyweight';
              else if (type.includes('flex') || type.includes('yoga') || type.includes('stretch')) newTypesMap[dateKey] = 'flexibility';
              else if (type.includes('hiit')) newTypesMap[dateKey] = 'hiit';
              else if (type.includes('sport')) newTypesMap[dateKey] = 'sport';
              else if (type.includes('swim')) newTypesMap[dateKey] = 'swimming';
              else if (type.includes('cycle') || type.includes('bike')) newTypesMap[dateKey] = 'cycling';
              else if (type.includes('dance')) newTypesMap[dateKey] = 'dance';
              else if (newTitlesMap[dateKey]) {
                newTypesMap[dateKey] = detectWorkoutTypeFromText(newTitlesMap[dateKey]);
              } else {
                newTypesMap[dateKey] = 'strength';
              }
            } else if (newTitlesMap[dateKey]) {
              newTypesMap[dateKey] = detectWorkoutTypeFromText(newTitlesMap[dateKey]);
            } else {
              newTypesMap[dateKey] = 'strength';
            }
          } catch (error) {
            console.error("Error processing workout completion:", error);
          }
        }
      });
      
      setCompletedDates(newCompletedDates);
      setLifeHappensDates(newLifeHappensDates);
      setTypesMap({...workoutTypesMap, ...newTypesMap});
      setTitlesMap(newTitlesMap);
    }
  }, [clientWorkouts, workoutTypesMap]);
  
  const completedThisWeek = useMemo(() => {
    if (!completedDates.length) return 0;
    
    return completedDates.filter(date => isThisWeek(date, { weekStartsOn: 1 })).length;
  }, [completedDates]);
  
  const lifeHappensThisWeek = useMemo(() => {
    if (!lifeHappensDates.length) return 0;
    
    return lifeHappensDates.filter(date => isThisWeek(date, { weekStartsOn: 1 })).length;
  }, [lifeHappensDates]);
  
  const totalCompletedThisWeek = completedThisWeek;
  
  const hasAssignedWorkouts = finalAssignedWorkoutsCount > 0;
  const hasError = isWorkoutsCountError && assignedWorkoutsCount === undefined;
  
  const userDisplayName = user?.email ? user.email.split('@')[0] : 'You';
  
  if (!showPersonal) return null;

  const today = new Date();
  const todayIndex = (today.getDay() === 0 ? 6 : today.getDay() - 1); // Convert Sunday as 0 to Sunday as 6
  
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Your Progress</CardTitle>
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
        
        <WorkoutProgressCard 
          completedDates={completedDates}
          lifeHappensDates={lifeHappensDates}
          count={totalCompletedThisWeek}
          total={finalAssignedWorkoutsCount}
          workoutTypesMap={typesMap}
          workoutTitlesMap={titlesMap}
          userName={userDisplayName}
          isCurrentUser={true}
          avatarUrl={userProfile?.avatar_url}
          firstName={userProfile?.first_name}
          lastName={userProfile?.last_name}
          showLabelsBelow={false}
        />
      </CardContent>
    </Card>
  );
};
