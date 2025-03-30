import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { WeekProgressBar } from './WeekProgressBar';
import { useAuth } from '@/contexts/AuthContext';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { getWeeklyAssignedWorkoutsCount } from '@/services/workout-history-service';
import { useQuery } from '@tanstack/react-query';
import { format, isThisWeek } from 'date-fns';
import { WorkoutType } from './WorkoutTypeIcon';
import { WorkoutProgressCard } from './WorkoutProgressCard';

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
  
  // Query client workouts to get completed dates
  const { data: clientWorkouts, isLoading: isLoadingWorkouts } = useQuery({
    queryKey: ['client-workouts-week-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return fetchClientWorkoutHistory(user.id);
    },
    enabled: !!user?.id,
  });
  
  // Query the total number of workouts assigned for the current week
  const { data: totalAssignedWorkouts, isError: isWorkoutsCountError } = useQuery({
    queryKey: ['weekly-assigned-workouts-count', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User ID not available');
      try {
        const count = await getWeeklyAssignedWorkoutsCount(user.id);
        return count;
      } catch (error) {
        console.error("Error fetching workout count:", error);
        return 6; // Default fallback
      }
    },
    enabled: !!user?.id && assignedWorkoutsCount === undefined,
  });
  
  // Use either the passed in count or the fetched count
  const finalAssignedWorkoutsCount = assignedWorkoutsCount !== undefined ? 
    assignedWorkoutsCount : 
    totalAssignedWorkouts || 6; // Change default value to 6
  
  // Extract completed dates and life happens dates
  useEffect(() => {
    if (clientWorkouts && clientWorkouts.length > 0) {
      const newCompletedDates: Date[] = [];
      const newLifeHappensDates: Date[] = [];
      
      clientWorkouts.forEach(workout => {
        if (workout.completed_at) {
          // Handle both string and Date objects
          const completionDate = typeof workout.completed_at === 'string' 
            ? new Date(workout.completed_at) 
            : workout.completed_at;
            
          if (workout.life_happens_pass || workout.rest_day) {
            newLifeHappensDates.push(completionDate);
          } else {
            newCompletedDates.push(completionDate);
          }
        }
      });
      
      setCompletedDates(newCompletedDates);
      setLifeHappensDates(newLifeHappensDates);
    }
  }, [clientWorkouts]);
  
  // Count number of completed workouts this week
  const completedThisWeek = useMemo(() => {
    if (!completedDates.length) return 0;
    
    return completedDates.filter(date => isThisWeek(date, { weekStartsOn: 1 })).length;
  }, [completedDates]);
  
  // Count number of life happens passes used this week
  const lifeHappensThisWeek = useMemo(() => {
    if (!lifeHappensDates.length) return 0;
    
    return lifeHappensDates.filter(date => isThisWeek(date, { weekStartsOn: 1 })).length;
  }, [lifeHappensDates]);
  
  // Calculate the total completed including life happens passes
  const totalCompletedThisWeek = completedThisWeek + lifeHappensThisWeek;
  
  const hasAssignedWorkouts = finalAssignedWorkoutsCount > 0;
  const hasError = isWorkoutsCountError && assignedWorkoutsCount === undefined;
  
  // Get user display name
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
          workoutTypesMap={workoutTypesMap}
          userName={userDisplayName}
          isCurrentUser={true}
        />
      )}
      
      {/* Group members will be rendered here if showGroupMembers is true */}
      {showGroupMembers && (
        <div className="mt-4">
          {/* This is just a placeholder. The actual implementation would need to be added later */}
          <p className="text-center text-sm text-slate-500">Group members progress would appear here</p>
        </div>
      )}
    </div>
  );
};
