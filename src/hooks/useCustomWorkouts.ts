
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCustomWorkouts, CustomWorkout } from '@/services/client-custom-workout-service';
import { toast } from 'sonner';

export function useCustomWorkouts(): UseQueryResult<CustomWorkout[], Error> & {
  sortedWorkouts: CustomWorkout[]
} {
  const { user } = useAuth();
  
  const query = useQuery<CustomWorkout[], Error>({
    queryKey: ['custom-workouts', user?.id],
    queryFn: async () => {
      try {
        const data = await fetchCustomWorkouts();
        return data;
      } catch (error) {
        console.error('Error loading custom workouts:', error);
        toast.error('Failed to load your custom workouts');
        throw error;
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
  
  // Sorted workouts - derived state
  const sortedWorkouts = query.data 
    ? [...query.data].sort((a, b) => {
        const dateA = a.workout_date ? new Date(a.workout_date) : new Date(a.created_at);
        const dateB = b.workout_date ? new Date(b.workout_date) : new Date(b.created_at);
        return dateB.getTime() - dateA.getTime(); // Most recent first
      })
    : [];
  
  return {
    ...query,
    sortedWorkouts
  };
}
