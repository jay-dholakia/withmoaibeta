import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { WeekProgressSection } from '@/components/client/WeekProgressSection';
import { MonthlyCalendarView } from '@/components/client/MonthlyCalendarView';
import { WorkoutDayDetails } from '@/components/client/WorkoutDayDetails';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, User, Loader2, Info } from 'lucide-react';
import { fetchClientWorkoutHistory, getWeeklyAssignedWorkoutsCount } from '@/services/workout-history-service';
import { Container } from '@/components/ui/container';
import { WorkoutHistoryItem } from '@/types/workout';
import { format } from 'date-fns';

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedWorkouts, setSelectedWorkouts] = useState<WorkoutHistoryItem[]>([]);
  
  // Query for client workouts
  const { data: clientWorkouts, isLoading } = useQuery({
    queryKey: ['client-workouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      console.log('Fetching workout history for user:', user.id);
      const history = await fetchClientWorkoutHistory(user.id);
      console.log(`Fetched ${history.length} workout history items`);
      
      // Log workout types
      const workoutTypes = history.map(item => {
        return {
          date: format(new Date(item.completed_at), 'yyyy-MM-dd'),
          type: item.workout?.workout_type || 'unknown'
        };
      });
      console.log('Workout types in history:', workoutTypes);
      
      return history;
    },
    enabled: !!user?.id,
  });
  
  // Query for assigned workouts count
  const { data: assignedCount, isLoading: isLoadingAssigned } = useQuery({
    queryKey: ['assigned-workouts-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      console.log('[Debug] Fetching assigned workout count for user:', user.id);
      const count = await getWeeklyAssignedWorkoutsCount(user.id);
      console.log('[Debug] Assigned workouts count returned:', count);
      return count;
    },
    enabled: !!user?.id,
  });

  // Handle day selection in the calendar
  const handleDaySelect = (date: Date, workouts: WorkoutHistoryItem[]) => {
    console.log(`Selected date: ${format(date, 'yyyy-MM-dd')}`);
    console.log(`Found ${workouts.length} workouts for this date`);
    
    workouts.forEach((workout, i) => {
      console.log(`Workout ${i+1}: completed at ${workout.completed_at}, type: ${workout.workout?.workout_type || 'unknown'}`);
    });
    
    setSelectedDate(date);
    setSelectedWorkouts(workouts);
  };

  // Initially select March 26, 2025 if workouts are loaded
  useEffect(() => {
    if (clientWorkouts && clientWorkouts.length > 0) {
      const march26 = new Date(2025, 2, 26); // March 26, 2025
      
      // Filter workouts for March 26
      const march26Workouts = clientWorkouts.filter(item => {
        const date = new Date(item.completed_at);
        return date.getFullYear() === 2025 && 
               date.getMonth() === 2 && 
               date.getDate() === 26;
      });
      
      if (march26Workouts.length > 0) {
        console.log(`Auto-selecting March 26, 2025 with ${march26Workouts.length} workouts`);
        setSelectedDate(march26);
        setSelectedWorkouts(march26Workouts);
      }
    }
  }, [clientWorkouts]);
  
  return (
    <Container className="px-4 mx-auto w-full max-w-screen-md">
      <div className="w-full">
        <Tabs defaultValue="personal" className="mb-6 w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="personal" className="flex-1 flex items-center justify-center gap-2">
              <User className="h-4 w-4" />
              <span>Personal</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex-1 flex items-center justify-center gap-2">
              <Users className="h-4 w-4" />
              <span>Team</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="w-full">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-client" />
              </div>
            ) : (
              <>
                {!isLoadingAssigned && (
                  <div className="mb-4 bg-muted p-3 rounded-md text-sm flex items-start gap-2 justify-center">
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      {assignedCount > 0 ? (
                        <p>You have {assignedCount} workouts assigned this week.</p>
                      ) : (
                        <>
                          <p>No assigned workouts found for this week.</p>
                          <p className="text-xs text-muted-foreground mt-1">Using default goal of 7 workouts per week.</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                <h2 className="text-xl font-bold mb-4 mt-6 flex items-center justify-center gap-2">
                  <User className="h-5 w-5 text-client" />
                  Monthly Progress
                </h2>
                
                {clientWorkouts && (
                  <div className="mb-2 text-sm text-center text-muted-foreground">
                    {clientWorkouts.length} total workouts in your history
                  </div>
                )}
                
                <MonthlyCalendarView 
                  workouts={clientWorkouts || []} 
                  onDaySelect={handleDaySelect}
                />
                
                <h2 className="text-xl font-bold mb-4 mt-8 flex items-center justify-center gap-2">
                  <User className="h-5 w-5 text-client" />
                  Workout Details
                </h2>
                
                <WorkoutDayDetails 
                  date={selectedDate}
                  workouts={selectedWorkouts}
                />
              </>
            )}
          </TabsContent>
          
          <TabsContent value="team" className="w-full">
            <WeekProgressSection showTeam={true} showPersonal={false} />
          </TabsContent>
        </Tabs>
      </div>
    </Container>
  );
};

export default LeaderboardPage;
