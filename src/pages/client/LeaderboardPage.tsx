
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { WeekProgressSection } from '@/components/client/WeekProgressSection';
import { MonthlyCalendarView } from '@/components/client/MonthlyCalendarView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, User, Loader2 } from 'lucide-react';
import { fetchClientWorkoutHistory } from '@/services/workout-history-service';

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
  
  return (
    <div className="container max-w-4xl mx-auto px-4">
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
              <WeekProgressSection showTeam={false} showPersonal={true} />
              
              <h2 className="text-xl font-bold mb-4 mt-6 flex items-center gap-2">
                <User className="h-5 w-5 text-client" />
                Monthly Progress
              </h2>
              
              <MonthlyCalendarView workouts={clientWorkouts || []} />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeaderboardPage;
