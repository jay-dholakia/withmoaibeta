
import React, { useMemo } from 'react';
import { Container } from '@/components/ui/container';
import { CoachMessageCard } from '@/components/client/CoachMessageCard';
import { useAuth } from '@/contexts/AuthContext';
import { WeekProgressSection } from '@/components/client/WeekProgressSection';
import { useQuery } from '@tanstack/react-query';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { format, isThisWeek } from 'date-fns';
import { WorkoutType } from '@/components/client/WorkoutTypeIcon';
import { getWeeklyAssignedWorkoutsCount } from '@/services/workout-history-service';
import { WorkoutProgressCard } from '@/components/client/WorkoutProgressCard';
import { Card } from '@/components/ui/card';

const LeaderboardPage = () => {
  const { user } = useAuth();
  
  // Query client workouts to get workout types
  const { data: clientWorkouts, isLoading: isLoadingWorkouts } = useQuery({
    queryKey: ['client-workouts-leaderboard', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return fetchClientWorkoutHistory(user.id);
    },
    enabled: !!user?.id,
  });
  
  // Query the assigned workouts count from the coach-assigned program
  const { data: assignedWorkoutsCount, isLoading: isLoadingCount } = useQuery({
    queryKey: ['assigned-workouts-count', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User ID not available');
      try {
        const count = await getWeeklyAssignedWorkoutsCount(user.id);
        if (count <= 0) return 5; // Default to 5 if no assigned workouts
        return count;
      } catch (error) {
        console.error("Error fetching workout count:", error);
        return 5; // Default fallback
      }
    },
    enabled: !!user?.id,
  });
  
  // Extract completed dates and life happens dates
  const { completedDates, lifeHappensDates, workoutTypesMap } = useMemo(() => {
    const completed: Date[] = [];
    const lifeHappens: Date[] = [];
    const typesMap: Record<string, WorkoutType> = {};
    
    if (clientWorkouts && clientWorkouts.length > 0) {
      clientWorkouts.forEach(item => {
        if (!item.completed_at) return;
        
        // Convert the completed_at string to a Date object if it's a string
        const completionDate = typeof item.completed_at === 'string' 
          ? new Date(item.completed_at) 
          : item.completed_at;
          
        if (!completionDate) return;
        
        const dateKey = format(completionDate, 'yyyy-MM-dd');
        
        if (item.life_happens_pass || item.rest_day) {
          lifeHappens.push(completionDate);
          typesMap[dateKey] = 'rest_day';
          return;
        }
        
        completed.push(completionDate);
        
        if (item.workout?.workout_type) {
          // Standardize the workout type
          const type = String(item.workout.workout_type).toLowerCase();
          if (type.includes('strength')) typesMap[dateKey] = 'strength';
          else if (type.includes('cardio') || type.includes('run')) typesMap[dateKey] = 'cardio';
          else if (type.includes('body') || type.includes('weight')) typesMap[dateKey] = 'bodyweight';
          else if (type.includes('flex') || type.includes('yoga') || type.includes('stretch')) typesMap[dateKey] = 'flexibility';
          else if (type.includes('rest')) typesMap[dateKey] = 'rest_day';
          else if (type.includes('custom')) typesMap[dateKey] = 'custom';
          else typesMap[dateKey] = 'strength'; // Default
          return;
        }
        
        // Fallback to checking workout title
        if (item.workout?.title) {
          const title = item.workout.title.toLowerCase();
          if (title.includes('strength')) typesMap[dateKey] = 'strength';
          else if (title.includes('cardio') || title.includes('run')) typesMap[dateKey] = 'cardio';
          else if (title.includes('body') || title.includes('weight')) typesMap[dateKey] = 'bodyweight';
          else if (title.includes('flex') || title.includes('yoga') || title.includes('stretch')) typesMap[dateKey] = 'flexibility';
          else typesMap[dateKey] = 'strength'; // Default
        } else {
          typesMap[dateKey] = 'strength'; // Default if no other information
        }
      });
    }
    
    return { completedDates: completed, lifeHappensDates: lifeHappens, workoutTypesMap: typesMap };
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
  
  const totalWorkouts = assignedWorkoutsCount || 5; // Default to 5 if undefined
  
  return (
    <Container className="px-0 sm:px-4 mx-auto w-full max-w-screen-md">
      <div className="w-full">
        {user && <CoachMessageCard userId={user.id} />}
        
        <div className="mt-6">
          <WorkoutProgressCard 
            label="Your Workouts"
            completedDates={completedDates}
            lifeHappensDates={lifeHappensDates}
            count={totalCompletedThisWeek}
            total={totalWorkouts}
            workoutTypesMap={workoutTypesMap}
          />
        </div>
      </div>
    </Container>
  );
};

export default LeaderboardPage;
