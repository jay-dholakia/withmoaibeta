
import React from 'react';
import { Container } from '@/components/ui/container';
import { CoachMessageCard } from '@/components/client/CoachMessageCard';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { startOfWeek } from 'date-fns';
import { getWeeklyAssignedWorkoutsCount, countCompletedWorkoutsForWeek } from '@/services/workout-history-service';
import { fetchClientProfile } from '@/services/client-service';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const LeaderboardPage = () => {
  const { user } = useAuth();
  
  const { data: profile, isLoading: isLoadingProfile, error: profileError } = useQuery({
    queryKey: ['client-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        return await fetchClientProfile(user.id);
      } catch (error) {
        console.error('Error fetching client profile:', error);
        return null;
      }
    },
    enabled: !!user?.id,
  });
  
  const { data: clientWorkouts, isLoading: isLoadingWorkouts, error: workoutsError } = useQuery({
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
  
  const { data: assignedWorkoutsCount, isLoading: isLoadingCount, error: countError } = useQuery({
    queryKey: ['assigned-workouts-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 5; // Default to 5 if user ID not available
      try {
        const count = await getWeeklyAssignedWorkoutsCount(user.id);
        if (!count || count <= 0) return 5; // Default to 5 if no assigned workouts
        return count;
      } catch (error) {
        console.error("Error fetching workout count:", error);
        return 5; // Default fallback
      }
    },
    enabled: !!user?.id,
  });
  
  const { data: completedThisWeek, isLoading: isLoadingCompleted, error: completedError } = useQuery({
    queryKey: ['completed-workouts-this-week', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      try {
        const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
        return await countCompletedWorkoutsForWeek(user.id, monday);
      } catch (error) {
        console.error("Error counting completed workouts:", error);
        return 0;
      }
    },
    enabled: !!user?.id,
  });
  
  React.useEffect(() => {
    if (profileError) {
      console.error('Profile error:', profileError);
      toast.error('Failed to load profile information');
    }
    
    if (workoutsError) {
      console.error('Workouts error:', workoutsError);
      toast.error('Failed to load workout history');
    }
    
    if (countError || completedError) {
      console.error('Count/completed error:', countError || completedError);
      toast.error('Failed to load workout progress data');
    }
  }, [profileError, workoutsError, countError, completedError]);
  
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
      </div>
    </Container>
  );
};

export default LeaderboardPage;
