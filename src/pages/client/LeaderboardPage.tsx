
import React, { useMemo } from 'react';
import { Container } from '@/components/ui/container';
import { CoachMessageCard } from '@/components/client/CoachMessageCard';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { format, isThisWeek, startOfWeek, endOfWeek } from 'date-fns';
import { WorkoutType } from '@/components/client/WorkoutTypeIcon';
import { getWeeklyAssignedWorkoutsCount, countCompletedWorkoutsForWeek } from '@/services/workout-history-service';
import { WorkoutProgressCard } from '@/components/client/WorkoutProgressCard';
import { fetchClientProfile } from '@/services/client-service';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const LeaderboardPage = () => {
  const { user } = useAuth();
  
  // Fetch client profile to get the first name
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['client-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return fetchClientProfile(user.id);
    },
    enabled: !!user?.id,
  });
  
  // Query client workouts to get workout types
  const { data: clientWorkouts, isLoading: isLoadingWorkouts } = useQuery({
    queryKey: ['client-workouts-leaderboard', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        return await fetchClientWorkoutHistory(user.id);
      } catch (error) {
        console.error('Error fetching client workout history:', error);
        return [];
      }
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
  
  // Count current week's completed workouts directly from Supabase
  const { data: completedThisWeek, isLoading: isLoadingCompleted } = useQuery({
    queryKey: ['completed-workouts-this-week', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
      try {
        return await countCompletedWorkoutsForWeek(user.id, monday);
      } catch (error) {
        console.error("Error counting completed workouts:", error);
        return 0;
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
          else if (type.includes('one')) typesMap[dateKey] = 'one_off';
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
  
  // Count number of life happens passes used this week
  const lifeHappensThisWeek = useMemo(() => {
    if (!lifeHappensDates.length) return 0;
    
    return lifeHappensDates.filter(date => isThisWeek(date, { weekStartsOn: 1 })).length;
  }, [lifeHappensDates]);
  
  // Calculate the total completed including life happens passes
  const totalCompletedCount = (completedThisWeek || 0) + lifeHappensThisWeek;
  
  const totalWorkouts = assignedWorkoutsCount || 5; // Default to 5 if undefined
  
  // Get user display name - prioritize first name from profile
  const userDisplayName = profile?.first_name || (user?.email ? user.email.split('@')[0] : 'You');
  
  const isLoading = isLoadingProfile || isLoadingWorkouts || isLoadingCount || isLoadingCompleted;
  
  if (isLoading) {
    return (
      <Container className="px-4 sm:px-4 mx-auto w-full max-w-screen-md">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-client" />
          <span className="ml-2">Loading your progress...</span>
        </div>
      </Container>
    );
  }
  
  return (
    <Container className="px-0 sm:px-4 mx-auto w-full max-w-screen-md">
      <div className="w-full">
        {user && <CoachMessageCard userId={user.id} />}
        
        <div className="mt-6">
          <WorkoutProgressCard 
            label="Your Workouts"
            completedDates={completedDates}
            lifeHappensDates={lifeHappensDates}
            count={totalCompletedCount}
            total={totalWorkouts}
            workoutTypesMap={workoutTypesMap}
            userName={userDisplayName}
            isCurrentUser={true}
          />
        </div>
      </div>
    </Container>
  );
};

export default LeaderboardPage;
