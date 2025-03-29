
import React, { useMemo } from 'react';
import { Container } from '@/components/ui/container';
import { CoachMessageCard } from '@/components/client/CoachMessageCard';
import { useAuth } from '@/contexts/AuthContext';
import { WeekProgressSection } from '@/components/client/WeekProgressSection';
import { useQuery } from '@tanstack/react-query';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { format } from 'date-fns';
import { WorkoutType } from '@/components/client/WorkoutTypeIcon';

const LeaderboardPage = () => {
  const { user } = useAuth();
  
  // Query client workouts to get workout types
  const { data: clientWorkouts } = useQuery({
    queryKey: ['client-workouts-leaderboard', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return fetchClientWorkoutHistory(user.id);
    },
    enabled: !!user?.id,
  });
  
  // Create workout types map
  const workoutTypesMap = useMemo(() => {
    const typesMap: Record<string, WorkoutType> = {};
    
    if (clientWorkouts) {
      clientWorkouts.forEach(item => {
        if (!item.completed_at) return;
        
        const date = new Date(item.completed_at);
        const dateKey = format(date, 'yyyy-MM-dd');
        
        if (item.life_happens_pass || item.rest_day) {
          typesMap[dateKey] = 'rest_day';
          return;
        }
        
        if (item.workout?.workout_type) {
          // Standardize the workout type
          const type = item.workout.workout_type.toLowerCase();
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
    
    return typesMap;
  }, [clientWorkouts]);
  
  return (
    <Container className="px-0 sm:px-4 mx-auto w-full max-w-screen-md">
      <div className="w-full">
        {user && <CoachMessageCard userId={user.id} />}
        
        <WeekProgressSection 
          showTeam={true} 
          showPersonal={true}
          workoutTypesMap={workoutTypesMap}
        />
      </div>
    </Container>
  );
};

export default LeaderboardPage;
