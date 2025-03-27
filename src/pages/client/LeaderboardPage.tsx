
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { WeekProgressSection } from '@/components/client/WeekProgressSection';
import { MonthlyCalendarView } from '@/components/client/MonthlyCalendarView';
import { PersonalRecordsTable, PersonalRecord } from '@/components/client/PersonalRecordsTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, User, Loader2, Trophy, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchClientWorkoutHistory, getWeeklyAssignedWorkoutsCount } from '@/services/workout-history-service';
import { supabase } from '@/integrations/supabase/client';
import { Container } from '@/components/ui/container';
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format } from 'date-fns';
import { Button } from '@/components/ui/button';

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  
  // Function to navigate to previous week
  const goToPreviousWeek = () => {
    setSelectedWeek(prevWeek => subWeeks(prevWeek, 1));
  };

  // Function to navigate to next week
  const goToNextWeek = () => {
    // Don't allow navigating to future weeks beyond current week
    if (startOfWeek(addWeeks(selectedWeek, 1)) <= startOfWeek(new Date())) {
      setSelectedWeek(prevWeek => addWeeks(prevWeek, 1));
    }
  };
  
  // Calculate start and end of selected week
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 0 });
  
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

  // Query for personal records
  const { data: personalRecords, isLoading: isLoadingPRs } = useQuery({
    queryKey: ['personal-records', user?.id],
    queryFn: async (): Promise<PersonalRecord[]> => {
      if (!user?.id) return [];

      // Fetch personal records and join with exercises to get names
      const { data, error } = await supabase
        .from('personal_records')
        .select(`
          id,
          exercise_id,
          weight,
          reps,
          achieved_at,
          exercises:exercise_id (name)
        `)
        .eq('user_id', user.id)
        .order('weight', { ascending: false });

      if (error) {
        console.error('Error fetching personal records:', error);
        throw error;
      }

      // Transform the data to match our PersonalRecord interface
      return (data || []).map(record => ({
        id: record.id,
        exercise_id: record.exercise_id,
        exercise_name: record.exercises?.name || 'Unknown Exercise',
        weight: record.weight,
        reps: record.reps,
        achieved_at: record.achieved_at
      }));
    },
    enabled: !!user?.id,
  });

  // Determine the weekly target based on assigned workouts, or use default 7 if no assigned workouts
  const totalWeeklyTarget = React.useMemo(() => {
    // If assigned workouts exist, use that count, otherwise use standard 7
    return (typeof assignedCount === 'number' && assignedCount > 0) ? assignedCount : 7;
  }, [assignedCount]);
  
  // Get the current date for comparison
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime();

  return (
    <Container>
      <div className="max-w-full">
        <h1 className="text-2xl font-bold mb-6">Team Progress</h1>
        
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
            <WeekProgressSection 
              showTeam={true} 
              showPersonal={false} 
              selectedDate={selectedWeek}
            />
          </TabsContent>
          
          <TabsContent value="personal" className="w-full">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-client" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={goToPreviousWeek}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </Button>
                  
                  <div className="text-sm font-medium">
                    {format(weekStart, 'MM/dd')} - {format(weekEnd, 'MM/dd')}
                    {isCurrentWeek && <span className="ml-2 text-client">(Current)</span>}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={goToNextWeek}
                    disabled={startOfWeek(addWeeks(selectedWeek, 1)) > startOfWeek(new Date())}
                    className="flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                {!isLoadingAssigned && (
                  <div className="mb-4 bg-muted p-3 rounded-md text-sm flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      {typeof assignedCount === 'number' && assignedCount > 0 ? (
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
                
                <WeekProgressSection 
                  showTeam={false} 
                  showPersonal={true} 
                  selectedDate={selectedWeek}
                />
                
                <h2 className="text-xl font-bold mb-4 mt-6 flex items-center gap-2">
                  <User className="h-5 w-5 text-client" />
                  Monthly Progress
                </h2>
                
                <MonthlyCalendarView workouts={clientWorkouts || []} />
                
                <h2 className="text-xl font-bold mb-4 mt-8 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Personal Records
                </h2>
                
                <PersonalRecordsTable 
                  records={personalRecords || []} 
                  isLoading={isLoadingPRs} 
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
