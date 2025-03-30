
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { WeekProgressBar } from './WeekProgressBar';
import { useAuth } from '@/contexts/AuthContext';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { getWeeklyAssignedWorkoutsCount } from '@/services/workout-history-service';
import { useQuery } from '@tanstack/react-query';
import { isThisWeek } from 'date-fns';
import { WorkoutType } from './WorkoutTypeIcon';

interface WeekProgressSectionProps {
  showTeam?: boolean;
  showPersonal?: boolean;
  weekNumber?: number;
  assignedWorkoutsCount?: number;
  workoutTypesMap?: Record<string, WorkoutType>;
  // Adding the missing properties
  showGroupMembers?: boolean;
  enableMemberClick?: boolean;
}

export const WeekProgressSection = ({ 
  showTeam = true, 
  showPersonal = true,
  weekNumber,
  assignedWorkoutsCount,
  workoutTypesMap = {},
  // Default values for the new properties
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
        
        if (count <= 0) return 4; // Default to 4 if no assigned workouts
        
        return count;
      } catch (error) {
        console.error("Error fetching workout count:", error);
        return 4; // Default fallback
      }
    },
    enabled: !!user?.id && assignedWorkoutsCount === undefined,
  });
  
  // Use either the passed in count or the fetched count
  const finalAssignedWorkoutsCount = assignedWorkoutsCount !== undefined ? 
    assignedWorkoutsCount : 
    totalAssignedWorkouts || 4; // Add default value
  
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
            
          if (workout.life_happens_pass) {
            newLifeHappensDates.push(completionDate);
          } else {
            newCompletedDates.push(completionDate);
          }
        }
      });
      
      console.log("Extracted completed dates:", newCompletedDates);
      console.log("Extracted life happens dates:", newLifeHappensDates);
      
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
  
  return (
    <div className="w-full">
      {showPersonal && (
        <WeekProgressBar 
          label="Your Workouts"
          completedDates={completedDates}
          lifeHappensDates={lifeHappensDates}
          count={totalCompletedThisWeek}
          total={finalAssignedWorkoutsCount}
          showDayCircles={true}
          showProgressBar={true}
          weekNumber={weekNumber}
          workoutTypes={workoutTypesMap}
          hasError={hasError}
        />
      )}
      
      {/* Group members will be rendered here if showGroupMembers is true */}
      {showGroupMembers && (
        <div className="mt-4">
          {/* This is just a placeholder. The actual implementation would need to be added later */}
          <p className="text-center text-sm text-slate-500">Group members progress would appear here</p>
        </div>
      )}
      
      {/* Team progress bar is hidden for now */}
      {/* {showTeam && (
        <WeekProgressBar 
          label="Your Moai Progress"
          completedDates={[]}
          count={0}
          total={5}
          color="bg-blue-500"
          textColor="text-blue-500"
        />
      )} */}
    </div>
  );
};
