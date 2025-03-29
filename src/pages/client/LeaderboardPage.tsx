
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WeekProgressSection } from '@/components/client/WeekProgressSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, User } from 'lucide-react';
import { Container } from '@/components/ui/container';

const LeaderboardPage = () => {
  const { user } = useAuth();
  
  return (
    <Container className="px-0 sm:px-4 mx-auto w-full max-w-screen-md">
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
          
          <TabsContent value="personal" className="w-full px-2">
            <WeekProgressSection 
              showTeam={false} 
              showPersonal={true}
              workoutTypesMap={{}}
            />
          </TabsContent>
          
          <TabsContent value="team" className="w-full">
            <WeekProgressSection 
              showTeam={true} 
              showPersonal={false}
              workoutTypesMap={{}}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Container>
  );
};

export default LeaderboardPage;
