
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { WeekProgressSection } from '@/components/client/WeekProgressSection';
import { MonthlyCalendarView } from '@/components/client/MonthlyCalendarView';
import { PersonalRecordsTable, PersonalRecord } from '@/components/client/PersonalRecordsTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, User, Loader2, Trophy } from 'lucide-react';
import { fetchClientWorkoutHistory } from '@/services/workout-history-service';
import { supabase } from '@/integrations/supabase/client';

const LeaderboardPage = () => {
  const { user } = useAuth();
  
  const { data: clientWorkouts, isLoading } = useQuery({
    queryKey: ['client-workouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return fetchClientWorkoutHistory(user.id);
    },
    enabled: !!user?.id,
  });

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
  
  return (
    <div className="container mx-auto px-1 sm:px-2">
      <h1 className="text-2xl font-bold mb-6">Team Progress</h1>
      
      <Tabs defaultValue="team" className="mb-6">
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
        
        <TabsContent value="team">
          <WeekProgressSection showTeam={true} showPersonal={false} />
        </TabsContent>
        
        <TabsContent value="personal">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-client" />
            </div>
          ) : (
            <>
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
  );
};

export default LeaderboardPage;
