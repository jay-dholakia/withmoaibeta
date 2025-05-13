import React, { useState, useRef } from 'react';
import { Container } from '@/components/ui/container';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { startOfWeek, format, isValid, isFuture } from 'date-fns';
import { getWeeklyAssignedWorkoutsCount, countCompletedWorkoutsForWeek } from '@/services/workout-history-service';
import { fetchClientProfile, fetchPersonalRecords } from '@/services/client-service';
import { Loader2, CalendarDays, User, Dumbbell } from 'lucide-react';
import { toast } from 'sonner';
import { MonthlyCalendarView } from '@/components/client/MonthlyCalendarView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkoutType } from '@/components/client/WorkoutTypeIcon';
import { WorkoutDayDetails } from '@/components/client/WorkoutDayDetails';
import { WorkoutHistoryItem, PersonalRecord } from '@/types/workout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { formatInTimeZone } from 'date-fns-tz';

const LeaderboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDayWorkouts, setSelectedDayWorkouts] = useState<WorkoutHistoryItem[]>([]);
  const workoutDetailsRef = useRef<HTMLDivElement>(null);
  
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
  
  const { data: clientWorkouts, isLoading: isLoadingWorkouts, error: workoutsError, refetch: refetchWorkouts } = useQuery({
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
  
  const { data: personalRecords, isLoading: isLoadingRecords, error: recordsError } = useQuery({
    queryKey: ['personal-records', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        return await fetchPersonalRecords(user.id);
      } catch (error) {
        console.error('Error fetching personal records:', error);
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
        const nowPT = new Date();
        const todayPT = formatInTimeZone(nowPT, 'America/Los_Angeles', 'yyyy-MM-dd');
        const today = new Date(todayPT);
        const monday = startOfWeek(today, { weekStartsOn: 1 });
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
    
    if (recordsError) {
      console.error('Records error:', recordsError);
      toast.error('Failed to load personal records data');
    }
    
    if (countError || completedError) {
      console.error('Count/completed error:', countError || completedError);
      toast.error('Failed to load workout progress data');
    }
  }, [profileError, workoutsError, recordsError, countError, completedError]);
  
  const workoutTypesMap = React.useMemo(() => {
    const typesMap: Record<string, WorkoutType> = {};
    
    if (clientWorkouts && clientWorkouts.length > 0) {
      clientWorkouts.forEach(item => {
        if (!item.completed_at) return;
        
        try {
          const date = new Date(item.completed_at);
          if (!isValid(date) || isFuture(date)) return;
          
          const dateKey = formatInTimeZone(date, 'America/Los_Angeles', 'yyyy-MM-dd');
          console.log(`Processing workout for date key: ${dateKey}`);
          
          if (item.life_happens_pass || item.rest_day) {
            typesMap[dateKey] = 'rest_day';
            return;
          }
          
          const workoutType = item.workout_type || item.workout?.workout_type || '';
          
          // Check for run/distance related data first
          if (item.distance) {
            console.log(`Found workout with distance for ${dateKey}: ${item.distance}`);
            typesMap[dateKey] = 'running';
            return;
          }
          
          if (workoutType.toLowerCase().includes('run')) {
            console.log(`Found running workout for ${dateKey}: ${workoutType}`);
            typesMap[dateKey] = 'running';
            return;
          }
          
          // Then check for other workout types
          if (workoutType.toLowerCase().includes('basketball')) typesMap[dateKey] = 'basketball';
          else if (workoutType.toLowerCase().includes('golf')) typesMap[dateKey] = 'golf';
          else if (workoutType.toLowerCase().includes('volleyball')) typesMap[dateKey] = 'volleyball';
          else if (workoutType.toLowerCase().includes('baseball')) typesMap[dateKey] = 'baseball';
          else if (workoutType.toLowerCase().includes('tennis')) typesMap[dateKey] = 'tennis';
          else if (workoutType.toLowerCase().includes('hiking')) typesMap[dateKey] = 'hiking';
          else if (workoutType.toLowerCase().includes('skiing')) typesMap[dateKey] = 'skiing';
          else if (workoutType.toLowerCase().includes('yoga')) typesMap[dateKey] = 'yoga';
          else if (workoutType.toLowerCase().includes('strength')) typesMap[dateKey] = 'strength';
          else if (workoutType.toLowerCase().includes('cardio')) typesMap[dateKey] = 'cardio';
          else if (workoutType.toLowerCase().includes('body') || workoutType.toLowerCase().includes('weight')) typesMap[dateKey] = 'bodyweight';
          else if (workoutType.toLowerCase().includes('flex') || workoutType.toLowerCase().includes('yoga')) typesMap[dateKey] = 'flexibility';
          else if (workoutType.toLowerCase().includes('hiit')) typesMap[dateKey] = 'hiit';
          else if (workoutType.toLowerCase().includes('swim')) typesMap[dateKey] = 'swimming';
          else if (workoutType.toLowerCase().includes('dance')) typesMap[dateKey] = 'dance';
          else if (workoutType.toLowerCase().includes('cycl') || workoutType.toLowerCase().includes('bike')) typesMap[dateKey] = 'cycling';
          else if (workoutType.toLowerCase().includes('custom')) typesMap[dateKey] = 'custom';
          else if (item.title && item.title.toLowerCase().includes('run')) typesMap[dateKey] = 'running';
          else typesMap[dateKey] = 'custom';
        } catch (err) {
          console.error('Error processing workout date:', err, item.completed_at);
        }
      });
    }
    
    return typesMap;
  }, [clientWorkouts]);
  
  const handleDaySelect = (date: Date, workouts: WorkoutHistoryItem[]) => {
    setSelectedDate(date);
    setSelectedDayWorkouts(workouts);
    console.log(`Selected date: ${format(date, 'yyyy-MM-dd')}, found ${workouts.length} workouts`);
    
    setTimeout(() => {
      if (workouts.length > 0 && workoutDetailsRef.current) {
        workoutDetailsRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };
  
  const handleRefreshWorkoutHistory = () => {
    refetchWorkouts();
  };
  
  const handleLogWorkoutClick = () => {
    navigate('/client-dashboard/workouts');
  };
  
  const isLoading = isLoadingProfile || isLoadingWorkouts || isLoadingRecords || isLoadingCount || isLoadingCompleted;
  
  if (isLoading) {
    return (
      <Container className="px-4 mx-auto w-full max-w-screen-md">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-client dark:text-blue-400" />
          <span className="ml-2 dark:text-gray-300">Loading your progress...</span>
        </div>
      </Container>
    );
  }
  
  return (
    <div className="px-4 py-4 mx-auto w-full max-w-screen-md">
      <div className="w-full">
        <button 
          id="refresh-workout-history" 
          className="hidden"
          onClick={handleRefreshWorkoutHistory}
        >
          Refresh
        </button>
        
        <div className="mt-2 mb-2 flex flex-col items-center">
          <h2 className="text-xl font-bold mb-1 flex items-center justify-center gap-2 dark:text-white">
            <User className="h-5 w-5 text-client dark:text-blue-400" />
            Workout History
          </h2>
          
          {clientWorkouts && clientWorkouts.length > 0 && (
            <div className="text-sm text-center text-muted-foreground dark:text-gray-400">
              {clientWorkouts.length} total workouts in your history
            </div>
          )}
        </div>
        
        <Card className="mt-2 mb-4 dark:bg-gray-800 dark:border-gray-700">
          <CardContent>
            {clientWorkouts && clientWorkouts.length > 0 ? (
              <MonthlyCalendarView 
                workouts={clientWorkouts} 
                onDaySelect={handleDaySelect}
                workoutTypesMap={workoutTypesMap}
                showWorkoutTooltips={true}
              />
            ) : (
              <div className="text-center py-8 dark:text-gray-300">
                <p>No workout history yet. Complete workouts to see them on your calendar!</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Button 
          onClick={handleLogWorkoutClick}
          className="w-full mt-4 rounded-md bg-client hover:bg-client/90 text-white flex items-center justify-center gap-2 dark:bg-blue-600 dark:hover:bg-blue-700 shadow-md"
        >
          <Dumbbell className="h-5 w-5" />
          Log a Workout
        </Button>
        
        {selectedDayWorkouts.length > 0 && (
          <div className="mt-6 mb-4" ref={workoutDetailsRef}>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">Workout Details</CardTitle>
              </CardHeader>
              <CardContent>
                <WorkoutDayDetails 
                  date={selectedDate} 
                  workouts={selectedDayWorkouts}
                  personalRecords={personalRecords || []}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
