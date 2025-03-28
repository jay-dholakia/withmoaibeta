
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { WeekProgressSection } from '@/components/client/WeekProgressSection';
import { MonthlyCalendarView } from '@/components/client/MonthlyCalendarView';
import { WorkoutDayDetails } from '@/components/client/WorkoutDayDetails';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, User, Loader2, Info } from 'lucide-react';
import { fetchClientWorkoutHistory, getWeeklyAssignedWorkoutsCount } from '@/services/workout-history-service';
import { supabase } from '@/integrations/supabase/client';
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
      return fetchClientWorkoutHistory(user.id);
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
    console.log(`Selected date: ${format(date, 'MM/dd/yyyy')}`);
    console.log(`Found ${workouts.length} workouts for this date`);
    workouts.forEach((workout, i) => {
      console.log(`Workout ${i+1}: completed at ${workout.completed_at}, type: ${workout.workout?.title || 'Unknown'}`);
    });
    
    setSelectedDate(date);
    setSelectedWorkouts(workouts);
  };

  // For debugging - log all available workouts
  useEffect(() => {
    if (clientWorkouts && clientWorkouts.length > 0) {
      console.log('All available workouts:', clientWorkouts.length);
      console.log('Sample dates:');
      clientWorkouts.slice(0, 5).forEach((w, i) => {
        console.log(`Workout ${i+1}: ${w.completed_at} - ${format(new Date(w.completed_at), 'MM/dd/yyyy')}`);
      });

      // Check specifically for March 26-27, 2025 workouts
      const march26Workouts = clientWorkouts.filter(w => {
        const date = new Date(w.completed_at);
        return date.getMonth() === 2 && date.getDate() === 26 && date.getFullYear() === 2025;
      });
      
      const march27Workouts = clientWorkouts.filter(w => {
        const date = new Date(w.completed_at);
        return date.getMonth() === 2 && date.getDate() === 27 && date.getFullYear() === 2025;
      });
      
      console.log(`March 26, 2025 workouts: ${march26Workouts.length}`);
      console.log(`March 27, 2025 workouts: ${march27Workouts.length}`);
    }
  }, [clientWorkouts]);
  
  return (
    <Container className="px-0 sm:px-4 mx-auto w-full max-w-screen-md">
      <div className="w-full">
        <Tabs defaultValue="team" className="mb-6 w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="team" className="flex-1 flex items-center justify-center gap-2">
              <Users className="h-4 w-4" />
              <span>Team</span>
            </TabsTrigger>
            <TabsTrigger value="personal" className="flex-1 flex items-center justify-center gap-2">
              <User className="h-4 w-4" />
              <span>Personal</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="team" className="w-full">
            <WeekProgressSection showTeam={true} showPersonal={false} />
          </TabsContent>
          
          <TabsContent value="personal" className="w-full px-2">
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
        </Tabs>
      </div>
    </Container>
  );
};

export default LeaderboardPage;
