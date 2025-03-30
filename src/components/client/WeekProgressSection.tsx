
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
  const { data: clientWorkouts } = useQuery({
    queryKey: ['client-workouts-week-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return fetchClientWorkoutHistory(user.id);
    },
    enabled: !!user?.id,
  });
  
  // Hardcoded value for demo purposes
  // This should be replaced with actual data from the API in production
  const totalAssignedWorkouts = 5;
  
  console.log('Client Completed Dates:', completedDates);
  console.log('Client Life Happens Dates:', lifeHappensDates);
  
  // Extract completed dates and life happens dates
  useEffect(() => {
    if (clientWorkouts) {
      const newCompletedDates: Date[] = [];
      const newLifeHappensDates: Date[] = [];
      
      clientWorkouts.forEach(workout => {
        if (workout.completed_at) {
          const completionDate = new Date(workout.completed_at);
          
          if (workout.life_happens_pass) {
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
  
  // For demo purposes, we're using a fixed value of 3 completed workouts
  // In a real application, we would use the actual count from the API
  const demoCompletedCount = 3;
  
  return (
    <div className="w-full">
      {showPersonal && (
        <WeekProgressBar 
          label="Your Workouts"
          completedDates={completedDates}
          lifeHappensDates={lifeHappensDates}
          count={demoCompletedCount} // Using the demo count of 3
          total={totalAssignedWorkouts} // Using the fixed assigned count of 5
          showDayCircles={true}
          showProgressBar={false}
          weekNumber={weekNumber}
          workoutTypes={workoutTypesMap}
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
