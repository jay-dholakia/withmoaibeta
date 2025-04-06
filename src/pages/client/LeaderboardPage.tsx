
import React from 'react';
import { Container } from '@/components/ui/container';
import { CoachMessageCard } from '@/components/client/CoachMessageCard';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { startOfWeek, format, isValid, isFuture } from 'date-fns';
import { getWeeklyAssignedWorkoutsCount, countCompletedWorkoutsForWeek } from '@/services/workout-history-service';
import { fetchClientProfile } from '@/services/client-service';
import { Loader2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { MonthlyCalendarView } from '@/components/client/MonthlyCalendarView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkoutType } from '@/components/client/WorkoutTypeIcon';

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  
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
  
  const workoutTypesMap = React.useMemo(() => {
    const typesMap: Record<string, WorkoutType> = {};
    
    if (clientWorkouts && clientWorkouts.length > 0) {
      clientWorkouts.forEach(item => {
        if (!item.completed_at) return;
        
        try {
          const date = new Date(item.completed_at);
          if (!isValid(date) || isFuture(date)) return;
          
          const dateKey = format(date, 'yyyy-MM-dd');
          
          // Determine workout type
          if (item.life_happens_pass || item.rest_day) {
            typesMap[dateKey] = 'rest_day';
            return;
          }
          
          // Get workout type from either direct property or nested workout object
          const workoutType = item.workout_type || item.workout?.workout_type || '';
          
          if (workoutType.toLowerCase().includes('strength')) typesMap[dateKey] = 'strength';
          else if (workoutType.toLowerCase().includes('cardio')) typesMap[dateKey] = 'cardio';
          else if (workoutType.toLowerCase().includes('body') || workoutType.toLowerCase().includes('weight')) typesMap[dateKey] = 'bodyweight';
          else if (workoutType.toLowerCase().includes('flex') || workoutType.toLowerCase().includes('yoga')) typesMap[dateKey] = 'flexibility';
          else if (workoutType.toLowerCase().includes('sport')) typesMap[dateKey] = 'sport';
          else if (workoutType.toLowerCase().includes('hiit')) typesMap[dateKey] = 'hiit';
          else if (workoutType.toLowerCase().includes('swim')) typesMap[dateKey] = 'swimming';
          else if (workoutType.toLowerCase().includes('dance')) typesMap[dateKey] = 'dance';
          else if (workoutType.toLowerCase().includes('cycl') || workoutType.toLowerCase().includes('bike')) typesMap[dateKey] = 'cycling';
          else if (workoutType.toLowerCase().includes('custom')) typesMap[dateKey] = 'custom';
          else if (workoutType.toLowerCase().includes('one')) typesMap[dateKey] = 'one_off';
          else typesMap[dateKey] = 'strength'; // Default
        } catch (err) {
          console.error('Error processing workout date:', err, item.completed_at);
        }
      });
    }
    
    return typesMap;
  }, [clientWorkouts]);
  
  const handleDaySelect = (date: Date, workouts: any[]) => {
    setSelectedDate(date);
    console.log(`Selected date: ${format(date, 'yyyy-MM-dd')}, found ${workouts.length} workouts`);
  };
  
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
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-client" />
              Workout Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clientWorkouts && clientWorkouts.length > 0 ? (
              <MonthlyCalendarView 
                workouts={clientWorkouts} 
                onDaySelect={handleDaySelect}
                workoutTypesMap={workoutTypesMap}
                showWorkoutTooltips={true}
              />
            ) : (
              <div className="text-center py-8">
                <p>No workout history yet. Complete workouts to see them on your calendar!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
};

export default LeaderboardPage;
