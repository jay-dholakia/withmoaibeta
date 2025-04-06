
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
  const { user } = useAuth();
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
        // Update to use the function with optional parameters
        const count = await getWeeklyAssignedWorkoutsCount(user.id);
        return count;
      } catch (error) {
        console.error("Error fetching workout count:", error);
        return 6;
      }
    },
    enabled: !!user?.id && assignedWorkoutsCount === undefined,
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
  
  return (
    <div className="w-full">
      {showPersonal && (
        <WorkoutProgressCard 
          label="Your Workouts"
          completedDates={completedDates}
          lifeHappensDates={lifeHappensDates}
          count={totalCompletedThisWeek}
          total={finalAssignedWorkoutsCount}
          workoutTypesMap={typesMap}
          workoutTitlesMap={titlesMap}
          userName={userDisplayName}
          isCurrentUser={true}
        />
      )}
      
      {showGroupMembers && (
        <div className="mt-4">
          <p className="text-center text-sm text-slate-500">Group members progress would appear here</p>
        </div>
      )}
    </div>
  );
};
