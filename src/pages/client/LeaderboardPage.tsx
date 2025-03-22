
import React from 'react';
import { WeekProgressSection } from '@/components/client/WeekProgressSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, User } from 'lucide-react';

const LeaderboardPage = () => {
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
          <WeekProgressSection showTeam={false} showPersonal={true} />
        </TabsContent>
      </Tabs>
      
      {/* Additional leaderboard content would go here */}
      <div className="bg-white rounded-xl p-6 shadow-sm text-center">
        <p className="text-muted-foreground">Detailed leaderboard data coming soon</p>
      </div>
    </div>
  );
};

export default LeaderboardPage;
